import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Lock, CheckCircle, Heart, Play, HelpCircle, Trophy, Zap, Shield, Star, Palette, Check } from "lucide-react";
import { generateLevelCode, getLevelFromCode } from "@/lib/levelCodes";
import { getLevelMessage } from "@/lib/levelMessages";
import { useLevels, useUserId } from "@/hooks/use-game";
import { useTheme } from "@/hooks/use-theme";
import { themes } from "@/lib/themes";
import { playClickSound } from "@/lib/sounds";

interface StartMenuProps {
  onStart: () => void;
  onStartLevel?: (levelId: number) => void;
}

type MenuScreen = "main" | "info" | "completed";

function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { getThemeColors } = useTheme();
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    let animationId: number;
    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] = [];
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.5 + 0.1
      });
    }
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const colors = getThemeColors();
      
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = colors.primary + Math.floor(p.alpha * 255).toString(16).padStart(2, '0');
        ctx.fill();
        
        // Connect nearby particles
        particles.forEach(p2 => {
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = colors.primary + Math.floor(0.1 * (1 - dist / 150) * 255).toString(16).padStart(2, '0');
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });
      
      animationId = requestAnimationFrame(animate);
    };
    animate();
    
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, [getThemeColors]);
  
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
}

function GlowingOrb({ className, color = "#00f3ff" }: { className?: string; color?: string }) {
  return (
    <div className={`absolute rounded-full blur-[100px] opacity-30 ${className}`} style={{ background: color }} />
  );
}

function ThemeButton() {
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const { currentTheme, setTheme } = useTheme();
  
  return (
    <>
      <Button
        onClick={() => setShowThemeSelector(true)}
        variant="outline"
        className={`
          h-14 text-base font-orbitron border-accent/50 text-accent
          hover:bg-accent/10 hover:border-accent hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]
          transition-all duration-300
        `}
      >
        <Palette className="w-5 h-5 mr-2" />
        Theme
      </Button>
      
      {showThemeSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="w-full max-w-md bg-gradient-to-br from-[#0a0f1e] to-[#1a1a2e] border border-primary/30 p-6 rounded-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary" />
            
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-orbitron font-bold text-primary">Choose Theme</h3>
              <button
                onClick={() => setShowThemeSelector(false)}
                className="p-2 text-primary hover:text-secondary transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-2">
              {themes.map((theme) => {
                const isActive = currentTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => {
                      setTheme(theme.id);
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      isActive
                        ? 'border-primary bg-primary/10'
                        : 'border-white/20 hover:border-primary/50 hover:bg-accent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-white">{theme.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {theme.description}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {theme.colors.neon.slice(0, 3).map((color, idx) => (
                            <div
                              key={idx}
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        {isActive && <Check className="w-4 h-4 text-primary" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => setShowThemeSelector(false)}
                className="bg-primary text-black font-bold hover:bg-primary/90"
              >
                Done
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}

export function StartMenu({ onStart, onStartLevel }: StartMenuProps) {
  const [screen, setScreen] = useState<MenuScreen>("main");
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState("");
  const [selectedLevelMessage, setSelectedLevelMessage] = useState<{ id: number; message: string } | null>(null);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const userId = useUserId();
  const { data: levels, refetch } = useLevels(userId);

  const handleButtonClick = (callback: () => void, buttonId: string) => {
    playClickSound();
    callback();
  };

  const handleStartClick = () => {
    if (onStartLevel) {
      onStartLevel(1);
    } else {
      onStart();
    }
  };

  const completedLevels = levels?.filter(l => l.isCompleted) || [];

  const handleShowCompleted = () => {
    refetch();
    setScreen("completed");
  };

  const handleLevelClick = (levelId: number) => {
    const message = getLevelMessage(levelId);
    setSelectedLevelMessage({ id: levelId, message });
  };

  const handleCodeSubmit = () => {
    setCodeError("");
    const levelId = getLevelFromCode(codeInput);

    if (!levelId) {
      setCodeError("Invalid code. Please check and try again.");
      return;
    }

    const isLevelCompleted = completedLevels.some(l => l.id === levelId);
    if (!isLevelCompleted && levelId < 10) {
      setCodeError("This level hasn't been unlocked yet.");
      return;
    }

    setLocation(`/play/${levelId}`);
  };

  return (
    <div className="h-screen w-full relative overflow-hidden bg-[#0a0f1e]">
      <ParticleBackground />
      
      <GlowingOrb className="w-[600px] h-[600px] -top-40 -left-40" color="#00f3ff" />
      <GlowingOrb className="w-[500px] h-[500px] top-1/2 -right-40" color="#8a2be2" />
      <GlowingOrb className="w-[400px] h-[400px] -bottom-40 left-1/3" color="#00f3ff" />

      <div className="relative z-10 h-full overflow-y-auto">
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
          <AnimatePresence mode="wait">
            {screen === "main" ? (
              <motion.div
                key="main"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full max-w-xl"
              >
                <div className="text-center space-y-8">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  >
                    <div className="relative inline-block">
                      <motion.div
                        animate={{ 
                          boxShadow: [
                            "0 0 20px rgba(0,243,255,0.3)",
                            "0 0 40px rgba(0,243,255,0.5)",
                            "0 0 20px rgba(0,243,255,0.3)"
                          ]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-32 h-32 mx-auto rounded-full border-2 border-primary flex items-center justify-center"
                      >
                        <Zap className="w-16 h-16 text-primary" />
                      </motion.div>
                      <motion.div
                        className="absolute -inset-4 rounded-full border border-primary/30"
                        animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                  </motion.div>

                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-5xl md:text-7xl font-orbitron font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-primary to-white tracking-wider"
                    style={{ 
                      textShadow: "0 0 40px rgba(0,243,255,0.5)",
                      filter: "drop-shadow(0 0 20px rgba(0,243,255,0.3))"
                    }}
                  >
                    NEON PATH
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-lg text-cyan-200/80 font-exo"
                  >
                    Connect the nodes. One continuous line.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="flex flex-col gap-4"
                  >
                    <Button
                      onClick={() => handleButtonClick(handleStartClick, "start")}
                      onMouseEnter={() => setHoveredButton("start")}
                      onMouseLeave={() => setHoveredButton(null)}
                      className={`
                        relative group h-16 text-xl font-bold font-orbitron overflow-hidden
                        bg-gradient-to-r from-primary via-primary to-secondary
                        hover:from-white hover:via-primary hover:to-secondary
                        text-black transition-all duration-300
                        ${hoveredButton === "start" ? "scale-105 shadow-[0_0_40px_rgba(0,243,255,0.5)]" : "shadow-[0_0_20px_rgba(0,243,255,0.3)]"}
                      `}
                    >
                      <span className="relative z-10 flex items-center justify-center gap-3">
                        <Play className="w-6 h-6" />
                        START GAME
                      </span>
                      <motion.div
                        className="absolute inset-0 bg-white/20"
                        initial={{ x: "-100%" }}
                        whileHover={{ x: "100%" }}
                        transition={{ duration: 0.5 }}
                      />
                    </Button>

                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        onClick={() => handleButtonClick(() => setScreen("info"), "info")}
                        onMouseEnter={() => setHoveredButton("info")}
                        onMouseLeave={() => setHoveredButton(null)}
                        variant="outline"
                        className={`
                          h-14 text-base font-orbitron border-primary/50 text-primary
                          hover:bg-primary/10 hover:border-primary hover:shadow-[0_0_20px_rgba(0,243,255,0.2)]
                          transition-all duration-300
                        `}
                      >
                        <HelpCircle className="w-5 h-5 mr-2" />
                        How to Play
                      </Button>

                      <Button
                        onClick={() => handleButtonClick(handleShowCompleted, "completed")}
                        onMouseEnter={() => setHoveredButton("completed")}
                        onMouseLeave={() => setHoveredButton(null)}
                        variant="outline"
                        className={`
                          h-14 text-base font-orbitron border-secondary/50 text-secondary
                          hover:bg-secondary/10 hover:border-secondary hover:shadow-[0_0_20px_rgba(138,43,226,0.2)]
                          transition-all duration-300
                        `}
                      >
                        <Trophy className="w-5 h-5 mr-2" />
                        Completed
                      </Button>
                    </div>

                    <ThemeButton />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="pt-8"
                  >
                    <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl p-6 space-y-4">
                      <p className="text-sm text-muted-foreground font-exo">Have a level code?</p>
                      <div className="grid w-full grid-cols-[minmax(0,1fr)_3.5rem] gap-2 sm:grid-cols-[minmax(0,1fr)_4.5rem] sm:gap-3">
                        <input
                          type="text"
                          maxLength={4}
                          placeholder="0000"
                          value={codeInput}
                          onChange={(e) => {
                            setCodeInput(e.target.value.replace(/\D/g, ""));
                            setCodeError("");
                          }}
                          onKeyDown={(e) => e.key === "Enter" && handleCodeSubmit()}
                          className="w-full min-w-0 px-3 py-3 text-center text-2xl font-mono font-bold bg-white/5 border border-primary/30 rounded-lg text-primary placeholder-muted-foreground focus:outline-none focus:border-primary focus:shadow-[0_0_20px_rgba(0,243,255,0.2)] transition-all sm:px-4"
                        />
                        <Button
                          onClick={handleCodeSubmit}
                          disabled={codeInput.length !== 4}
                          className="h-full w-full min-w-0 px-0 bg-secondary hover:bg-secondary/90 text-black font-bold disabled:opacity-30"
                        >
                          GO
                        </Button>
                      </div>
                      {codeError && (
                        <p className="text-destructive text-sm font-exo">{codeError}</p>
                      )}
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    className="flex justify-center gap-8 pt-4"
                  >
                    <div className="text-center">
                      <div className="text-3xl font-orbitron font-bold text-primary">{completedLevels.length}</div>
                      <div className="text-xs text-muted-foreground font-exo">COMPLETED</div>
                    </div>
                    <div className="w-px bg-white/10" />
                    <div className="text-center">
                      <div className="text-3xl font-orbitron font-bold text-secondary">200</div>
                      <div className="text-xs text-muted-foreground font-exo">TOTAL LEVELS</div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.4 }}
                    className="pt-8 text-center"
                  >
                    <p className="text-xs text-muted-foreground/60 font-exo">
                      © 2026 nRn World
                    </p>
                    <a href="#/privacy" className="mt-2 inline-block text-xs text-primary/70 hover:text-primary transition-colors">
                      Privacy Policy
                    </a>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <a 
                        href="mailto:bynrnworld@gmail.com"
                        className="text-xs text-muted-foreground/40 font-exo hover:text-primary transition-colors"
                      >
                        bynrnworld@gmail.com
                      </a>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText('bynrnworld@gmail.com');
                          alert('Email copied to clipboard!');
                        }}
                        className="text-xs text-muted-foreground/30 hover:text-primary transition-colors"
                        title="Copy email"
                      >
                        (copy)
                      </button>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            ) : screen === "info" ? (
              <motion.div
                key="info"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="w-full max-w-2xl"
              >
                <div className="bg-black/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-4xl font-orbitron font-bold text-primary neon-text">
                      HOW TO PLAY
                    </h2>
                    <button
                      onClick={() => handleButtonClick(() => setScreen("main"), "close")}
                      className="p-2 text-primary hover:text-secondary transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <div className="space-y-4 bg-muted/20 border border-primary/20 rounded-lg p-6 font-exo">
                    <div>
                      <h3 className="text-lg font-bold text-primary mb-2">OBJECTIVE</h3>
                      <p className="text-muted-foreground">
                        Connect all nodes with a single continuous line. Each node must be visited exactly once, and your path cannot cross itself.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-secondary mb-2">CONTROLS</h3>
                      <ul className="text-muted-foreground space-y-1">
                        <li>- Click to place your path</li>
                        <li>- Click & Drag to draw your solution</li>
                        <li>- Clear button to reset and try again</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-primary mb-2">LIVES & BACKTRACKING</h3>
                      <ul className="text-muted-foreground space-y-1">
                        <li>- You start each level with 3 lives</li>
                        <li>- Each backtrack costs 1 life</li>
                        <li>- Lose all lives = Game Over (restart from Level 1)</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-secondary mb-2">HINTS & LEVEL CODES</h3>
                      <ul className="text-muted-foreground space-y-1">
                        <li>- Use hint to see the solution (visible for 3 seconds)</li>
                        <li>- Only 1 hint per level</li>
                        <li>- After completing Level 10, you will unlock unique codes</li>
                        <li>- Each level has a unique 4-digit code to jump directly to it</li>
                        <li>- Enter the code in the menu to skip to that level</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-primary mb-2">MOTIVATIONAL MESSAGES</h3>
                      <ul className="text-muted-foreground space-y-1">
                        <li>- Each level you complete comes with a unique positive message</li>
                        <li>- Go to Completed to see all your finished levels</li>
                        <li>- Click any completed level to read its special message</li>
                        <li>- Every new level you unlock has a fresh message waiting for you</li>
                        <li>- 100 unique messages for 100 levels of encouragement and support</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-primary mb-2">PROGRESSION</h3>
                      <p className="text-muted-foreground mb-2">
                        Complete levels sequentially to unlock the next challenges. 100 levels of increasing difficulty await you in the cyber-logic puzzle matrix. Codes are only valid for completed levels.
                      </p>
                      <p className="text-muted-foreground">
                        <span className="text-secondary font-bold">ELITE CHALLENGE (Levels 101-200):</span> Complete all 100 main levels to unlock the ultimate difficulty tier. These 100 additional levels feature extreme puzzles for champions. Both tiers combined = 200 total levels of relentless progression.
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleButtonClick(() => setScreen("main"), "back")}
                    className="w-full px-8 py-6 text-lg font-exo font-semibold bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
                  >
                    BACK TO MENU
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="completed"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="w-full max-w-4xl"
              >
                <div className="bg-black/50 backdrop-blur-xl border border-secondary/20 rounded-2xl p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-4xl font-orbitron font-bold text-secondary neon-text">
                      COMPLETED LEVELS
                    </h2>
                    <button
                      onClick={() => handleButtonClick(() => setScreen("main"), "close2")}
                      className="p-2 text-secondary hover:text-primary transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <div className="bg-muted/20 border border-secondary/20 rounded-lg p-6">
                    <div className="mb-8">
                      <h3 className="text-lg font-orbitron font-bold text-primary mb-3">LEVELS 1-100</h3>
                      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-3">
                        {Array.from({ length: 100 }).map((_, idx) => {
                          const levelId = idx + 1;
                          const isCompleted = completedLevels.some(l => l.id === levelId);
                          return (
                            <motion.button
                              key={levelId}
                              onClick={() => isCompleted && handleButtonClick(() => handleLevelClick(levelId), `level-${levelId}`)}
                              disabled={!isCompleted}
                              whileHover={isCompleted ? { scale: 1.1 } : {}}
                              whileTap={isCompleted ? { scale: 0.95 } : {}}
                              className={`
                                relative aspect-square flex items-center justify-center rounded-lg font-orbitron font-bold text-sm
                                transition-all duration-200 disabled:cursor-not-allowed
                                ${isCompleted
                                  ? "bg-gradient-to-br from-primary to-secondary text-black shadow-[0_0_15px_rgba(0,243,255,0.4)]"
                                  : "bg-white/5 text-white/20"
                                }
                              `}
                            >
                              {levelId}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-orbitron font-bold text-secondary mb-3 flex items-center gap-2">
                        LEVELS 101-200
                        {completedLevels.length < 100 && (
                          <Lock className="w-4 h-4 text-destructive" />
                        )}
                      </h3>
                      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-3">
                        {Array.from({ length: 100 }).map((_, idx) => {
                          const levelId = idx + 101;
                          const isCompleted = completedLevels.some(l => l.id === levelId);
                          const allFirstHundredCompleted = completedLevels.length === 100;
                          const isUnlocked = allFirstHundredCompleted;
                          return (
                            <motion.button
                              key={levelId}
                              onClick={() => isCompleted && handleButtonClick(() => handleLevelClick(levelId), `level-${levelId}`)}
                              disabled={!isCompleted || !isUnlocked}
                              whileHover={isCompleted && isUnlocked ? { scale: 1.1 } : {}}
                              whileTap={isCompleted && isUnlocked ? { scale: 0.95 } : {}}
                              className={`
                                relative aspect-square flex items-center justify-center rounded-lg font-orbitron font-bold text-sm
                                transition-all duration-200 disabled:cursor-not-allowed
                                ${!isUnlocked
                                  ? "bg-white/5 text-white/10"
                                  : isCompleted
                                    ? "bg-gradient-to-br from-secondary to-primary text-black shadow-[0_0_15px_rgba(138,43,226,0.4)]"
                                    : "bg-white/5 text-white/20"
                                }
                              `}
                            >
                              {levelId}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    <p className="mt-6 text-center text-muted-foreground font-exo text-sm">
                      Progress: <span className="text-primary">{completedLevels.length}</span> / 200 levels completed
                    </p>
                  </div>

                  <Button
                    onClick={() => handleButtonClick(() => setScreen("main"), "back2")}
                    className="w-full px-8 py-6 text-lg font-exo font-semibold bg-gradient-to-r from-secondary to-primary hover:opacity-90 transition-opacity"
                  >
                    BACK TO MENU
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {selectedLevelMessage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                onClick={() => setSelectedLevelMessage(null)}
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-md bg-gradient-to-br from-[#0a0f1e] to-[#1a1a2e] border border-primary/30 p-8 rounded-2xl relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary" />
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 blur-[60px] rounded-full" />
                  <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-secondary/20 blur-[60px] rounded-full" />

                  <div className="text-center space-y-6 relative z-10">
                    <motion.div
                      animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    >
                      <Heart className="w-16 h-16 text-primary mx-auto fill-primary" />
                    </motion.div>

                    <div>
                      <h3 className="text-2xl font-orbitron font-bold text-secondary mb-2">
                        LEVEL {selectedLevelMessage.id}
                      </h3>
                      <p className="text-lg font-exo text-primary neon-text leading-relaxed">
                        "{selectedLevelMessage.message}"
                      </p>
                    </div>

                    <Button
                      onClick={() => setSelectedLevelMessage(null)}
                      className="w-full h-12 bg-primary text-black font-bold hover:bg-primary/90"
                    >
                      CLOSE
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
