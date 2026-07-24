import assert from "node:assert/strict";
import test from "node:test";

import { generateLevel, type GeneratedLevel } from "./level-generator";
import { type Point } from "./schema";

const levels = Array.from({ length: 200 }, (_, index) => generateLevel(index + 1));

function pointKey(point: Point) {
  return `${point.x},${point.y}`;
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

function canonicalLayout(level: GeneratedLevel) {
  return Array.from({ length: 8 }, (_, variant) => {
    const nodes = level.nodes
      .map(node => transform(node, level.gridSize, variant))
      .sort((a, b) => (a.y - b.y) || (a.x - b.x));
    return `${level.gridSize}|${nodes.map(pointKey).join(";")}`;
  }).sort()[0];
}

function complexity(level: GeneratedLevel) {
  const nodes = new Set(level.nodes.map(pointKey));
  let graphEdges = 0;

  for (const point of level.nodes) {
    if (nodes.has(`${point.x + 1},${point.y}`)) graphEdges++;
    if (nodes.has(`${point.x},${point.y + 1}`)) graphEdges++;
  }

  const extraChoices = graphEdges - (level.nodes.length - 1);
  return level.nodes.length + extraChoices;
}

test("all 200 levels are valid and solvable", () => {
  assert.equal(levels.length, 200);

  for (const level of levels) {
    const nodes = new Set(level.nodes.map(pointKey));
    const solution = new Set(level.solution.map(pointKey));

    assert.equal(nodes.size, level.nodes.length, `Level ${level.id} repeats a node`);
    assert.equal(solution.size, level.solution.length, `Level ${level.id} repeats a solution step`);
    assert.equal(
      level.solution.length,
      level.nodes.length,
      `Level ${level.id} solution does not cover every node`,
    );
    assert.ok(nodes.has(pointKey(level.start)), `Level ${level.id} start is not a node`);

    level.solution.forEach((point, index) => {
      assert.ok(
        point.x >= 0
          && point.x < level.gridSize
          && point.y >= 0
          && point.y < level.gridSize,
        `Level ${level.id} has a point outside its grid`,
      );
      assert.ok(nodes.has(pointKey(point)), `Level ${level.id} solution leaves its node set`);

      if (index > 0) {
        const previous = level.solution[index - 1];
        const distance = Math.abs(point.x - previous.x) + Math.abs(point.y - previous.y);
        assert.equal(distance, 1, `Level ${level.id} contains a non-adjacent move`);
      }
    });
  }
});

test("no two levels match after rotation or reflection", () => {
  const signatures = levels.map(canonicalLayout);
  assert.equal(
    new Set(signatures).size,
    200,
    "Every level must have a visually unique node layout, including symmetry variants",
  );
});

test("difficulty grows through the requested level bands", () => {
  const bands = [
    { from: 1, to: 9, grids: [3, 4] },
    { from: 10, to: 20, grids: [4, 5] },
    { from: 21, to: 29, grids: [5, 6] },
    { from: 30, to: 39, grids: [6] },
    { from: 40, to: 50, grids: [7] },
    { from: 51, to: 100, grids: [8] },
    { from: 101, to: 150, grids: [9] },
    { from: 151, to: 200, grids: [10] },
  ];

  const averages = bands.map(({ from, to, grids }) => {
    const bandLevels = levels.filter(level => level.id >= from && level.id <= to);
    assert.deepEqual(
      [...new Set(bandLevels.map(level => level.gridSize))],
      grids,
      `Levels ${from}-${to} use an unexpected grid size`,
    );
    return bandLevels.reduce((sum, level) => sum + complexity(level), 0) / bandLevels.length;
  });

  for (let index = 1; index < averages.length; index++) {
    assert.ok(
      averages[index] > averages[index - 1],
      `Difficulty band ${index + 1} must be harder than band ${index}`,
    );
  }
});

test("generation is deterministic and invalid ids are rejected", () => {
  for (const level of levels) {
    assert.deepEqual(generateLevel(level.id), level);
  }

  assert.throws(() => generateLevel(0), RangeError);
  assert.throws(() => generateLevel(201), RangeError);
  assert.throws(() => generateLevel(1.5), RangeError);
});
