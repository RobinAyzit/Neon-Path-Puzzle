import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Play, Home, Copy, Check } from "lucide-react";
import { Link } from "wouter";
import { generateLevelCode } from "@/lib/levelCodes";
import { useState } from "react";

interface WinModalProps {
  isOpen: boolean;
  levelId: number;
  score: number;
  onNext: () => void;
}

export function WinModal({ isOpen, levelId, score, onNext }: WinModalProps) {
  const [codeCopied, setCodeCopied] = useState(false);
  const levelCode = generateLevelCode(levelId);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(levelCode);
      setCodeCopied(true);
      window.setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      setCodeCopied(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-full max-w-md bg-card/90 border border-primary/30 p-8 rounded-2xl shadow-[0_0_50px_rgba(0,243,255,0.15)] relative overflow-hidden"
          >
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 blur-[60px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-secondary/20 blur-[60px] rounded-full pointer-events-none" />
            <div className="text-center space-y-6 relative z-10">
              <div>
                <motion.h2
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  className="text-4xl font-orbitron font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary neon-text pb-2"
                >
                  LEVEL CLEARED!
                </motion.h2>
                <p className="text-muted-foreground font-exo">Amazing puzzle solving skills.</p>
                <p className="mt-3 text-2xl font-orbitron font-bold text-primary">{score.toLocaleString()} PTS</p>
              </div>

              {levelId >= 10 && (
                <div className="bg-secondary/10 border border-secondary/30 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-exo text-muted-foreground">
                    Level {levelId} completion code:
                  </p>
                  <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex items-center justify-center gap-3">
                    <code className="text-3xl font-mono font-bold text-secondary tracking-widest">{levelCode}</code>
                    <button
                      onClick={handleCopyCode}
                      aria-label="Copy level code"
                      className="p-2 hover:bg-secondary/20 rounded transition-colors"
                    >
                      {codeCopied
                        ? <Check className="w-5 h-5 text-secondary" />
                        : <Copy className="w-5 h-5 text-secondary/60 hover:text-secondary" />}
                    </button>
                  </motion.div>
                </div>
              )}

              <div className="flex flex-col gap-3 pt-4">
                <Button
                  size="lg"
                  onClick={onNext}
                  className="w-full bg-primary hover:bg-primary/90 text-background font-bold h-12 text-lg shadow-[0_0_20px_rgba(0,243,255,0.4)]"
                >
                  <Play className="w-5 h-5 mr-2" />
                  {levelId < 200 ? "Next Level" : "Finish"}
                </Button>
                <div className="flex gap-3">
                  <Link href="/" className="w-full">
                    <Button variant="outline" className="w-full border-white/10 hover:bg-white/5">
                      <Home className="w-4 h-4 mr-2" /> Menu
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
