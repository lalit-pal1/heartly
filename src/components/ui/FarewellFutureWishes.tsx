'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, ArrowRight } from 'lucide-react';

interface FarewellFutureWishesProps {
  onComplete: () => void;
}

export default function FarewellFutureWishes({ onComplete }: FarewellFutureWishesProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Sequentially advance steps to show text lines
    const timers = [
      setTimeout(() => setStep(1), 1600), // Show line 2
      setTimeout(() => setStep(2), 3400), // Show line 3
      setTimeout(() => setStep(3), 4800), // Show button
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  const phrases = [
    "Wherever life takes you… 🌅",
    "Chase your dreams, make us proud, and remember the laughter we shared.",
    "This isn't goodbye forever. We are always cheering for you! 🥹❤️"
  ];

  return (
    <div className="w-full max-w-sm mx-auto text-center space-y-8 select-none">
      
      {/* Decorative Compass Icon */}
      <div className="space-y-2">
        <span className="text-[10px] tracking-widest text-amber-400 uppercase font-mono font-bold flex items-center justify-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
          <span>A message for your journey</span>
        </span>
      </div>

      {/* Sunset Reflection Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-amber-500/15 relative overflow-hidden bg-brand-dark/40 shadow-2xl space-y-6 min-h-[180px] flex flex-col justify-center">
        {/* Glow backdrop inside card */}
        <div className="absolute inset-0 bg-radial-gradient from-amber-500/5 via-transparent to-transparent pointer-events-none" />

        <div className="space-y-4 text-xs sm:text-sm text-brand-muted leading-relaxed font-sans text-left">
          {/* Line 1 */}
          <AnimatePresence>
            {step >= 0 && (
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="font-medium text-white/90"
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
                className="italic border-l-2 border-amber-500/30 pl-3 py-0.5"
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
                className="font-semibold text-amber-300"
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
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-xs font-bold text-white cursor-pointer active:scale-95 transition-transform flex items-center gap-2 shadow-lg shadow-amber-500/10 hover:brightness-105"
              >
                <span>Read Farewell Letter ✉️</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
