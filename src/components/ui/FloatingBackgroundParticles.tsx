'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  id: number;
  emoji: string;
  size: number;
  x: number;
  duration: number;
  delay: number;
}

interface FloatingBackgroundParticlesProps {
  emojis: string[];
  count?: number;
}

export default function FloatingBackgroundParticles({ emojis, count = 12 }: FloatingBackgroundParticlesProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (emojis.length === 0) return;
    
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const finalCount = isMobile ? Math.min(count, 6) : count;

    const nextParticles: Particle[] = Array.from({ length: finalCount }).map((_, i) => ({
      id: i,
      emoji: emojis[i % emojis.length],
      size: Math.floor(Math.random() * 16) + 16, // 16px to 32px
      x: Math.random() * 100, // 0% to 100% of viewport width
      duration: Math.random() * 10 + 18, // 18s to 28s duration for a slow, premium float
      delay: Math.random() * -28, // Negative delay so particles are pre-seeded across the screen on load
    }));
    setParticles(nextParticles);
  }, [emojis, count]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0 opacity-[0.22] mix-blend-screen">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: '105vh', x: `${p.x}vw`, opacity: 0 }}
          animate={{ 
            y: '-10vh',
            opacity: [0, 1, 1, 0] // Fade in, hold, fade out at the top
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'linear'
          }}
          style={{
            position: 'absolute',
            fontSize: `${p.size}px`,
            left: 0,
            top: 0
          }}
        >
          {p.emoji}
        </motion.div>
      ))}
    </div>
  );
}
