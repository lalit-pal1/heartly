'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ArrowRight } from 'lucide-react';

interface AnniversaryHeartRevealProps {
  onComplete: () => void;
}

export default function AnniversaryHeartReveal({ onComplete }: AnniversaryHeartRevealProps) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [heartParticles, setHeartParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [showButton, setShowButton] = useState(false);

  const handleUnlock = async () => {
    if (isUnlocked) return;
    setIsUnlocked(true);

    // Generate floating hearts particles
    const particles = Array.from({ length: 10 }).map((_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 40,
      y: -15 - Math.random() * 40,
    }));
    setHeartParticles(particles);

    // Trigger canvas-confetti soft pink/gold hearts burst
    try {
      const confetti = (await import('canvas-confetti')).default;
      const duration = 2.5 * 1000;
      const end = Date.now() + duration;

      let lastConfettiTime = 0;
      const frame = () => {
        const now = Date.now();
        // Fire confetti every 60ms (roughly 16 times/sec) instead of every frame
        if (now - lastConfettiTime > 60) {
          lastConfettiTime = now;
          const count = typeof window !== 'undefined' && window.innerWidth < 768 ? 1 : 2;
          confetti({
            particleCount: count,
            angle: 60,
            spread: 45,
            origin: { x: 0.2, y: 0.85 },
            colors: ['#EC4899', '#F43F5E', '#FBBF24']
          });
          confetti({
            particleCount: count,
            angle: 120,
            spread: 45,
            origin: { x: 0.8, y: 0.85 },
            colors: ['#EC4899', '#F43F5E', '#FBBF24']
          });
        }

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    } catch (err) {
      console.warn('Confetti import error:', err);
    }

    // Delay showing the proceed button slightly for emotional payoff
    setTimeout(() => {
      setShowButton(true);
    }, 1500);
  };

  return (
    <div className="w-full max-w-sm mx-auto text-center space-y-8 select-none">
      
      {/* Decorative Header */}
      <div className="space-y-2">
        <span className="text-[10px] tracking-widest text-pink-400 uppercase font-mono font-bold flex items-center justify-center gap-1">
          <Heart className="w-3.5 h-3.5 fill-pink-400/20 text-pink-400" />
          <span>The Key to My Heart</span>
        </span>
        <h3 className="font-heading font-extrabold text-white text-lg">
          {isUnlocked ? "Always and forever... ❤️" : "Touch to unlock our path... ✨"}
        </h3>
      </div>

      {/* SVG Interactive Double Hearts Display */}
      <div 
        onClick={handleUnlock}
        className="relative cursor-pointer group py-4 active:scale-98 transition-transform"
      >
        {/* Ripple Effect Ring (shows on unlock click) */}
        <AnimatePresence>
          {isUnlocked && (
            <motion.div 
              initial={{ opacity: 0.8, scale: 0.5 }}
              animate={{ opacity: 0, scale: 2.2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="absolute inset-0 max-w-[12rem] mx-auto aspect-square rounded-full border border-amber-400/50 pointer-events-none"
            />
          )}
        </AnimatePresence>

        <svg 
          viewBox="0 0 200 200" 
          className="w-52 h-52 mx-auto filter drop-shadow-[0_0_25px_rgba(236,72,153,0.3)]"
        >
          {/* Background Ambient Aura */}
          <motion.circle 
            cx="100" 
            cy="100" 
            r="70" 
            fill="url(#aurora)" 
            animate={{ 
              opacity: isUnlocked ? [0.4, 0.7, 0.4] : [0.25, 0.45, 0.25],
              scale: isUnlocked ? [1, 1.1, 1] : [0.95, 1.05, 0.95]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Left Heart (Rose Gold Outline) */}
          <motion.path
            d="M 68 62 
               A 22 22 0 0 0 46 84 
               C 46 112, 90 148, 90 148 
               C 90 148, 134 112, 134 84 
               A 22 22 0 0 0 112 62 
               C 100 62, 90 72, 90 72 
               C 90 72, 80 62, 68 62 Z"
            fill={isUnlocked ? "url(#rubyGlow)" : "rgba(236,72,153,0.05)"}
            stroke={isUnlocked ? "#fbbf24" : "#f472b6"}
            strokeWidth="2.5"
            strokeLinejoin="round"
            initial={{ scale: 1 }}
            animate={isUnlocked ? { scale: [1, 1.08, 1], rotate: [-2, 0, -2] } : { scale: [1, 1.03, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ originX: '90px', originY: '105px' }}
          />

          {/* Right Heart (Pushed forward, overlapping slightly, Gold Outline) */}
          <motion.path
            d="M 120 66 
               A 20 20 0 0 0 100 86 
               C 100 111, 140 144, 140 144 
               C 140 144, 180 111, 180 86 
               A 20 20 0 0 0 160 66 
               C 149 66, 140 75, 140 75 
               C 140 75, 131 66, 120 66 Z"
            fill={isUnlocked ? "url(#goldGlow)" : "rgba(251,191,36,0.03)"}
            stroke={isUnlocked ? "#f43f5e" : "#fbbf24"}
            strokeWidth="2.5"
            strokeLinejoin="round"
            initial={{ scale: 1 }}
            animate={isUnlocked ? { scale: [1, 1.08, 1], rotate: [2, 0, 2] } : { scale: [1, 1.03, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.15 }}
            style={{ originX: '140px', originY: '105px' }}
          />

          {/* Sparkly cross effects around unlocked hearts */}
          {isUnlocked && (
            <>
              <circle cx="50" cy="50" r="1.5" fill="#FBBF24" opacity="0.8" />
              <circle cx="150" cy="140" r="2" fill="#F43F5E" opacity="0.9" />
              <circle cx="160" cy="50" r="1.5" fill="#FBBF24" opacity="0.8" />
            </>
          )}

          {/* Gradient definitions */}
          <defs>
            <radialGradient id="aurora" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
              <stop offset="70%" stopColor="#a855f7" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#000" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="rubyGlow" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#9f1239" />
            </radialGradient>
            <radialGradient id="goldGlow" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#fca5a5" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#be123c" />
            </radialGradient>
          </defs>
        </svg>

        {/* Rising heart bubbles rendered upon unlock */}
        {isUnlocked && heartParticles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{ opacity: 0.9, x: 0, y: -100, scale: 0.4 }}
            animate={{ 
              opacity: 0,
              x: particle.x,
              y: -150 + particle.y,
              scale: 1.5
            }}
            transition={{ duration: 1.6, ease: 'easeOut' }}
            className="absolute left-[calc(50%-6px)] top-1/2 w-3.5 h-3.5 text-pink-500 filter drop-shadow-[0_0_2px_rgba(244,63,94,0.5)]"
          >
            ❤️
          </motion.div>
        ))}

        {/* Ambient Ring light indicator */}
        <AnimatePresence>
          {!isUnlocked && (
            <motion.div 
              initial={{ opacity: 0.4, scale: 0.9 }}
              animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.95, 1.05, 0.95] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 max-w-[12rem] mx-auto rounded-full bg-pink-500/5 blur-xl pointer-events-none"
            />
          )}
        </AnimatePresence>
      </div>

      {/* Interactive CTA overlay */}
      <AnimatePresence mode="wait">
        {!isUnlocked ? (
          <motion.p
            key="unlock-prompt"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-xs text-brand-muted italic"
          >
            👉 Tap the heart to unlock our memories! 👈
          </motion.p>
        ) : (
          <motion.div
            key="proceed-button"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="pt-2 flex flex-col items-center"
          >
            {showButton && (
              <button
                onClick={onComplete}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-xs font-bold text-white cursor-pointer active:scale-95 transition-transform flex items-center gap-2 shadow-lg shadow-rose-500/10 hover:brightness-105"
              >
                <span>Read Our Anniversary Letter ✉️</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
