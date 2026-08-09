'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile, CheckSquare, Square, ArrowRight } from 'lucide-react';

interface FriendshipRoastProps {
  onComplete: () => void;
}

export default function FriendshipRoast({ onComplete }: FriendshipRoastProps) {
  const [checkedList, setCheckedList] = useState<boolean[]>([false, false, false]);
  const [showFootnote, setShowFootnote] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    // Sequentially tick off check list items
    const timers = [
      setTimeout(() => setCheckedList([true, false, false]), 800),
      setTimeout(() => setCheckedList([true, true, false]), 1800),
      setTimeout(() => setCheckedList([true, true, true]), 2800),
      setTimeout(() => setShowFootnote(true), 3600),
      setTimeout(() => setShowButton(true), 4600),
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  const roasts = [
    { text: "Your terrible music taste 🎧" },
    { text: "Showing up 45 minutes late to everything ⏰" },
    { text: "Laughing at your own jokes before they start 🤪" }
  ];

  return (
    <div className="w-full max-w-sm mx-auto text-center space-y-8 select-none">
      
      {/* Decorative Header */}
      <div className="space-y-2">
        <span className="text-[10px] tracking-widest text-teal-400 uppercase font-mono font-bold flex items-center justify-center gap-1.5">
          <Smile className="w-3.5 h-3.5 text-teal-400 animate-bounce" />
          <span>Things I tolerate about you</span>
        </span>
        <h3 className="font-heading font-extrabold text-white text-lg">
          Weirdo Checklist 😈
        </h3>
      </div>

      {/* Glassmorphism Checklist Container */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-teal-500/15 relative overflow-hidden bg-brand-dark/40 shadow-2xl space-y-5 text-left">
        {/* Glow backdrop */}
        <div className="absolute inset-0 bg-radial-gradient from-teal-500/5 via-transparent to-transparent pointer-events-none" />

        <div className="space-y-4">
          {roasts.map((roast, idx) => (
            <div 
              key={idx} 
              className="flex items-center gap-3.5 text-xs sm:text-sm"
            >
              <div className="shrink-0 text-teal-400">
                {checkedList[idx] ? (
                  <motion.div
                    initial={{ scale: 0.5, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                  >
                    <CheckSquare className="w-5 h-5 fill-teal-400/10 text-teal-400" />
                  </motion.div>
                ) : (
                  <Square className="w-5 h-5 text-brand-border" />
                )}
              </div>
              <span className={`transition-all duration-300 font-sans ${checkedList[idx] ? 'text-white/95 line-through decoration-teal-400/40' : 'text-brand-muted'}`}>
                {roast.text}
              </span>
            </div>
          ))}
        </div>

        {/* Footnote */}
        <div className="min-h-[24px] pt-2 border-t border-brand-border/40">
          <AnimatePresence>
            {showFootnote && (
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-xs text-center text-teal-300 font-semibold"
              >
                But you are still my favorite weirdo. ❤️
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Action Button */}
      <div className="min-h-[44px]">
        <AnimatePresence>
          {showButton && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="flex justify-center"
            >
              <button
                onClick={onComplete}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-xs font-bold text-white cursor-pointer active:scale-95 transition-transform flex items-center gap-2 shadow-lg shadow-teal-500/10 hover:brightness-105"
              >
                <span>Read My Letter ✉️</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
