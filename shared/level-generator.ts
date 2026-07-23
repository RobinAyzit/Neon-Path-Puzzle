import { type Point } from "@shared/schema";

function mulberry32(seed: number) {
  return function random() {
    let value = seed += 0x6D2B79F5;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

export interface GeneratedLevel {
  id: number;
  gridSize: number;
  start: Point;
  nodes: Point[];
  solution: Point[];
}

function getLevelShape(levelId: number) {
  let difficulty: number;
  if (levelId <= 4) difficulty = 0.2 + (levelId / 4) * 0.15;
  else if (levelId <= 10) difficulty = 0.35 + ((levelId - 4) / 6) * 0.35;
  else if (levelId <= 20) difficulty = 0.70 + ((levelId - 10) / 10) * 0.20;
  else if (levelId <= 31) difficulty = 0.90 + ((levelId - 20) / 11) * 0.10;
  else if (levelId <= 100) difficulty = 1;
  else if (levelId <= 130) difficulty = 1 + ((levelId - 100) / 30) * 0.15;
  else if (levelId <= 170) difficulty = 1.15 + ((levelId - 130) / 40) * 0.2;
  else difficulty = 1.35 + ((levelId - 170) / 30) * 0.15;

  let gridSize = 3;
  if (levelId > 4) gridSize = 4;
  if (levelId > 10) gridSize = 5;
  if (levelId > 16) gridSize = 6;
  if (levelId > 31) gridSize = 7;
  if (levelId > 60) gridSize = 8;

  let coverage = 0.4 + difficulty * 0.5;
  if (levelId <= 5) coverage = Math.max(0.65, coverage);
  else if (levelId <= 15) coverage = Math.max(0.75, coverage);
  else if (levelId <= 31) coverage = Math.max(0.85, coverage);
  if (levelId > 100) coverage = Math.min(0.95, coverage * 1.1);

  return {
    gridSize,
    targetLength: Math.max(3, Math.floor(gridSize * gridSize * coverage)),
  };
}

function key(point: Point) {
  return `${point.x},${point.y}`;
}

function neighbors(point: Point, size: number) {
  return [
    { x: point.x, y: point.y - 1 },
    { x: point.x, y: point.y + 1 },
    { x: point.x - 1, y: point.y },
    { x: point.x + 1, y: point.y },
  ].filter(({ x, y }) => x >= 0 && x < size && y >= 0 && y < size);
}

/** Bounded, deterministic search for a long self-avoiding path. */
function findPath(
  size: number,
  targetLength: number,
  start: Point,
  random: () => number,
): Point[] | null {
  const path: Point[] = [start];
  const visited = new Set([key(start)]);
  let remainingWork = 20_000;

  const extend = (current: Point): boolean => {
    if (path.length === targetLength) return true;
    if (--remainingWork <= 0) return false;

    const candidates = neighbors(current, size)
      .filter(point => !visited.has(key(point)))
      .map(point => ({
        point,
        onward: neighbors(point, size).filter(next => !visited.has(key(next))).length,
        tieBreaker: random(),
      }))
      .sort((a, b) => a.onward - b.onward || a.tieBreaker - b.tieBreaker);

    for (const { point } of candidates) {
      path.push(point);
      visited.add(key(point));
      if (extend(point)) return true;
      visited.delete(key(point));
      path.pop();
      if (remainingWork <= 0) break;
    }
    return false;
  };

  return extend(start) ? path : null;
}

function transform(point: Point, size: number, variant: number): Point {
  const max = size - 1;
  switch (variant % 8) {
    case 0: return point;
    case 1: return { x: max - point.y, y: point.x };
    case 2: return { x: max - point.x, y: max - point.y };
    case 3: return { x: point.y, y: max - point.x };
    case 4: return { x: max - point.x, y: point.y };
    case 5: return { x: point.x, y: max - point.y };
    case 6: return { x: point.y, y: point.x };
    default: return { x: max - point.y, y: max - point.x };
  }
}

function makeSnake(size: number): Point[] {
  const path: Point[] = [];
  for (let y = 0; y < size; y++) {
    if (y % 2 === 0) {
      for (let x = 0; x < size; x++) path.push({ x, y });
    } else {
      for (let x = size - 1; x >= 0; x--) path.push({ x, y });
    }
  }
  return path;
}

function makeEvenGridCycle(size: number): Point[] {
  const cycle: Point[] = [{ x: 0, y: 0 }];
  for (let x = 1; x < size; x++) cycle.push({ x, y: 0 });
  for (let x = size - 1; x >= 1; x--) {
    if ((size - 1 - x) % 2 === 0) {
      for (let y = 1; y < size; y++) cycle.push({ x, y });
    } else {
      for (let y = size - 1; y >= 1; y--) cycle.push({ x, y });
    }
  }
  for (let y = size - 1; y >= 1; y--) cycle.push({ x: 0, y });
  return cycle;
}

/** Always returns an adjacent, non-repeating path in bounded time. */
function makeConstructivePath(size: number, length: number, levelId: number): Point[] {
  if (size % 2 === 0) {
    let cycle = makeEvenGridCycle(size);
    cycle = cycle.map(point => transform(point, size, Math.floor(levelId / size) % 8));
    if (levelId % 2 === 0) cycle.reverse();
    const offset = (levelId * 17 + Math.floor(levelId / 8) * 11) % cycle.length;
    return Array.from({ length }, (_, index) => cycle[(offset + index) % cycle.length]);
  }

  let snake = makeSnake(size).map(point => transform(point, size, levelId % 8));
  if (levelId % 2 === 0) snake.reverse();
  const maxOffset = snake.length - length;
  const offset = maxOffset > 0 ? (levelId * 7) % (maxOffset + 1) : 0;
  return snake.slice(offset, offset + length);
}

const levelCache = new Map<number, GeneratedLevel>();
const usedLayouts = new Set<string>();

function createCandidate(levelId: number, variant: number): GeneratedLevel {
  const { gridSize, targetLength } = getLevelShape(levelId);
  const random = mulberry32(levelId * 9973 + 12345 + variant * 0x9E3779B9);
  let solution: Point[] | null = null;

  for (let attempt = 0; attempt < 4 && !solution; attempt++) {
    const start = {
      x: Math.floor(random() * gridSize),
      y: Math.floor(random() * gridSize),
    };
    solution = findPath(gridSize, targetLength, start, random);
  }

  solution ??= makeConstructivePath(gridSize, targetLength, levelId + variant * 211);

  return {
    id: levelId,
    gridSize,
    start: solution[0],
    nodes: [...solution].sort((a, b) => (a.y - b.y) || (a.x - b.x)),
    solution,
  };
}

function layoutSignature(level: GeneratedLevel) {
  return `${level.gridSize}|${level.nodes.map(node => `${node.x},${node.y}`).join(";")}`;
}

function generateThrough(targetLevelId: number) {
  for (let id = levelCache.size + 1; id <= targetLevelId; id++) {
    let uniqueLevel: GeneratedLevel | undefined;
    for (let variant = 0; variant < 256; variant++) {
      const candidate = createCandidate(id, variant);
      const signature = layoutSignature(candidate);
      if (!usedLayouts.has(signature)) {
        usedLayouts.add(signature);
        uniqueLevel = candidate;
        break;
      }
    }
    if (!uniqueLevel) throw new Error(`Could not create a unique layout for level ${id}`);
    levelCache.set(id, uniqueLevel);
  }
}

export function generateLevel(levelId: number): GeneratedLevel {
  if (!Number.isInteger(levelId) || levelId < 1 || levelId > 200) {
    throw new RangeError(`Level id must be an integer from 1 to 200. Received: ${levelId}`);
  }
  generateThrough(levelId);
  return levelCache.get(levelId)!;
}
