import { Link } from "wouter";
import { ArrowLeft, RefreshCw, Lightbulb, Heart, Settings, Zap, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { PowerUpInventory } from "@/components/PowerUpInventory";
import { AchievementsPanel } from "@/components/AchievementsPanel";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface HeaderProps {
  levelId: number;
  onReset: () => void;
  onHint: () => void;
  hintsUsed: boolean;
  isHintLoading: boolean;
  lives: number;
}

export function Header({ levelId, onReset, onHint, hintsUsed, isHintLoading, lives }: HeaderProps) {
  const [showPowerUps, setShowPowerUps] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);

  return (
    <header className="w-full px-2 md:px-6 py-2 md:py-3 flex items-center justify-between border-b border-white/10 bg-background/80 backdrop-blur-md sticky top-0 z-10 flex-shrink-0 min-h-14 md:min-h-16">
      <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
        <Link href="/" className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0 p-1">
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
        </Link>
        <div className="min-w-0">
          <h2 className="text-xs md:text-lg font-orbitron font-bold text-foreground truncate">
            LEVEL <span className="text-primary neon-text">{levelId}</span>
          </h2>
          <div className="text-[10px] md:text-xs text-muted-foreground font-exo truncate">
            ONE LINE MASTER
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 md:gap-2 flex-shrink-0 ml-auto">
        {/* Lives Display */}
        <div className="flex items-center gap-0.5 md:gap-1.5 flex-shrink-0">
          {Array.from({ length: 3 }).map((_, i) => (
            <Heart
              key={i}
              className={`w-3 h-3 md:w-4 md:h-4 transition-all flex-shrink-0 ${
                i < lives 
                  ? 'fill-destructive text-destructive' 
                  : 'text-muted-foreground/30'
              }`}
            />
          ))}
        </div>

        {/* Power-ups Button */}
        <Dialog open={showPowerUps} onOpenChange={setShowPowerUps}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="border-white/10 hover:border-yellow-500/50 hover:bg-yellow-500/10 text-yellow-400 hover:text-yellow-300 p-1.5 h-auto md:p-2 md:h-9 flex-shrink-0"
            >
              <Zap className="w-3 h-3 md:w-4 md:h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Power-ups
              </DialogTitle>
            </DialogHeader>
            <PowerUpInventory />
          </DialogContent>
        </Dialog>

        {/* Achievements Button */}
        <Dialog open={showAchievements} onOpenChange={setShowAchievements}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="border-white/10 hover:border-yellow-500/50 hover:bg-yellow-500/10 text-yellow-400 hover:text-yellow-300 p-1.5 h-auto md:p-2 md:h-9 flex-shrink-0"
            >
              <Trophy className="w-3 h-3 md:w-4 md:h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Achievements
              </DialogTitle>
            </DialogHeader>
            <AchievementsPanel />
          </DialogContent>
        </Dialog>

        <div className="flex gap-0.5 md:gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            aria-label="Restart level"
            title="Restart level"
            className="border-primary/50 bg-primary/5 text-primary shadow-[0_0_8px_rgba(0,243,255,0.15)] hover:border-primary hover:bg-primary/15 hover:text-primary hover:shadow-[0_0_14px_rgba(0,243,255,0.3)] p-1.5 h-auto md:p-2 md:h-9 flex-shrink-0"
          >
            <RefreshCw className="w-3 h-3 md:w-4 md:h-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onHint}
            disabled={hintsUsed || isHintLoading}
            className={`
              border-white/10 transition-all duration-300 p-1.5 h-auto md:p-2 md:h-9 flex-shrink-0
              ${hintsUsed 
                ? 'opacity-50 cursor-not-allowed text-muted-foreground' 
                : 'hover:border-secondary/50 hover:bg-secondary/10 text-secondary hover:text-secondary-foreground hover:shadow-[0_0_15px_rgba(138,43,226,0.3)]'
              }
            `}
          >
            <Lightbulb className={`w-3 h-3 md:w-4 md:h-4 flex-shrink-0 ${isHintLoading ? 'animate-pulse' : ''}`} />
          </Button>
        </div>
      </div>
    </header>
  );
}
