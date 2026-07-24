import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import confetti from "canvas-confetti";
import { useLevel, useSolution, useUpdateProgress, useUserId } from "@/hooks/use-game";
import { usePowerUps, usePowerUpsStore } from "@/hooks/use-powerups";
import { useAchievements } from "@/hooks/use-achievements";
import { useTheme } from "@/hooks/use-theme";
import { Header } from "@/components/Header";
import { GameCanvas } from "@/components/GameCanvas";
import { WinModal } from "@/components/WinModal";
import { Loader2 } from "lucide-react";

export default function Game() {
  const [, params] = useRoute("/play/:id");
  const [, setLocation] = useLocation();
  const levelId = Number(params?.id);
  const userId = useUserId();
  const { hasActiveEffect, getEffectValue, consumeEffectUse } = usePowerUps();
  const { incrementProgress, checkAchievements } = useAchievements();
  const { getThemeColors } = useTheme();

  const { data: level, isLoading, error } = useLevel(levelId, userId);
  const { data: solution, refetch: fetchHint, isFetching: isHintLoading } = useSolution(levelId);
  const updateProgressMutation = useUpdateProgress();

  const [showHint, setShowHint] = useState(false);
  const [hintUsedThisLevel, setHintUsedThisLevel] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [completedThisSession, setCompletedThisSession] = useState(false);
  const [lives, setLives] = useState(3);
  const [isGameOver, setIsGameOver] = useState(false);
  const [canvasKey, setCanvasKey] = useState(0);
  const [levelStartTime, setLevelStartTime] = useState(Date.now());
  const [score, setScore] = useState(0);

  useEffect(() => {
    const colors = getThemeColors();
    const root = document.documentElement;
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${key}`, value as string);
    });
  }, [getThemeColors]);

  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) event.preventDefault();
    };
    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length > 1) event.preventDefault();
    };
    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  useEffect(() => {
    setShowHint(false);
    setHintUsedThisLevel(false);
    setHasWon(false);
    setCompletedThisSession(false);
    setLives(3);
    setIsGameOver(false);
    setCanvasKey(previous => previous + 1);
    setLevelStartTime(Date.now());
    setScore(0);
  }, [levelId]);

  useEffect(() => {
    if (!showHint) return;
    let duration = 3000;
    if (levelId > 50) duration = 5000;
    if (levelId > 100) duration = 10000;
    const timer = window.setTimeout(() => setShowHint(false), duration);
    return () => window.clearTimeout(timer);
  }, [showHint, levelId]);

  const handleWin = () => {
    if (hasWon || !level) return;
    setHasWon(true);
    setCompletedThisSession(true);

    const colors = getThemeColors();
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: colors.neon });

    const now = Date.now();
    const powerUpState = usePowerUpsStore.getState();
    const freeze = powerUpState.activeEffects.find(effect => effect.type === "time_freeze");
    const frozenTime = freeze ? Math.min(30_000, Math.max(0, now - freeze.activatedAt)) : 0;
    const completionTime = Math.max(0, now - levelStartTime - frozenTime);
    const perfectLevel = !hintUsedThisLevel && lives === 3;
    const isNewCompletion = !level.isCompleted && !completedThisSession;

    if (isNewCompletion) {
      incrementProgress("levels_completed");
      if (perfectLevel) incrementProgress("perfect_levels");
      if (!hintUsedThisLevel) incrementProgress("no_hints_used");
      if (completionTime < 30_000) incrementProgress("speed_run");
    }

    const multiplier = getEffectValue("score_multiplier");
    const baseScore = level.nodes.length * 100
      + lives * 250
      + (hintUsedThisLevel ? 0 : 500)
      + (completionTime < 30_000 ? 500 : 0);
    setScore(Math.round(baseScore * multiplier));
    if (hasActiveEffect("score_multiplier")) consumeEffectUse("score_multiplier");
    powerUpState.removeEffect("time_freeze");

    const newAchievements = checkAchievements();
    if (newAchievements.length > 0) {
      console.info("New achievements unlocked:", newAchievements.map(item => item.name));
    }

    updateProgressMutation.mutate({
      userId,
      levelId,
      completed: true,
      hintsUsed: hintUsedThisLevel,
    });
  };

  const handleHint = async () => {
    if (showHint || hintUsedThisLevel) return;
    const result = await fetchHint();
    if (!result.data?.path?.length) return;
    setShowHint(true);
    setHintUsedThisLevel(true);
    if (hasActiveEffect("path_hint")) {
      usePowerUpsStore.getState().removeEffect("path_hint");
    }
  };

  const handleBacktrack = () => {
    if (hasActiveEffect("undo_protection")) {
      usePowerUpsStore.getState().removeEffect("undo_protection");
      return;
    }
    setLives(currentLives => {
      const nextLives = currentLives - 1;
      if (nextLives <= 0) setIsGameOver(true);
      return nextLives;
    });
  };

  const handleNext = () => {
    setLocation(levelId < 200 ? `/play/${levelId + 1}` : "/");
  };

  if (isGameOver) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background gap-6">
        <div className="text-center space-y-4">
          <h2 className="text-5xl font-orbitron font-bold text-destructive neon-text">GAME OVER</h2>
          <p className="text-muted-foreground font-exo text-lg">You lost all your lives. Return to the menu.</p>
        </div>
        <button
          onClick={() => setLocation("/")}
          className="px-8 py-3 bg-primary text-primary-foreground font-orbitron rounded hover:opacity-90 transition-opacity"
        >
          RETURN TO MENU
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !level) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-destructive gap-4">
        <h2 className="text-2xl font-bold">Level unavailable</h2>
        <p className="text-muted-foreground">The level is invalid or has not been unlocked yet.</p>
        <button onClick={() => setLocation("/")} className="underline">Return to menu</button>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      <Header
        levelId={levelId}
        onHint={handleHint}
        hintsUsed={hintUsedThisLevel}
        isHintLoading={isHintLoading}
        lives={lives}
      />
      <main className="flex-1 relative flex items-center justify-center overflow-hidden px-2 md:px-4 py-2 md:py-4 w-full">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none z-0" />
        <div className="relative z-10 w-full h-full flex items-center justify-center">
          <div className="w-full h-full max-w-4xl max-h-[calc(100vh-120px)]">
            <GameCanvas
              key={canvasKey}
              level={level}
              onComplete={handleWin}
              showHint={showHint}
              hintPath={solution?.path}
              onBacktrack={handleBacktrack}
              onLoseLife={handleBacktrack}
              onWin={handleWin}
            />
          </div>
        </div>
      </main>
      <WinModal
        isOpen={hasWon}
        levelId={levelId}
        score={score}
        onNext={handleNext}
      />
    </div>
  );
}
