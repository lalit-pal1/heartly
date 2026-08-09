'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';

interface BirthdayCakeRevealProps {
  recipientName: string;
  onComplete: () => void;
}

export default function BirthdayCakeReveal({ recipientName, onComplete }: BirthdayCakeRevealProps) {
  const [isBlown, setIsBlown] = useState(false);
  const [smokeParticles, setSmokeParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [showButton, setShowButton] = useState(false);

  const handleBlowCandles = async () => {
    if (isBlown) return;
    setIsBlown(true);

    // Generate smoke particles rising from the candle
    const particles = Array.from({ length: 8 }).map((_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 20, // offset left/right
      y: -10 - Math.random() * 30,  // offset upwards
    }));
    setSmokeParticles(particles);

    // Trigger canvas-confetti explosion
    try {
      const confetti = (await import('canvas-confetti')).default;
      const duration = 3 * 1000;
      const end = Date.now() + duration;

      let lastConfettiTime = 0;
      const frame = () => {
        const now = Date.now();
        // Fire confetti every 60ms (roughly 16 times/sec) instead of every frame
        if (now - lastConfettiTime > 60) {
          lastConfettiTime = now;
          const count = typeof window !== 'undefined' && window.innerWidth < 768 ? 2 : 4;
          confetti({
            particleCount: count,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.8 },
            colors: ['#FBBF24', '#F472B6', '#A855F7', '#3B82F6']
          });
          confetti({
            particleCount: count,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.8 },
            colors: ['#FBBF24', '#F472B6', '#A855F7', '#3B82F6']
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
      
      {/* Decorative spark header */}
      <div className="space-y-2">
        <span className="text-[10px] tracking-widest text-amber-400 uppercase font-mono font-bold flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 fill-amber-400/20 text-amber-400 animate-spin-slow" />
          <span>Make a wish</span>
        </span>
        <h3 className="font-heading font-extrabold text-white text-lg">
          {isBlown ? "Wish made! 🌟❤️" : "Blow out your candles... 🕯️"}
        </h3>
      </div>

      {/* SVG Interactive Cake Display */}
      <div 
        onClick={handleBlowCandles}
        className="relative cursor-pointer group py-4 active:scale-98 transition-transform"
      >
        <svg 
          viewBox="0 0 200 200" 
          className="w-56 h-56 mx-auto filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.4)]"
        >
          {/* Cake Stand Base */}
          <ellipse cx="100" cy="165" rx="65" ry="8" fill="#1e1e21" stroke="#374151" strokeWidth="1.5" />
          <path d="M 70 165 L 80 185 L 120 185 L 130 165 Z" fill="#111827" stroke="#374151" strokeWidth="1.5" />

          {/* Bottom Cake Layer (Cream & Gold lines) */}
          <path d="M 45 110 L 45 160 C 45 165, 155 165, 155 160 L 155 110 Z" fill="#2e1065" /> {/* Dark Purple */}
          <ellipse cx="100" cy="160" rx="55" ry="6" fill="#1e1b4b" opacity="0.3" />
          
          {/* Golden ribbon band on bottom layer */}
          <path d="M 45 140 C 70 148, 130 148, 155 140 L 155 146 C 130 154, 70 154, 45 146 Z" fill="#d97706" />

          {/* Drips of white frosting */}
          <path d="M 45 110 
                   C 55 118, 60 108, 65 116 
                   C 75 124, 80 110, 85 118 
                   C 95 122, 105 112, 115 120 
                   C 125 114, 130 122, 135 114 
                   C 145 120, 150 108, 155 110
                   L 155 113
                   C 150 113, 145 124, 135 118
                   C 130 126, 125 118, 115 124
                   C 105 116, 95 126, 85 122
                   C 80 114, 75 128, 65 120
                   C 60 112, 55 122, 45 113 Z" fill="#fdf2f8" />

          {/* Top Cake Layer (Pink frosting) */}
          <path d="M 60 70 L 60 110 C 60 114, 140 114, 140 110 L 140 70 Z" fill="#831843" /> {/* Rose Pink */}
          <ellipse cx="100" cy="110" rx="40" ry="5" fill="#4d0727" opacity="0.3" />
          
          {/* Drips on top layer */}
          <path d="M 60 70
                   C 70 78, 75 68, 80 76
                   C 90 82, 95 72, 100 78
                   C 105 72, 110 82, 120 76
                   C 125 68, 130 78, 140 70
                   L 140 72
                   C 130 80, 125 70, 120 78
                   C 110 84, 105 74, 100 80
                   C 95 74, 90 84, 80 78
                   C 75 70, 70 80, 60 72 Z" fill="#fdf2f8" />
          
          <ellipse cx="100" cy="70" rx="40" ry="5" fill="#db2777" /> {/* Creamy top pink surface */}

          {/* Candle wick and body */}
          <rect x="98" y="42" width="4" height="28" fill="#fcd34d" rx="1.5" />
          <rect x="98" y="42" width="4" height="6" fill="#fb923c" /> {/* Striped pattern */}
          <rect x="98" y="54" width="4" height="6" fill="#fb923c" />
          <line x1="100" y1="42" x2="100" y2="36" stroke="#4b5563" strokeWidth="1.5" /> {/* Wick */}

          {/* SVG Animated Candle Flame */}
          <AnimatePresence>
            {!isBlown && (
              <motion.path 
                d="M 100 16 C 94 28, 98 37, 100 37 C 102 37, 106 28, 100 16 Z" 
                fill="url(#flameGradient)"
                initial={{ opacity: 1, scale: 1 }}
                animate={{ 
                  scaleY: [1, 1.15, 0.9, 1.1, 1],
                  scaleX: [1, 0.9, 1.1, 0.95, 1],
                  skewX: [0, 2, -2, 1, 0],
                  y: [0, -1, 0.5, -0.5, 0]
                }}
                exit={{ 
                  opacity: 0, 
                  scale: 0,
                  y: -10,
                  transition: { duration: 0.25, ease: 'easeOut' }
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity, 
                  ease: 'easeInOut' 
                }}
                style={{ originX: '100px', originY: '37px' }}
              />
            )}
          </AnimatePresence>

          {/* Gradients declaration */}
          <defs>
            <radialGradient id="flameGradient" cx="50%" cy="80%" r="50%">
              <stop offset="0%" stopColor="#fef08a" /> {/* Yellow core */}
              <stop offset="35%" stopColor="#f97316" /> {/* Orange inner */}
              <stop offset="100%" stopColor="#dc2626" stopOpacity="0" /> {/* Red halo */}
            </radialGradient>
          </defs>
        </svg>

        {/* Smoke particles rendered upon blowing */}
        {isBlown && smokeParticles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{ opacity: 0.8, x: 0, y: -90, scale: 0.5 }}
            animate={{ 
              opacity: 0,
              x: particle.x,
              y: -140 + particle.y,
              scale: 1.8
            }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
            className="absolute left-[calc(50%-4px)] top-1/2 w-2 h-2 rounded-full bg-white/40 blur-[1px]"
          />
        ))}

        {/* Ambient Ring light indicator */}
        <AnimatePresence>
          {!isBlown && (
            <motion.div 
              initial={{ opacity: 0.4, scale: 0.9 }}
              animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.95, 1.05, 0.95] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 max-w-[12rem] mx-auto rounded-full bg-amber-500/5 blur-xl pointer-events-none"
            />
          )}
        </AnimatePresence>
      </div>

      {/* Interactive CTA overlay */}
      <AnimatePresence mode="wait">
        {!isBlown ? (
          <motion.p
            key="blow-prompt"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-xs text-brand-muted italic"
          >
            👉 Tap the cake or candle to blow them out! 👈
          </motion.p>
        ) : (
          <motion.div
            key="success-button"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="pt-2 flex flex-col items-center"
          >
            {showButton && (
              <button
                onClick={onComplete}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-xs font-bold text-white cursor-pointer active:scale-95 transition-transform flex items-center gap-2 shadow-lg shadow-orange-500/10 hover:brightness-105"
              >
                <span>Read Your Birthday Letter ✉️</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
