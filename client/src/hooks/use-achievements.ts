import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type Achievement, type AchievementRequirement, achievements } from "@/lib/achievements";
import { getPowerUp } from "@/lib/powerups";
import { usePowerUpsStore } from "./use-powerups";
import { useThemeStore } from "./use-theme";

interface AchievementState {
  unlockedAchievements: string[];
  progress: Record<string, number>;
  unlockAchievement: (achievementId: string) => void;
  updateProgress: (requirementType: AchievementRequirement["type"], value: number) => void;
  incrementProgress: (requirementType: AchievementRequirement["type"], amount?: number) => void;
  checkAchievements: () => Achievement[];
  isUnlocked: (achievementId: string) => boolean;
}

export const useAchievementsStore = create<AchievementState>()(
  persist(
    (set, get) => ({
      unlockedAchievements: [],
      progress: {
        levels_completed: 0,
        perfect_levels: 0,
        no_hints_used: 0,
        speed_run: 0,
        power_up_collector: 0,
        theme_collector: 1,
      },
      unlockAchievement: achievementId => set(state =>
        state.unlockedAchievements.includes(achievementId)
          ? state
          : { unlockedAchievements: [...state.unlockedAchievements, achievementId] }
      ),
      updateProgress: (requirementType, value) => set(state => ({
        progress: {
          ...state.progress,
          [requirementType]: Math.max(state.progress[requirementType] || 0, value),
        },
      })),
      incrementProgress: (requirementType, amount = 1) => set(state => ({
        progress: {
          ...state.progress,
          [requirementType]: (state.progress[requirementType] || 0) + amount,
        },
      })),
      checkAchievements: () => {
        const powerUpsStore = usePowerUpsStore.getState();
        const themeStore = useThemeStore.getState();
        get().updateProgress("power_up_collector", powerUpsStore.collectedCount);
        get().updateProgress("theme_collector", themeStore.visitedThemes.length);

        const newlyUnlocked: Achievement[] = [];
        for (const achievement of achievements) {
          if (get().unlockedAchievements.includes(achievement.id)) continue;
          const currentProgress = get().progress[achievement.requirement.type] || 0;
          if (currentProgress < achievement.requirement.value) continue;

          get().unlockAchievement(achievement.id);
          newlyUnlocked.push(achievement);
          if (achievement.reward.type === "power_up") {
            const powerUp = getPowerUp(achievement.reward.value);
            if (powerUp) powerUpsStore.addPowerUp(powerUp);
          } else if (achievement.reward.type === "theme_unlock") {
            themeStore.setTheme(achievement.reward.value);
          }
        }
        return newlyUnlocked;
      },
      isUnlocked: achievementId => get().unlockedAchievements.includes(achievementId),
    }),
    { name: "neon-path-achievements" },
  ),
);

export const useAchievements = () => useAchievementsStore();
