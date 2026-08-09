'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Mail } from 'lucide-react';

interface LoveProposalProps {
  onComplete: () => void;
  recipientName: string;
}

const FUNNY_NO_PHRASES = [
  "Wait, that's the wrong button! 😜",
  "Are you sure? Try again! 🥺",
  "I'll buy you roses! 🌹",
  "My heart is in your hands! ❤️",
  "Okay, now you're just playing! 😂",
  "No is not allowed today! 😉"
];

export default function LoveProposal({ onComplete, recipientName }: LoveProposalProps) {
  const [accepted, setAccepted] = useState(false);
  const [noCount, setNoCount] = useState(0);
  const [noButtonPosition, setNoButtonPosition] = useState({ x: 0, y: 0 });

  const handleNoButtonRunaway = () => {
    const x = (Math.random() - 0.5) * 180;
    const y = (Math.random() - 0.5) * 90;
    setNoButtonPosition({ x, y });
    setNoCount((prev) => prev + 1);
  };

  const handleYesClick = async () => {
    setAccepted(true);
    
    // Trigger confetti explosion
    try {
      const confetti = (await import('canvas-confetti')).default;
      
      // Multi-angle gold & pink confetti burst
      const end = Date.now() + 1.5 * 1000;
      const colors = ['#ec4899', '#f43f5e', '#fbbf24', '#f59e0b', '#ffffff'];

      (function frame() {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());
    } catch (err) {
      console.error('Confetti animation error:', err);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto text-center space-y-6 select-none">
      
      {/* Rose-red backdrop aura */}
      <div className="absolute -inset-10 bg-radial-gradient from-red-500/10 via-transparent to-transparent pointer-events-none z-0 mix-blend-color-dodge animate-pulse-slow" />

      <div className="relative z-10 space-y-6">
        
        {/* Proposal Visual */}
        <div className="relative flex justify-center py-4">
          <div className="absolute inset-0 bg-radial-gradient from-pink-500/10 to-transparent blur-2xl rounded-full" />
          
          <AnimatePresence mode="wait">
            {!accepted ? (
              <motion.div
                key="ring-graphic"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                {/* Gold Proposal Ring SVG */}
                <svg 
                  className="w-24 h-24 text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.4)] animate-bounce" 
                  viewBox="0 0 100 100" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fbbf24" />
                      <stop offset="50%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#d97706" />
                    </linearGradient>
                  </defs>
                  
                  {/* Diamond Top */}
                  <path 
                    d="M50 20 L40 32 L60 32 Z" 
                    fill="url(#goldGrad)" 
                    stroke="#fff" 
                    strokeWidth="1" 
                    strokeLinejoin="round" 
                  />
                  <path 
                    d="M45 20 L50 12 L55 20 Z" 
                    fill="#fff" 
                    opacity="0.9" 
                    stroke="url(#goldGrad)" 
                    strokeWidth="0.8" 
                  />
                  
                  {/* Main Ring band */}
                  <circle 
                    cx="50" 
                    cy="60" 
                    r="25" 
                    stroke="url(#goldGrad)" 
                    strokeWidth="5" 
                    className="drop-shadow-md"
                  />
                  <circle 
                    cx="50" 
                    cy="60" 
                    r="22.5" 
                    stroke="#fff" 
                    strokeWidth="0.75" 
                    opacity="0.3"
                  />
                  
                  {/* Inner glowing core */}
                  <circle 
                    cx="50" 
                    cy="60" 
                    r="15" 
                    fill="url(#goldGrad)" 
                    opacity="0.1"
                  />
                </svg>
                
                {/* Decorative floating sparkles */}
                <span className="absolute -top-1 -right-2 text-yellow-300 text-lg animate-pulse">✨</span>
                <span className="absolute bottom-2 -left-2 text-rose-400 text-sm animate-pulse delay-700">❤️</span>
              </motion.div>
            ) : (
              <motion.div
                key="accepted-graphic"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                className="relative"
              >
                {/* Glowing Double Heart */}
                <div className="w-24 h-24 flex items-center justify-center relative bg-pink-500/10 border border-pink-500/20 rounded-full shadow-inner animate-pulse-slow">
                  <Heart className="w-12 h-12 text-pink-500 fill-pink-500/30" />
                  <Heart className="w-6 h-6 text-red-500 fill-red-500/40 absolute bottom-5 right-5 rotate-12" />
                </div>
                <span className="absolute -top-1 -left-1 text-pink-400 text-sm animate-ping">💖</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Dynamic Text Area */}
        <div className="space-y-3 px-4 min-h-[90px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {!accepted ? (
              <motion.div
                key="ask"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-2"
              >
                <h2 className="font-heading font-extrabold text-white text-xl sm:text-2xl tracking-tight leading-snug">
                  Will you be mine, {recipientName}? 💍
                </h2>
                <p className="text-xs text-brand-muted max-w-[280px] mx-auto leading-relaxed">
                  No pressure, but a beautiful story is waiting for us... ❤️
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="accepted"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <h2 className="font-heading font-extrabold text-pink-400 text-2xl tracking-tight leading-snug">
                  You make my world complete! 💖
                </h2>
                <p className="text-xs text-brand-muted max-w-[280px] mx-auto leading-relaxed">
                  I promise to cherish, smile, and stay by your side through every single moment.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Interaction Area */}
        <div className="min-h-[90px] flex flex-col justify-center items-center">
          <AnimatePresence mode="wait">
            {!accepted ? (
              <motion.div 
                key="buttons"
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full space-y-4"
              >
                {/* Funny prompt response for runaway clicks */}
                <div className="h-6">
                  {noCount > 0 && (
                    <motion.div
                      key={noCount}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-[10px] text-pink-400 font-bold bg-pink-500/10 px-3 py-1 rounded-full border border-pink-500/20 inline-block"
                    >
                      {FUNNY_NO_PHRASES[Math.min(noCount - 1, FUNNY_NO_PHRASES.length - 1)]}
                    </motion.div>
                  )}
                </div>

                <div className="flex items-center justify-center gap-6 relative min-h-[50px] w-full">
                  <button
                    onClick={handleYesClick}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-red-500 text-xs font-bold text-white shadow-lg shadow-pink-500/20 hover:brightness-105 active:scale-95 transition-all z-10"
                  >
                    YES ❤️
                  </button>

                  <motion.div
                    animate={{ x: noButtonPosition.x, y: noButtonPosition.y }}
                    transition={{ type: 'spring', stiffness: 350, damping: 18 }}
                    className="z-10"
                  >
                    <button
                      onMouseEnter={handleNoButtonRunaway}
                      onClick={handleNoButtonRunaway}
                      className="px-5 py-2.5 rounded-xl border border-brand-border bg-brand-dark/40 text-xs text-brand-muted hover:text-white transition-colors cursor-pointer"
                    >
                      No 💔
                    </button>
                  </motion.div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="proceed"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              >
                <button
                  onClick={onComplete}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-red-500 text-xs font-bold text-white cursor-pointer active:scale-95 transition-transform flex items-center gap-2 shadow-lg shadow-pink-500/15 hover:brightness-105"
                >
                  <span>Read Love Letter ✉️</span>
                  <Mail className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
