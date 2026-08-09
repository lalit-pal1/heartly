'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles } from 'lucide-react';

interface LoveFeelingsRevealProps {
  onComplete: () => void;
}

export default function LoveFeelingsReveal({ onComplete }: LoveFeelingsRevealProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Sequentially advance steps to show text lines
    const timers = [
      setTimeout(() => setStep(1), 1800), // Show line 2
      setTimeout(() => setStep(2), 3800), // Show line 3
      setTimeout(() => setStep(3), 5200), // Show button
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  const phrases = [
    "There’s something I’ve been meaning to say... 🥺",
    "A feeling that has grown with every shared laugh, every quiet moment, and every memory we've made.",
    "So before you read my letter, I have one question..."
  ];

  return (
    <div className="w-full max-w-sm mx-auto text-center space-y-8 select-none">
      
      {/* Decorative Heart Icon */}
      <div className="space-y-2 animate-pulse">
        <span className="text-[10px] tracking-widest text-pink-400 uppercase font-mono font-bold flex items-center justify-center gap-1.5">
          <Heart className="w-3.5 h-3.5 text-pink-400 fill-pink-400/20" />
          <span>A personal confession</span>
        </span>
      </div>

      {/* Sincere Reflection Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-pink-500/15 relative overflow-hidden bg-brand-dark/40 shadow-2xl space-y-6 min-h-[190px] flex flex-col justify-center">
        {/* Glow backdrop inside card */}
        <div className="absolute inset-0 bg-radial-gradient from-pink-500/5 via-transparent to-transparent pointer-events-none" />

        <div className="space-y-4 text-xs sm:text-sm text-brand-muted leading-relaxed font-sans text-left">
          {/* Line 1 */}
          <AnimatePresence>
            {step >= 0 && (
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="font-medium text-white/95"
              >
                {phrases[0]}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Line 2 */}
          <AnimatePresence>
            {step >= 1 && (
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="italic border-l-2 border-pink-500/30 pl-3 py-0.5"
              >
                "{phrases[1]}"
              </motion.p>
            )}
          </AnimatePresence>

          {/* Line 3 */}
          <AnimatePresence>
            {step >= 2 && (
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="font-semibold text-pink-300"
              >
                {phrases[2]}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Proceed Button */}
      <div className="min-h-[44px]">
        <AnimatePresence>
          {step >= 3 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="flex justify-center"
            >
              <button
                onClick={onComplete}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-red-500 text-xs font-bold text-white cursor-pointer active:scale-95 transition-transform flex items-center gap-2 shadow-lg shadow-pink-500/10 hover:brightness-105"
              >
                <span>Ask Me ✨</span>
                <Sparkles className="w-4 h-4 text-amber-200" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
