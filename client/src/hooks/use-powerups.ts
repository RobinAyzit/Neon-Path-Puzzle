import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type PowerUp, type PowerUpEffect } from "@/lib/powerups";

export interface ActiveEffect {
  type: PowerUpEffect["type"];
  value: number;
  activatedAt: number;
  endTime?: number;
  uses?: number;
}

interface PowerUpState {
  inventory: PowerUp[];
  activeEffects: ActiveEffect[];
  collectedCount: number;
  addPowerUp: (powerUp: PowerUp) => void;
  usePowerUp: (powerUpId: string) => boolean;
  hasActiveEffect: (effectType: PowerUpEffect["type"]) => boolean;
  getEffectValue: (effectType: PowerUpEffect["type"]) => number;
  removeEffect: (effectType: PowerUpEffect["type"]) => void;
  consumeEffectUse: (effectType: PowerUpEffect["type"]) => void;
}

export const usePowerUpsStore = create<PowerUpState>()(
  persist(
    (set, get) => ({
      inventory: [],
      activeEffects: [],
      collectedCount: 0,
      addPowerUp: powerUp => set(state => ({
        inventory: [...state.inventory, powerUp],
        collectedCount: state.collectedCount + 1,
      })),
      usePowerUp: powerUpId => {
        const state = get();
        const powerUpIndex = state.inventory.findIndex(powerUp => powerUp.id === powerUpId);
        if (powerUpIndex === -1) return false;

        const powerUp = state.inventory[powerUpIndex];
        const effect: ActiveEffect = {
          type: powerUp.effect.type,
          value: powerUp.effect.value || 1,
          activatedAt: Date.now(),
        };
        if (powerUp.effect.type === "score_multiplier") {
          effect.uses = powerUp.effect.duration || 3;
        } else if (powerUp.effect.duration) {
          effect.endTime = Date.now() + powerUp.effect.duration;
        }

        set(current => ({
          inventory: current.inventory.filter((_, index) => index !== powerUpIndex),
          activeEffects: [
            ...current.activeEffects.filter(active => active.type !== effect.type),
            effect,
          ],
        }));
        return true;
      },
      hasActiveEffect: effectType => {
        const effect = get().activeEffects.find(active => active.type === effectType);
        if (!effect) return false;
        if (effect.endTime && Date.now() > effect.endTime) {
          get().removeEffect(effectType);
          return false;
        }
        return true;
      },
      getEffectValue: effectType => {
        if (!get().hasActiveEffect(effectType)) return 1;
        return get().activeEffects.find(active => active.type === effectType)?.value || 1;
      },
      removeEffect: effectType => set(state => ({
        activeEffects: state.activeEffects.filter(effect => effect.type !== effectType),
      })),
      consumeEffectUse: effectType => set(state => ({
        activeEffects: state.activeEffects.flatMap(effect => {
          if (effect.type !== effectType) return [effect];
          if (!effect.uses || effect.uses <= 1) return [];
          return [{ ...effect, uses: effect.uses - 1 }];
        }),
      })),
    }),
    {
      name: "neon-path-powerups",
      merge: (persisted, current) => {
        const saved = persisted as Partial<PowerUpState>;
        return {
          ...current,
          ...saved,
          collectedCount: saved.collectedCount ?? saved.inventory?.length ?? 0,
          activeEffects: (saved.activeEffects || []).map(effect => ({
            ...effect,
            activatedAt: effect.activatedAt || Date.now(),
          })),
        };
      },
    },
  ),
);

export const usePowerUps = () => usePowerUpsStore();
