'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Sparkle {
  id: number;
  x: number; // percentage width
  y: number; // percentage height
  size: number; // size in pixels
  delay: number;
  duration: number;
}

interface SparkleEffectProps {
  count?: number;
  colorClass?: string;
  shadowFilter?: string;
}

export default function SparkleEffect({ 
  count = 12,
  colorClass = 'text-amber-300/30',
  shadowFilter = 'drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]'
}: SparkleEffectProps) {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  useEffect(() => {
    const nextSparkles = Array.from({ length: count }).map((_, idx) => ({
      id: idx,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 16 + 10, // 10px to 26px
      delay: Math.random() * -4, // Pre-animate on load using negative delay
      duration: Math.random() * 2.5 + 2, // 2s to 4.5s duration
    }));
    setSparkles(nextSparkles);
  }, [count]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-10">
      {sparkles.map((s) => (
        <motion.svg
          key={s.id}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={`absolute ${colorClass}`}
          style={{
            top: `${s.y}%`,
            left: `${s.x}%`,
            width: s.size,
            height: s.size,
            filter: shadowFilter,
          }}
          initial={{ opacity: 0, scale: 0, rotate: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            scale: [0.2, 1.2, 1.2, 0.2],
            rotate: [0, 90, 180],
          }}
          transition={{
            duration: s.duration,
            repeat: Infinity,
            delay: s.delay,
            ease: 'easeInOut',
          }}
        >
          <path d="M12 2C12 7.5 9.5 12 2 12C9.5 12 12 16.5 12 22C12 16.5 14.5 12 22 12C14.5 12 12 7.5 12 2Z" />
        </motion.svg>
      ))}
    </div>
  );
}
