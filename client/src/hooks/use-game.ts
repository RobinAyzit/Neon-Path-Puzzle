import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { v4 as uuidv4 } from "uuid";
import { useState } from "react";
import { generateLevel } from "@shared/level-generator";
import { getCodeUnlockedThrough } from "@/lib/sessionLevelUnlock";

export function useUserId() {
  const [userId] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    try {
      let id = localStorage.getItem("one_line_user_id");
      if (!id) {
        id = uuidv4();
        localStorage.setItem("one_line_user_id", id);
      }
      return id;
    } catch {
      console.warn("localStorage is disabled or restricted, falling back to session ID");
      return uuidv4();
    }
  });
  return userId;
}

const STORAGE_KEY = "neon_path_progress";
type LocalProgress = { completed: number[]; hints: number[] };
const fallbackProgress: Record<string, LocalProgress> = {};

function normalizeProgress(value: unknown): LocalProgress {
  if (!value || typeof value !== "object") return { completed: [], hints: [] };
  const candidate = value as Partial<LocalProgress>;
  return {
    completed: Array.isArray(candidate.completed)
      ? candidate.completed.filter(id => Number.isInteger(id) && id >= 1 && id <= 200)
      : [],
    hints: Array.isArray(candidate.hints)
      ? candidate.hints.filter(id => Number.isInteger(id) && id >= 1 && id <= 200)
      : [],
  };
}

function getLocalProgress(userId: string): LocalProgress {
  try {
    const data = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
    return data ? normalizeProgress(JSON.parse(data)) : { completed: [], hints: [] };
  } catch {
    return fallbackProgress[userId] || { completed: [], hints: [] };
  }
}

function saveLocalProgress(userId: string, levelId: number, completed: boolean, hintUsed: boolean) {
  const progress = getLocalProgress(userId);
  if (completed && !progress.completed.includes(levelId)) progress.completed.push(levelId);
  if (hintUsed && !progress.hints.includes(levelId)) progress.hints.push(levelId);
  try {
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(progress));
  } catch {
    fallbackProgress[userId] = progress;
  }
  return progress;
}

function isLevelLocked(levelId: number, completed: Set<number>, codeUnlockedThrough: number) {
  if (levelId <= codeUnlockedThrough) return false;
  if (levelId === 1) return false;
  if (levelId <= 100) return !completed.has(levelId - 1);
  const firstHundredComplete = Array.from({ length: 100 }, (_, index) => index + 1)
    .every(id => completed.has(id));
  return !firstHundredComplete || !completed.has(levelId - 1);
}

export function useLevels(userId?: string) {
  const codeUnlockedThrough = getCodeUnlockedThrough();
  return useQuery({
    queryKey: [api.levels.list.path, userId, codeUnlockedThrough],
    queryFn: async () => {
      if (!userId) return [];
      const progress = getLocalProgress(userId);
      const completed = new Set(progress.completed);
      const hints = new Set(progress.hints);
      return Array.from({ length: 200 }, (_, index) => {
        const id = index + 1;
        return {
          id,
          isCompleted: completed.has(id),
          isLocked: isLevelLocked(id, completed, codeUnlockedThrough),
          hintsUsed: hints.has(id),
        };
      });
    },
    enabled: !!userId,
  });
}

export function useLevel(id: number, userId?: string) {
  const codeUnlockedThrough = getCodeUnlockedThrough();
  return useQuery({
    queryKey: [api.levels.get.path, id, userId, codeUnlockedThrough],
    queryFn: async () => {
      if (!Number.isInteger(id) || id < 1 || id > 200) throw new Error("Invalid level");
      if (!userId) throw new Error("Missing player id");
      const progress = getLocalProgress(userId);
      const completed = new Set(progress.completed);
      if (isLevelLocked(id, completed, codeUnlockedThrough)) throw new Error("Level is locked");
      const level = generateLevel(id);
      return {
        id: level.id,
        gridSize: level.gridSize,
        start: level.start,
        nodes: level.nodes,
        isLocked: false,
        isCompleted: completed.has(id),
      };
    },
    enabled: !!userId && Number.isInteger(id) && id >= 1 && id <= 200,
  });
}

export function useSolution(id: number) {
  return useQuery({
    queryKey: [api.levels.solution.path, id],
    queryFn: async () => ({ path: generateLevel(id).solution }),
    enabled: false,
  });
}

export function useUpdateProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { userId: string; levelId: number; completed: boolean; hintsUsed: boolean }) => {
      saveLocalProgress(data.userId, data.levelId, data.completed, data.hintsUsed);
      return { success: true };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.levels.list.path] }),
  });
}

export function useUserProgress(userId: string) {
  return useQuery({
    queryKey: [api.progress.get.path, userId],
    queryFn: async () => {
      const progress = getLocalProgress(userId);
      return {
        currentLevel: Math.min(200, Math.max(1, progress.completed.length + 1)),
        unlockedLevels: progress.completed,
        completedLevels: progress.completed,
      };
    },
    enabled: !!userId,
  });
}
