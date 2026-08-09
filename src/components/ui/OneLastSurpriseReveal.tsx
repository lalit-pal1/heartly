'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Gift, Sparkles, Smile, RefreshCw, Volume2, ArrowRight } from 'lucide-react';
import CustomButton from './CustomButton';

interface Memory {
  id: string;
  imageUrl: string;
  caption: string;
}

interface OneLastSurpriseRevealProps {
  style: string;
  message: string;
  recipientName: string;
  memories: Memory[];
  onComplete: () => void;
  accentColor: string;
}

export default function OneLastSurpriseReveal({
  style,
  message,
  recipientName,
  memories,
  onComplete,
  accentColor
}: OneLastSurpriseRevealProps) {
  const [internalStage, setInternalStage] = useState<'intro' | 'animating' | 'ready'>('intro');

  // Auto transition from intro to animating
  useEffect(() => {
    const t = setTimeout(() => setInternalStage('animating'), 800);
    return () => clearTimeout(t);
  }, []);

  const renderAnimationContent = () => {
    switch (style) {
      case 'hearts':
        return (
          <HeartsAnimation 
            message={message} 
            onComplete={onComplete} 
            accentColor={accentColor} 
          />
        );
      case 'balloons':
        return (
          <BalloonsAnimation 
            message={message} 
            onComplete={onComplete} 
            accentColor={accentColor} 
          />
        );
      case 'ring':
        return (
          <RingAnimation 
            message={message} 
            onComplete={onComplete} 
            accentColor={accentColor} 
          />
        );
      case 'timeline':
        return (
          <TimelineAnimation 
            message={message} 
            memories={memories}
            onComplete={onComplete} 
            accentColor={accentColor} 
          />
        );
      case 'sorry':
        return (
          <SorryRepairAnimation 
            message={message} 
            onComplete={onComplete} 
            accentColor={accentColor} 
          />
        );
      case 'polaroid':
        return (
          <PolaroidAnimation 
            message={message} 
            memories={memories}
            onComplete={onComplete} 
            accentColor={accentColor} 
          />
        );
      case 'fireworks':
        return (
          <FireworksAnimation 
            message={message} 
            onComplete={onComplete} 
            accentColor={accentColor} 
          />
        );
      case 'typewriter':
      default:
        return (
          <TypewriterAnimation 
            message={message} 
            onComplete={onComplete} 
            accentColor={accentColor} 
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4 overflow-hidden select-none">
      {/* Skip Button */}
      <button
        onClick={onComplete}
        className="absolute top-6 right-6 px-3 py-1.5 rounded-full border border-brand-border bg-brand-dark/40 text-[10px] text-brand-muted hover:text-white transition-all cursor-pointer z-50"
      >
        Skip Animation ⏭️
      </button>

      <AnimatePresence mode="wait">
        {internalStage === 'intro' && (
          <motion.div
            key="ols-intro"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="text-center space-y-4"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
              className="w-12 h-12 rounded-full bg-brand-purple/20 border border-brand-purple/40 flex items-center justify-center text-brand-purple mx-auto"
            >
              <Sparkles className="w-6 h-6 animate-pulse" />
            </motion.div>
            <p className="text-[10px] tracking-widest text-brand-purple uppercase font-mono font-bold">Flagship Outro</p>
            <h2 className="font-heading font-extrabold text-white text-xl sm:text-2xl">Preparing Reveal...</h2>
          </motion.div>
        )}

        {internalStage === 'animating' && (
          <motion.div
            key="ols-animation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full flex flex-col items-center justify-center relative"
          >
            {renderAnimationContent()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ====================================================
   HEARTS BUILD ANIMATION
   ==================================================== */
function HeartsAnimation({ message, onComplete, accentColor }: { message: string; onComplete: () => void; accentColor: string }) {
  const [showButton, setShowButton] = useState(false);
  const heartCount = 32;

  useEffect(() => {
    const t = setTimeout(() => setShowButton(true), 4000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative w-full max-w-sm flex flex-col items-center justify-center text-center space-y-8 px-4 h-full">
      {/* Floating Hearts Converging */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
        {[...Array(heartCount)].map((_, i) => {
          const angle = (i * 360) / heartCount;
          const startRadius = 250 + Math.random() * 80;
          const startX = Math.cos((angle * Math.PI) / 180) * startRadius;
          const startY = Math.sin((angle * Math.PI) / 180) * startRadius;
          
          return (
            <motion.div
              key={i}
              initial={{ x: startX, y: startY, scale: 0, opacity: 0 }}
              animate={{ 
                x: 0, 
                y: 0, 
                scale: [0, 1.2, 0.8, 1], 
                opacity: [0, 0.8, 0.6, 0] 
              }}
              transition={{ 
                duration: 2.5 + Math.random() * 1.2, 
                delay: i * 0.05,
                ease: 'easeOut'
              }}
              className="absolute text-brand-pink"
            >
              <Heart className="w-5 h-5 fill-current" />
            </motion.div>
          );
        })}
      </div>

      {/* Large Glowing Pulsing Heart in Center */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.2, 0.95, 1.1, 1], opacity: 1 }}
        transition={{ delay: 2.2, duration: 1.2 }}
        className="relative"
      >
        <div className="absolute -inset-4 bg-brand-pink/20 rounded-full blur-2xl animate-pulse" />
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="relative text-brand-pink filter drop-shadow-[0_0_12px_rgba(244,63,94,0.4)]"
        >
          <Heart className="w-24 h-24 fill-current" />
        </motion.div>
      </motion.div>

      {/* Final Message reveal */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 3.2, duration: 0.8 }}
        className="space-y-3"
      >
        <p className="text-[10px] tracking-widest text-brand-pink uppercase font-mono font-bold">One Last Thing...</p>
        <h3 className="font-heading font-extrabold text-white text-xl sm:text-2xl px-2 leading-tight">
          "{message}"
        </h3>
      </motion.div>

      {/* Action Button */}
      <AnimatePresence>
        {showButton && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="pt-6 w-full"
          >
            <CustomButton variant="glow" size="md" className="w-full" onClick={onComplete}>
              Continue ❤️
            </CustomButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ====================================================
   BALLOONS ANIMATION
   ==================================================== */
interface Balloon {
  id: number;
  x: number;
  y: number;
  color: string;
  label: string;
  popped: boolean;
  size: number;
  delay: number;
}

function BalloonsAnimation({ message, onComplete, accentColor }: { message: string; onComplete: () => void; accentColor: string }) {
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [poppedCount, setPoppedCount] = useState(0);
  const [showFinal, setShowFinal] = useState(false);

  useEffect(() => {
    const colors = [
      'from-pink-500 to-rose-600',
      'from-purple-500 to-indigo-600',
      'from-amber-400 to-orange-500',
      'from-teal-400 to-emerald-500',
      'from-sky-400 to-blue-500',
      'from-red-500 to-rose-700'
    ];
    const labels = ['🎈', '✨', '❤️', '🎁', '🎂', '🎉'];
    
    const list: Balloon[] = [...Array(6)].map((_, i) => ({
      id: i,
      x: 10 + i * 15 + (Math.random() - 0.5) * 5,
      y: 100, // Starts offscreen
      color: colors[i % colors.length],
      label: labels[i % labels.length],
      popped: false,
      size: 50 + Math.random() * 20,
      delay: i * 0.4
    }));
    setBalloons(list);
  }, []);

  const handlePop = async (id: number) => {
    setBalloons((prev) =>
      prev.map((b) => (b.id === id ? { ...b, popped: true } : b))
    );
    setPoppedCount((prev) => prev + 1);

    // Trigger local confetti burst
    try {
      const confetti = (await import('canvas-confetti')).default;
      confetti({
        particleCount: 25,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    if (balloons.length > 0 && poppedCount === balloons.length) {
      const t = setTimeout(() => setShowFinal(true), 600);
      return () => clearTimeout(t);
    }
  }, [poppedCount, balloons.length]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center px-4">
      {!showFinal ? (
        <div className="w-full max-w-md h-full relative flex flex-col justify-between py-10">
          <div className="text-center space-y-2">
            <h3 className="font-heading font-extrabold text-white text-lg">🎈 Tap to Pop all the Balloons!</h3>
            <p className="text-[10px] text-brand-muted uppercase font-mono tracking-wider">
              Popped: {poppedCount} / {balloons.length}
            </p>
          </div>

          <div className="relative flex-1 w-full overflow-hidden">
            {balloons.map((b) => (
              <AnimatePresence key={b.id}>
                {!b.popped && (
                  <motion.button
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: '-20%', opacity: 1 }}
                    exit={{ scale: 2.2, opacity: 0 }}
                    transition={{ 
                      y: { duration: 7, repeat: Infinity, ease: 'linear', delay: b.delay },
                      opacity: { duration: 0.5 },
                      scale: { duration: 0.2 }
                    }}
                    onClick={() => handlePop(b.id)}
                    style={{ left: `${b.x}%`, width: `${b.size}px`, height: `${b.size * 1.2}px` }}
                    className="absolute cursor-pointer select-none"
                  >
                    <div className={`w-full h-full rounded-full bg-gradient-to-tr ${b.color} relative shadow-lg flex items-center justify-center border border-white/10`}>
                      <span className="text-sm select-none">{b.label}</span>
                      {/* String */}
                      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-white/20" />
                    </div>
                  </motion.button>
                )}
              </AnimatePresence>
            ))}
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm text-center space-y-8"
        >
          {/* Giant confetti celebration pop */}
          <motion.div
            animate={{ scale: [1, 1.05, 1], y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-20 h-20 rounded-full bg-gradient-to-r from-brand-purple to-brand-pink flex items-center justify-center mx-auto text-3xl shadow-xl shadow-brand-purple/20"
          >
            🎉
          </motion.div>
          <div className="space-y-4">
            <p className="text-[10px] tracking-widest text-brand-purple uppercase font-mono font-bold">Surprise Popped!</p>
            <h3 className="font-heading font-extrabold text-white text-xl sm:text-2xl px-2 leading-tight">
              "{message}"
            </h3>
          </div>
          <div className="pt-4 w-full">
            <CustomButton variant="glow" size="md" className="w-full" onClick={onComplete}>
              Continue 🎈
            </CustomButton>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ====================================================
   RING REVEAL ANIMATION
   ==================================================== */
function RingAnimation({ message, onComplete, accentColor }: { message: string; onComplete: () => void; accentColor: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showText, setShowText] = useState(false);

  const handleOpenBox = async () => {
    if (isOpen) return;
    setIsOpen(true);
    
    // Sparkle burst
    try {
      const confetti = (await import('canvas-confetti')).default;
      confetti({
        particleCount: 40,
        spread: 80,
        colors: ['#ffd700', '#ffffff', '#ff69b4'],
        origin: { y: 0.5 }
      });
    } catch (e) {
      console.warn(e);
    }

    setTimeout(() => {
      setShowText(true);
    }, 1200);
  };

  return (
    <div className="w-full max-w-sm flex flex-col items-center justify-center text-center space-y-10 px-4">
      <div className="space-y-2">
        <h3 className="font-heading font-extrabold text-white text-lg">
          {!isOpen ? "💍 A box has appeared..." : "✨ It's beautiful..."}
        </h3>
        <p className="text-[10px] text-brand-muted uppercase font-mono tracking-wider">
          {!isOpen ? "Tap the Box to Open" : "One Last Secret Ending"}
        </p>
      </div>

      {/* Ring Box container */}
      <div className="relative w-40 h-40 flex items-center justify-center cursor-pointer" onClick={handleOpenBox}>
        {/* Ring floating above */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ y: 20, scale: 0.2, opacity: 0, rotate: -45 }}
              animate={{ y: -50, scale: 1.3, opacity: 1, rotate: 15 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 80, damping: 10 }}
              className="absolute z-30"
            >
              <motion.span 
                animate={{ rotateY: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                className="block text-5xl filter drop-shadow-[0_0_15px_rgba(255,215,0,0.6)]"
              >
                💍
              </motion.span>
              <div className="absolute -inset-2 bg-yellow-400/20 blur-xl rounded-full" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Box Lid */}
        <motion.div
          animate={isOpen ? { rotateX: -110, y: -25, zIndex: 10 } : {}}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ transformOrigin: 'top' }}
          className="absolute top-[30px] w-24 h-10 bg-gradient-to-br from-rose-900 to-red-800 border-b border-rose-950 rounded-t-xl z-20 flex items-center justify-center shadow-lg"
        >
          <div className="w-4 h-1.5 bg-yellow-400 rounded-sm" />
        </motion.div>

        {/* Box Base */}
        <div className="absolute bottom-[30px] w-24 h-16 bg-gradient-to-br from-rose-950 via-red-900 to-rose-950 rounded-b-xl border-t border-rose-900/50 shadow-2xl z-10 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-brand-dark border border-brand-border/40 shadow-inner flex items-center justify-center">
            {/* Slot */}
            <div className="w-6 h-2 bg-black rounded-full" />
          </div>
        </div>
      </div>

      {/* Revealed Message */}
      <AnimatePresence>
        {showText && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 w-full"
          >
            <h3 className="font-heading font-extrabold text-white text-xl sm:text-2xl px-2 leading-tight">
              "{message}"
            </h3>
            <div className="pt-2 w-full">
              <CustomButton variant="glow" size="md" className="w-full" onClick={onComplete}>
                Continue 💍
              </CustomButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ====================================================
   TIMELINE ANIMATION
   ==================================================== */
function TimelineAnimation({ message, memories, onComplete, accentColor }: { message: string; memories: Memory[]; onComplete: () => void; accentColor: string }) {
  const [activeNodeIdx, setActiveNodeIdx] = useState(-1);
  const [completed, setCompleted] = useState(false);

  // Take up to 4 memories
  const timelineMemories = memories.slice(0, 4);
  const totalNodes = timelineMemories.length + 1; // memories + final surprise message

  useEffect(() => {
    // Auto advance timeline nodes
    const interval = setInterval(() => {
      setActiveNodeIdx((prev) => {
        if (prev >= totalNodes - 1) {
          clearInterval(interval);
          setCompleted(true);
          return prev;
        }
        return prev + 1;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [totalNodes]);

  return (
    <div className="w-full max-w-sm flex flex-col items-center justify-between py-10 px-4 h-full">
      <div className="text-center space-y-2">
        <h3 className="font-heading font-extrabold text-white text-lg">📅 Drawing Our Timeline</h3>
        <p className="text-[10px] text-brand-muted uppercase font-mono tracking-wider">
          Connecting the beautiful dots
        </p>
      </div>

      {/* Vertical Timeline container */}
      <div className="relative flex-1 w-full max-w-xs flex flex-col justify-around py-8 select-none my-6">
        {/* Neon vertical line */}
        <div className="absolute left-[39px] top-12 bottom-12 w-[2px] bg-brand-border/40 overflow-hidden">
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${(Math.max(0, activeNodeIdx) / (totalNodes - 1)) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="w-full bg-gradient-to-b from-brand-purple to-brand-pink"
          />
        </div>

        {/* Nodes */}
        {[...Array(totalNodes)].map((_, idx) => {
          const isActive = idx <= activeNodeIdx;
          const isCurrent = idx === activeNodeIdx;
          const isLast = idx === totalNodes - 1;
          const memory = !isLast ? timelineMemories[idx] : null;

          return (
            <div key={idx} className="flex items-center gap-6 relative select-none">
              {/* Dot */}
              <motion.div
                initial={{ scale: 0 }}
                animate={isActive ? { scale: 1 } : {}}
                transition={{ type: 'spring', stiffness: 100, damping: 10 }}
                className={`w-20 h-20 rounded-full border-2 flex items-center justify-center shrink-0 z-10 transition-all ${
                  isCurrent 
                    ? 'border-brand-purple bg-brand-purple/20 shadow-[0_0_12px_rgba(168,85,247,0.4)] scale-110' 
                    : isActive 
                      ? 'border-brand-pink bg-brand-pink/10' 
                      : 'border-brand-border bg-brand-dark/40'
                }`}
              >
                {isLast ? (
                  <span className="text-xl">❤️</span>
                ) : memory?.imageUrl ? (
                  <div className="relative w-16 h-16 rounded-full overflow-hidden">
                    <img 
                      src={memory.imageUrl} 
                      alt="node" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                ) : (
                  <span className="text-lg">📸</span>
                )}
              </motion.div>

              {/* Title / Info */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={isActive ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.4 }}
                className="text-left"
              >
                {isLast ? (
                  <div>
                    <h4 className="text-xs font-bold text-brand-pink">One Last Message</h4>
                    <p className="text-[9px] text-brand-muted">Unlocked</p>
                  </div>
                ) : (
                  <div>
                    <h4 className="text-xs font-bold text-white truncate max-w-[160px]">
                      {memory?.caption || `A beautiful memory`}
                    </h4>
                    <p className="text-[9px] text-brand-muted">Chapter {idx + 1}</p>
                  </div>
                )}
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* Reveal message */}
      <AnimatePresence>
        {completed && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 w-full text-center"
          >
            <h3 className="font-heading font-extrabold text-white text-base sm:text-lg px-2 leading-tight">
              "{message}"
            </h3>
            <div className="pt-2 w-full">
              <CustomButton variant="glow" size="md" className="w-full" onClick={onComplete}>
                Continue 📅
              </CustomButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ====================================================
   SORRY REPAIR ANIMATION
   ==================================================== */
function SorryRepairAnimation({ message, onComplete, accentColor }: { message: string; onComplete: () => void; accentColor: string }) {
  const [isHealed, setIsHealed] = useState(false);
  const [showText, setShowText] = useState(false);

  const handleHeal = async () => {
    if (isHealed) return;
    setIsHealed(true);

    try {
      const confetti = (await import('canvas-confetti')).default;
      confetti({
        particleCount: 35,
        spread: 60,
        colors: ['#ec4899', '#f43f5e', '#ffffff'],
        origin: { y: 0.6 }
      });
    } catch (e) {
      console.warn(e);
    }

    setTimeout(() => {
      setShowText(true);
    }, 1500);
  };

  return (
    <div className="w-full max-w-sm flex flex-col items-center justify-center text-center space-y-10 px-4">
      <div className="space-y-2">
        <h3 className="font-heading font-extrabold text-white text-lg">
          {!isHealed ? "💔 Things might be broken..." : "❤️ But love heals everything"}
        </h3>
        <p className="text-[10px] text-brand-muted uppercase font-mono tracking-wider">
          {!isHealed ? "Tap to Mend Heart" : "Heart Restored"}
        </p>
      </div>

      {/* Heart halves container */}
      <div 
        onClick={handleHeal}
        className="relative w-40 h-40 flex items-center justify-center cursor-pointer select-none"
      >
        <div className="relative w-32 h-32 flex items-center justify-center">
          {/* Left half */}
          <motion.div
            animate={isHealed ? { x: 0, rotate: 0 } : { x: -15, rotate: -8 }}
            transition={{ duration: 1.2, type: 'spring', stiffness: 70 }}
            className="w-16 h-32 overflow-hidden relative shrink-0"
          >
            <div className="absolute right-0 w-32 h-32 bg-gradient-to-br from-rose-500 to-red-600 rounded-full" style={{ clipPath: 'polygon(0% 0%, 50% 0%, 50% 100%, 0% 100%)' }} />
            {/* Crack outline */}
            <div className="absolute right-0 top-0 bottom-0 w-[4px] bg-black/40" />
          </motion.div>

          {/* Right half */}
          <motion.div
            animate={isHealed ? { x: 0, rotate: 0 } : { x: 15, rotate: 8 }}
            transition={{ duration: 1.2, type: 'spring', stiffness: 70 }}
            className="w-16 h-32 overflow-hidden relative shrink-0"
          >
            <div className="absolute left-0 w-32 h-32 bg-gradient-to-br from-rose-500 to-red-600 rounded-full" style={{ clipPath: 'polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%)' }} />
            {/* Crack outline */}
            <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-black/40" />
          </motion.div>

          {/* Glowing repair thread effect */}
          {isHealed && (
            <motion.div
              initial={{ scale: 0.1, opacity: 0 }}
              animate={{ scale: [1, 2.5, 1.2], opacity: [0.8, 1, 0] }}
              transition={{ duration: 1.4 }}
              className="absolute inset-0 bg-yellow-400/30 rounded-full blur-xl pointer-events-none"
            />
          )}
        </div>
      </div>

      {/* Revealed message */}
      <AnimatePresence>
        {showText && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 w-full"
          >
            <h3 className="font-heading font-extrabold text-white text-xl sm:text-2xl px-2 leading-tight">
              "{message}"
            </h3>
            <div className="pt-2 w-full">
              <CustomButton variant="glow" size="md" className="w-full" onClick={onComplete}>
                Continue ❤️
              </CustomButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ====================================================
   POLAROID ANIMATION
   ==================================================== */
function PolaroidAnimation({ message, memories, onComplete, accentColor }: { message: string; memories: Memory[]; onComplete: () => void; accentColor: string }) {
  const [stage, setStage] = useState<'stack' | 'revealed'>('stack');
  const polaroids = memories.slice(0, 3); // Top 3 photos
  const angles = [-12, 10, -3];

  const handleRevealMessage = () => {
    setStage('revealed');
  };

  return (
    <div className="w-full max-w-sm flex flex-col items-center justify-between py-10 px-4 h-full">
      <div className="text-center space-y-2">
        <h3 className="font-heading font-extrabold text-white text-lg">📸 Floating Friendship Album</h3>
        <p className="text-[10px] text-brand-muted uppercase font-mono tracking-wider">
          Tuck into our favorite memories
        </p>
      </div>

      <div className="relative flex-1 w-full flex items-center justify-center my-10 select-none">
        <AnimatePresence mode="wait">
          {stage === 'stack' ? (
            <motion.div 
              key="stack-mode"
              className="relative w-64 h-72 flex items-center justify-center cursor-pointer"
              onClick={handleRevealMessage}
            >
              {polaroids.length > 0 ? (
                polaroids.map((p, idx) => (
                  <motion.div
                    key={p.id}
                    initial={{ scale: 0.4, opacity: 0, y: 60 }}
                    animate={{ scale: 1, opacity: 1, y: 0, rotate: angles[idx % angles.length] }}
                    transition={{ delay: idx * 0.4, type: 'spring', stiffness: 90 }}
                    style={{ zIndex: 10 + idx }}
                    className="absolute w-48 h-56 p-3 bg-white border border-slate-200 rounded shadow-xl flex flex-col justify-between"
                  >
                    <div className="relative flex-1 w-full bg-slate-100 overflow-hidden rounded-sm">
                      <img src={p.imageUrl} alt="memory" className="w-full h-full object-cover" />
                    </div>
                    <div className="h-10 pt-2 text-center">
                      <p className="font-caveat font-bold text-slate-800 text-xs truncate leading-none">
                        {p.caption || "Friendship Goal"}
                      </p>
                    </div>
                  </motion.div>
                ))
              ) : (
                // Fallback cartoon cards
                [...Array(3)].map((_, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ scale: 0.4, opacity: 0, y: 60 }}
                    animate={{ scale: 1, opacity: 1, y: 0, rotate: angles[idx % angles.length] }}
                    transition={{ delay: idx * 0.4, type: 'spring', stiffness: 90 }}
                    style={{ zIndex: 10 + idx }}
                    className="absolute w-48 h-56 p-3 bg-white border border-slate-200 rounded shadow-xl flex flex-col justify-between"
                  >
                    <div className="relative flex-1 w-full bg-slate-100 overflow-hidden rounded-sm flex items-center justify-center text-4xl">
                      {['😂', '😎', '🤝'][idx]}
                    </div>
                    <div className="h-10 pt-2 text-center">
                      <p className="font-caveat font-bold text-slate-800 text-xs truncate leading-none">
                        {["Partner in crime", "Chaos partner", "Best Friends"][idx]}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}

              {/* Pulsing prompt */}
              <div className="absolute -bottom-2 text-[10px] text-brand-purple font-bold tracking-wider animate-pulse bg-brand-purple/10 px-3 py-1 rounded-full border border-brand-purple/20 z-40">
                Click album to flip final letter ✉️
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="reveal-mode"
              initial={{ scale: 0.8, opacity: 0, rotateY: 180 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, type: 'spring' }}
              className="w-56 h-64 p-4 bg-white border border-slate-200 rounded shadow-2xl flex flex-col justify-between text-left relative"
            >
              <div className="absolute top-2 right-2 text-rose-500 animate-pulse text-lg">❤️</div>
              <div className="flex-1 flex flex-col justify-center space-y-3 pt-4">
                <p className="font-caveat text-[11px] text-slate-400 uppercase tracking-widest leading-none">For my best friend</p>
                <h3 className="font-caveat font-extrabold text-slate-800 text-sm sm:text-base leading-relaxed">
                  "{message}"
                </h3>
              </div>
              <div className="h-8 border-t border-slate-100 flex items-end justify-center">
                <p className="font-caveat text-xs font-bold text-slate-600">From me, with love</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {stage === 'revealed' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <CustomButton variant="glow" size="md" className="w-full" onClick={onComplete}>
              Continue 📸
            </CustomButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ====================================================
   FIREWORKS ANIMATION
   ==================================================== */
function FireworksAnimation({ message, onComplete, accentColor }: { message: string; onComplete: () => void; accentColor: string }) {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    let active = true;
    const runFireworks = async () => {
      try {
        const confetti = (await import('canvas-confetti')).default;
        const duration = 3.5 * 1000;
        const animationEnd = Date.now() + duration;

        const interval = setInterval(() => {
          if (!active) return clearInterval(interval);

          const timeLeft = animationEnd - Date.now();
          if (timeLeft <= 0) {
            clearInterval(interval);
            return;
          }

          // Trigger fireworks explosions
          confetti({
            particleCount: 30,
            spread: 80,
            origin: { x: Math.random() * 0.6 + 0.2, y: Math.random() * 0.4 + 0.2 },
            colors: ['#ff813f', '#e243fc', '#fcd53f', '#3fecff'],
          });
        }, 350);
      } catch (e) {
        console.warn(e);
      }
    };

    runFireworks();
    const t = setTimeout(() => setShowButton(true), 3200);

    return () => {
      active = false;
      clearTimeout(t);
    };
  }, []);

  return (
    <div className="w-full max-w-sm flex flex-col items-center justify-center text-center space-y-8 px-4 h-full">
      {/* Explosions trigger automatically */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="w-16 h-16 bg-gradient-to-tr from-yellow-400 to-amber-500 rounded-full flex items-center justify-center mx-auto text-3xl shadow-lg border border-yellow-300/30"
      >
        🎆
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2, duration: 0.8 }}
        className="space-y-4"
      >
        <p className="text-[10px] tracking-widest text-yellow-400 uppercase font-mono font-bold">One Final Surprise</p>
        <h3 className="font-heading font-extrabold text-white text-xl sm:text-2xl px-2 leading-tight">
          "{message}"
        </h3>
      </motion.div>

      <AnimatePresence>
        {showButton && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-6 w-full"
          >
            <CustomButton variant="glow" size="md" className="w-full" onClick={onComplete}>
              Continue 🎉
            </CustomButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ====================================================
   TYPEWRITER ANIMATION
   ==================================================== */
function TypewriterAnimation({ message, onComplete, accentColor }: { message: string; onComplete: () => void; accentColor: string }) {
  const [displayedText, setDisplayedText] = useState('');
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    let index = 0;
    let timeoutId: NodeJS.Timeout;
    setDisplayedText('');

    const typeCharacter = () => {
      if (index >= message.length) {
        setShowButton(true);
        return;
      }

      const char = message.charAt(index);
      setDisplayedText((prev) => prev + char);
      index++;

      let delay = 65; // Base typewriter speed
      if (char === '.' || char === '!' || char === '?') {
        delay += 300;
      } else if (char === ',') {
        delay += 120;
      }

      timeoutId = setTimeout(typeCharacter, delay);
    };

    const startTimer = setTimeout(typeCharacter, 800);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(timeoutId);
    };
  }, [message]);

  return (
    <div className="w-full max-w-sm flex flex-col items-center justify-center text-center space-y-8 px-4 h-full relative">
      <div className="absolute inset-0 bg-radial-glow blur-3xl pointer-events-none opacity-20" />
      
      <div className="space-y-4 flex-1 flex flex-col justify-center">
        <p className="text-[10px] tracking-widest text-brand-purple uppercase font-mono font-bold animate-pulse">Cinematic Reveal</p>
        <div className="min-h-[100px] flex items-center justify-center">
          <h3 className="font-heading font-bold text-white text-xl sm:text-2xl px-2 leading-relaxed">
            {displayedText}
            <span className="animate-pulse inline-block text-brand-purple ml-0.5">|</span>
          </h3>
        </div>
      </div>

      <AnimatePresence>
        {showButton && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-6 w-full pb-10"
          >
            <CustomButton variant="glow" size="md" className="w-full" onClick={onComplete}>
              Continue 🎬
            </CustomButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
