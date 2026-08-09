'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, Sparkles, User, Smile } from 'lucide-react';
import CustomButton from '@/components/ui/CustomButton';

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-16 text-left">
      <div className="space-y-4 text-center">
        <div className="inline-flex items-center justify-center p-3 rounded-full bg-brand-pink/10 border border-brand-pink/20 text-brand-pink mb-2">
          <Heart className="w-8 h-8 fill-brand-pink/20" />
        </div>
        <h1 className="text-4xl font-heading font-extrabold text-white text-glow">Our Story</h1>
        <p className="text-sm text-brand-muted max-w-lg mx-auto">
          We believe gifting should feel cinematic, memorable, and deeply personal.
        </p>
      </div>

      <div className="glass-panel p-8 rounded-3xl border border-brand-border space-y-6 text-sm text-brand-muted leading-relaxed">
        <p>
          It started with a simple problem: physical cards are easily lost, standard greeting websites look like they were built in 2005, and social media posts lack privacy and depth. When you want to tell someone how much they mean to you, there should be a medium that matches that importance.
        </p>
        <p>
          We created <span className="text-white font-semibold">Heartly</span> to bridge that gap. We merged premium aesthetic layouts (drawing inspiration from Apple and Netflix interfaces) with smooth, interactive transitions to construct a digital canvas.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
          <div className="p-4 rounded-xl border border-brand-border bg-brand-dark/40">
            <h4 className="font-heading font-semibold text-white text-xs mb-1">Modern Aesthetic</h4>
            <p className="text-[11px]">No cluttered, neon pink frames. Sleek matte dark backdrops, smooth glass containers, and clean typography.</p>
          </div>
          <div className="p-4 rounded-xl border border-brand-border bg-brand-dark/40">
            <h4 className="font-heading font-semibold text-white text-xs mb-1">Emotional Flow</h4>
            <p className="text-[11px]">An atmospheric reveal sequence built step-by-step to build suspense, play music, and trigger happiness.</p>
          </div>
        </div>
        <p>
          Whether it is a birthday, anniversary milestone, saying sorry, or proposing to the person you love, Heartly ensures your feelings are delivered in the most premium format possible.
        </p>
      </div>

      <div className="text-center">
        <Link href="/dashboard/create">
          <CustomButton variant="glow" size="md">
            Create Your First Surprise
          </CustomButton>
        </Link>
      </div>
    </div>
  );
}
