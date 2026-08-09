'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Gift, Heart, Smile, Sparkles, Volume2, Clock, Eye, Sparkle } from 'lucide-react';
import CustomButton from '@/components/ui/CustomButton';

export default function TemplatesPage() {
  const templates = [
    {
      id: 'birthday',
      title: 'Birthday Celebration',
      tagline: 'Make their special day cinematic',
      description: 'A glowing birthday theme with floating confetti, soft ambient tones, and a step-by-step memory recap.',
      icon: Gift,
      vibes: ['Warm', 'Festive', 'Joyful'],
      demoLink: '/r/demo-birthday',
    },
    {
      id: 'anniversary',
      title: 'Anniversary Special',
      tagline: 'Chronicle your beautiful years together',
      description: 'An elegant theme featuring a retro polaroid timeline grid, soft romantic piano chords, and a private lock key.',
      icon: Heart,
      vibes: ['Elegant', 'Romantic', 'Dreamy'],
      demoLink: '/r/demo-anniversary',
    },
    {
      id: 'friendship',
      title: 'Friendship Archive',
      tagline: 'Relive the crazy moments',
      description: 'A clean, modern grid highlighting funny quotes, silly captures, and a quick text typewriter animation.',
      icon: Smile,
      vibes: ['Cheerful', 'Modern', 'Minimalist'],
      demoLink: '/r/demo-birthday',
    },
    {
      id: 'proposal',
      title: 'The Big Proposal',
      tagline: 'Leading up to a life-changing answer',
      description: 'A suspense-filled cinematic storyboard flow, slowly unveiling photos leading up to an interactive question card.',
      icon: Sparkles,
      vibes: ['Dramatic', 'Cinematic', 'Luxurious'],
      demoLink: '/r/demo-anniversary',
    },
    {
      id: 'sorry',
      title: 'Heartfelt Apology',
      tagline: 'Mend ties with soft expression',
      description: 'A calming theme designed to say sorry. Gentle atmospheric tones, large readable typewriter text, and cute reactions.',
      icon: Volume2,
      vibes: ['Soft', 'Sincere', 'Calming'],
      demoLink: '/r/demo-birthday',
    },
    {
      id: 'farewell',
      title: 'Warm Farewell',
      tagline: 'Wishing them well in style',
      description: 'A collage-style scrapbook page designed to bid goodbye. Clean grid styling with notes from multiple friends.',
      icon: Clock,
      vibes: ['Warm', 'Nostalgic', 'Minimalist'],
      demoLink: '/r/demo-anniversary',
    },
  ];

  return (
    <div className="space-y-12 text-left">
      <div className="space-y-4 max-w-xl">
        <h1 className="text-4xl font-heading font-extrabold text-white text-glow">Surprise Templates</h1>
        <p className="text-sm text-brand-muted">
          Explore our premium curated theme layouts designed specifically for emotional moments. Fully customizable with your media and background scores.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
        {templates.map((tpl, idx) => (
          <motion.div
            key={tpl.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.05 }}
            className="glass-card p-6 rounded-3xl border border-brand-border flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center text-brand-purple">
                  <tpl.icon className="w-5 h-5" />
                </div>
                <div className="flex gap-1.5">
                  {tpl.vibes.map((v) => (
                    <span key={v} className="text-[9px] font-semibold text-brand-muted bg-brand-dark border border-brand-border px-2 py-0.5 rounded-full">
                      {v}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-heading font-bold text-white text-lg">{tpl.title}</h3>
                <p className="text-xs text-brand-purple font-medium mt-0.5">{tpl.tagline}</p>
              </div>
              <p className="text-xs text-brand-muted leading-relaxed">{tpl.description}</p>
            </div>
            <div className="pt-8 flex items-center gap-3">
              <Link href={tpl.demoLink} className="flex-1">
                <CustomButton variant="secondary" size="sm" icon={Eye} className="w-full text-xs font-semibold py-2">
                  View Demo
                </CustomButton>
              </Link>
              <Link href="/dashboard/create" className="flex-1">
                <CustomButton variant="primary" size="sm" className="w-full text-xs font-semibold py-2">
                  Use This
                </CustomButton>
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
