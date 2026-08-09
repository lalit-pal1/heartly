'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { 
  Sparkles, Play, ArrowRight, Gift, Camera, Heart, 
  Music, Lock, Smile, Calendar, Clock, Volume2, Check, X,
  AlertCircle, ShieldCheck, Zap, Laptop, ArrowUpRight,
  ChevronRight, RotateCcw
} from 'lucide-react';
import CustomButton from '@/components/ui/CustomButton';

// Funny responses for runaway button
const FUNNY_PHRASES = [
  "Arey ek chance to do 🥺",
  "Bas 2 min lagega 😭",
  "No not accepted 😤❤️",
  "Please try again? 👉👈",
  "I'll buy you ice cream! 🍦",
  "Don't break my heart 💔",
  "Nice try, click Yes! 😉"
];

// Curated high-quality Unsplash backdrops representing templates
const TEMPLATE_PRESETS = [
  { 
    id: 'birthday', 
    title: '🎂 Birthday Celebration', 
    tagline: 'Cinematic birthday story',
    desc: 'Light up their special day with floating particles, memory frames, and a heartfelt letter.', 
    color: 'shadow-[0_0_20px_rgba(168,85,247,0.25)] border-brand-purple/20', 
    glowColor: 'rgba(168, 85, 247, 0.15)',
    rotation: -1.5,
    img: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&auto=format&fit=crop&q=80'
  },
  { 
    id: 'anniversary', 
    title: '❤️ Anniversary Special', 
    tagline: 'Chronicle your years together',
    desc: 'Polaroid slideshow grid set to a romantic piano track with a lock key protect option.', 
    color: 'shadow-[0_0_20px_rgba(236,72,153,0.25)] border-brand-pink/20',
    glowColor: 'rgba(236, 72, 153, 0.15)',
    rotation: 1.2,
    img: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&auto=format&fit=crop&q=80'
  },
  { 
    id: 'friendship', 
    title: '👯 Friendship Archive', 
    tagline: 'Celebrate the crazy ones',
    desc: 'Say thank you to your partner in crime with inside joke captions and lofi background tunes.', 
    color: 'shadow-[0_0_20px_rgba(59,130,246,0.25)] border-brand-blue/20',
    glowColor: 'rgba(59, 130, 246, 0.15)',
    rotation: -1.0,
    img: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80'
  },
  { 
    id: 'proposal', 
    title: '💌 The Big Proposal', 
    tagline: 'Lead up to the ultimate question',
    desc: 'A slow-reveal story that builds emotional focus, culminating in a custom choice box.', 
    color: 'shadow-[0_0_20px_rgba(239,68,68,0.25)] border-red-500/20',
    glowColor: 'rgba(239, 68, 68, 0.15)',
    rotation: 1.8,
    img: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=600&auto=format&fit=crop&q=80'
  },
  { 
    id: 'sorry', 
    title: '🥺 Heartfelt Apology', 
    tagline: 'Mend bonds with sincerity',
    desc: 'Calming layout with typewriter letter pacing designed to clear up misunderstandings.', 
    color: 'shadow-[0_0_20px_rgba(156,163,175,0.25)] border-gray-400/20',
    glowColor: 'rgba(156, 163, 175, 0.1)',
    rotation: -0.8,
    img: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&auto=format&fit=crop&q=80'
  },
  { 
    id: 'farewell', 
    title: '🎓 Warm Farewell', 
    tagline: 'Send-offs with nostalgic notes',
    desc: 'Grid collage of shared moments and notes of support for their new life journey.', 
    color: 'shadow-[0_0_20px_rgba(20,184,166,0.25)] border-teal-500/20',
    glowColor: 'rgba(20, 184, 166, 0.15)',
    rotation: 1.4,
    img: 'https://images.unsplash.com/photo-1464746133101-a2c3f88e0dd9?w=600&auto=format&fit=crop&q=80'
  },
];

export default function HomePage() {
  const [heroSlide, setHeroSlide] = useState(1);
  const [demoStep, setDemoStep] = useState(1);
  const [noCount, setNoCount] = useState(0);
  const [noButtonPosition, setNoButtonPosition] = useState({ x: 0, y: 0 });

  // Autoplay hero phone mockup preview loop
  useEffect(() => {
    const interval = setInterval(() => {
      setHeroSlide((prev) => (prev === 4 ? 1 : prev + 1));
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const handleNoInteraction = () => {
    // Relocate runaway "No" button using spring physics offsets
    const x = (Math.random() - 0.5) * 180;
    const y = (Math.random() - 0.5) * 120;
    setNoButtonPosition({ x, y });
    setNoCount((prev) => prev + 1);
  };

  const triggerDemoConfetti = async () => {
    const confetti = (await import('canvas-confetti')).default;
    const defaults = { spread: 360, ticks: 50, gravity: 0.8, startVelocity: 20, colors: ['#A855F7', '#EC4899', '#3B82F6'] };
    confetti({ ...defaults, particleCount: 30, origin: { x: 0.5, y: 0.45 } });
  };

  useEffect(() => {
    if (demoStep === 5) {
      const interval = setInterval(triggerDemoConfetti, 400);
      const timeout = setTimeout(() => clearInterval(interval), 2000);
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [demoStep]);

  return (
    <div className="space-y-32 md:space-y-48">
      
      {/* 1. HERO SECTION */}
      <section className="relative grid grid-cols-1 lg:grid-cols-12 gap-16 items-center min-h-[85vh]">
        <div className="lg:col-span-7 space-y-8 text-left relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-purple/20 bg-brand-purple/5 text-brand-purple text-xs font-semibold"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Personalized Surprises reimagined for 2026</span>
          </motion.div>
          
          <div className="space-y-4">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl font-heading font-extrabold text-white tracking-tight leading-[1.1] text-glow"
            >
              Make your loved ones smile in the most <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-purple via-brand-pink to-brand-blue">unforgettable</span> way ❤️
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base sm:text-lg text-brand-muted max-w-xl leading-relaxed"
            >
              Create beautiful surprise experiences for birthdays, anniversaries, friendships, proposals and special moments. Crafted for mobile delivery.
            </motion.p>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap items-center gap-4"
          >
            <Link href="/dashboard/create">
              <CustomButton variant="glow" size="lg" icon={ArrowRight} iconPosition="right">
                Create Surprise
              </CustomButton>
            </Link>
            <a href="#demo">
              <CustomButton variant="glass" size="lg" icon={Play}>
                Watch Demo
              </CustomButton>
            </a>
          </motion.div>
        </div>

        {/* Hero mockup preview (Cinematic Auto Walkthrough) */}
        <div className="lg:col-span-5 flex justify-center relative select-none">
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-purple/20 via-transparent to-brand-pink/20 blur-3xl rounded-full" />
          
          {/* Phone container mockup */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative w-[290px] h-[580px] border-[6px] border-brand-border bg-brand-black rounded-[42px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col p-4 z-10"
          >
            {/* Phone notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-6 bg-brand-border rounded-b-2xl z-30 flex items-center justify-center">
              <div className="w-14 h-1 bg-brand-black rounded-full" />
            </div>

            {/* Screen Content Wrapper */}
            <div className="flex-1 flex flex-col justify-between pt-6 pb-2 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-radial-gradient from-brand-purple/10 to-transparent pointer-events-none" />
              
              <AnimatePresence mode="wait">
                {/* SLIDE 1: COVER */}
                {heroSlide === 1 && (
                  <motion.div 
                    key="hero-s1"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex-grow flex flex-col justify-center items-center p-3 space-y-6"
                  >
                    <div className="w-14 h-14 rounded-full bg-brand-pink/10 border border-brand-pink/20 flex items-center justify-center text-brand-pink animate-pulse">
                      <Heart className="w-7 h-7 fill-brand-pink/20" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-heading font-extrabold text-white text-sm">For Emma Watson ❤️</h4>
                      <p className="text-[10px] text-brand-muted">Someone has created a beautiful digital surprise story for you.</p>
                    </div>
                    <div className="w-full py-2 bg-gradient-to-r from-brand-purple to-brand-pink text-white rounded-lg text-[10px] font-bold shadow-md shadow-brand-purple/15">
                      Open Surprise
                    </div>
                  </motion.div>
                )}

                {/* SLIDE 2: NAME REVEAL */}
                {heroSlide === 2 && (
                  <motion.div 
                    key="hero-s2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex-grow flex flex-col justify-center items-center p-3 space-y-4"
                  >
                    <span className="text-[8px] tracking-widest text-brand-purple uppercase font-mono font-bold">Atmosphere Connected</span>
                    <div className="space-y-2">
                      <p className="text-[10px] text-brand-muted">This was made specially for...</p>
                      <h3 className="font-heading font-extrabold text-lg text-transparent bg-clip-text bg-gradient-to-r from-brand-purple via-brand-pink to-brand-blue text-glow-purple">
                        Emma Watson ✨
                      </h3>
                    </div>
                    <div className="text-[9px] text-brand-muted flex items-center gap-1">
                      <Volume2 className="w-3.5 h-3.5 text-brand-purple animate-bounce" />
                      <span>Soft Melody Playing</span>
                    </div>
                  </motion.div>
                )}

                {/* SLIDE 3: MEMORY PHOTO */}
                {heroSlide === 3 && (
                  <motion.div 
                    key="hero-s3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex-grow flex flex-col justify-center p-2 space-y-3"
                  >
                    <span className="text-[8px] font-mono text-brand-muted uppercase text-left block">Memory Slideshow</span>
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden border border-white/5 bg-white/[0.02]">
                      <Image 
                        src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&auto=format&fit=crop&q=80" 
                        alt="memory preview" 
                        fill
                        sizes="240px"
                        className="object-cover filter brightness-90"
                      />
                    </div>
                    <div className="glass-panel p-2.5 rounded-lg border border-white/5 text-[9px] text-brand-muted text-left italic">
                      “The night we got lost in the city and ended up laughing until sunrise.”
                    </div>
                  </motion.div>
                )}

                {/* SLIDE 4: LETTER WRITER & CONFETTI */}
                {heroSlide === 4 && (
                  <motion.div 
                    key="hero-s4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex-grow flex flex-col justify-center items-center p-3 space-y-4"
                  >
                    <div className="w-12 h-12 rounded-full bg-brand-pink/10 border border-brand-pink/20 flex items-center justify-center text-brand-pink">
                      <Gift className="w-6 h-6 fill-brand-pink/10" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-heading font-extrabold text-white text-sm">Happy Birthday Emma! 🎈</h4>
                      <p className="text-[9px] text-brand-muted px-2">“Thank you for making me laugh when I wanted to cry, and for simply being the incredible human being that you are...”</p>
                    </div>
                    <span className="text-[8px] text-brand-pink font-semibold bg-brand-pink/10 border border-brand-pink/20 px-2 py-0.5 rounded-full">
                      🎉 Bursting confetti
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Status bar */}
              <div className="text-[8px] text-brand-muted font-mono tracking-wider pt-2 mt-auto">
                heartly.me/r/emma-bday
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. HOW HEARTLY WORKS */}
      <section className="space-y-16">
        <div className="text-center space-y-4 max-w-xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-white text-glow">How Heartly Works</h2>
          <p className="text-sm text-brand-muted">Four premium automated steps to curate an everlasting smile.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { num: '01', title: 'Choose Occasion', desc: 'Select from our highly tailored, premium themes including birthdays, apologies, and proposals.', icon: Gift },
            { num: '02', title: 'Add Memories', desc: 'Drag and drop your favorite pictures, captions, and type out your personal letter.', icon: Camera },
            { num: '03', title: 'Atmospheric Setup', desc: 'Add background music, password locks, count downs, or scheduling settings.', icon: Music },
            { num: '04', title: 'Share Private Link', desc: 'Copy your unique URL and send it to your loved one via WhatsApp right at midnight.', icon: ArrowRight },
          ].map((step, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className="glass-card p-6 rounded-2xl flex flex-col justify-between text-left group min-h-[220px] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-purple/5 blur-2xl rounded-full" />
              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center text-brand-purple group-hover:scale-110 transition-transform duration-300">
                    <step.icon className="w-5 h-5" />
                  </div>
                  <span className="font-heading font-extrabold text-2xl text-white/5 group-hover:text-brand-pink/20 transition-colors">{step.num}</span>
                </div>
                <h3 className="font-heading font-semibold text-white text-base">{step.title}</h3>
                <p className="text-xs text-brand-muted leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 3. TEMPLATE PREVIEW SECTION */}
      <section className="space-y-16">
        <div className="text-center space-y-4 max-w-xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-white text-glow">Premium Templates</h2>
          <p className="text-sm text-brand-muted">Each card represents an emotional tone, styled expensive to delight receivers.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {TEMPLATE_PRESETS.map((tpl, idx) => (
            <motion.div
              key={tpl.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.05 }}
              style={{ rotate: tpl.rotation }}
              className={`glass-card p-5 rounded-3xl text-left border border-brand-border/60 hover:rotate-0 transition-all duration-300 relative group overflow-hidden ${tpl.color}`}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                   style={{ background: `radial-gradient(circle at center, ${tpl.glowColor} 0%, transparent 60%)` }} />
              
              <div className="space-y-4 relative z-10">
                {/* Custom Polaroid Stack Graphic */}
                <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden border border-white/5 bg-brand-dark/40 shadow-inner">
                  <Image 
                    src={tpl.img} 
                    alt={tpl.title} 
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover filter brightness-90 group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-black/60 via-transparent to-transparent" />
                  <span className="absolute bottom-3 left-3 text-[10px] font-bold tracking-wider text-white bg-brand-black/40 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/5 uppercase">
                    {tpl.id} vibe
                  </span>
                </div>

                <div>
                  <h3 className="font-heading font-bold text-white text-base group-hover:text-brand-purple transition-colors">{tpl.title}</h3>
                  <p className="text-[10px] text-brand-purple font-medium mt-0.5">{tpl.tagline}</p>
                </div>
                <p className="text-xs text-brand-muted leading-relaxed">{tpl.desc}</p>
              </div>

              <div className="pt-6 mt-4 border-t border-brand-border/40 flex items-center justify-between relative z-10 text-xs">
                <span className="text-brand-muted group-hover:text-white transition-colors">Select layout</span>
                <div className="p-1.5 rounded-full bg-brand-dark border border-brand-border/60 text-brand-muted group-hover:text-brand-purple group-hover:border-brand-purple/20 transition-all">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 4. DEMO EXPERIENCE SECTION */}
      <section id="demo" className="space-y-16 scroll-mt-24">
        <div className="text-center space-y-4 max-w-xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-white text-glow">Try a Demo Surprise</h2>
          <p className="text-sm text-brand-muted">Interact with a mock Heartly viewport below. Tap "No" to see the runaway script in action!</p>
        </div>
        
        <div className="flex justify-center select-none">
          {/* iOS Chassis Frame */}
          <div className="relative w-full max-w-sm h-[600px] border-[8px] border-brand-border bg-brand-black rounded-[48px] shadow-[0_30px_70px_-10px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col p-4">
            
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-6 bg-brand-border rounded-b-2xl z-30 flex items-center justify-center">
              <div className="w-16 h-1 bg-brand-black rounded-full" />
            </div>

            {/* Screen Chassis Container */}
            <div className="flex-1 bg-brand-black/80 rounded-[32px] overflow-hidden p-6 flex flex-col justify-between items-center text-center relative border border-white/5">
              {/* background glows */}
              <div className="absolute inset-0 bg-radial-gradient from-brand-pink/5 to-transparent pointer-events-none" />

              <AnimatePresence mode="wait">
                
                {/* STEP 1: COVER */}
                {demoStep === 1 && (
                  <motion.div 
                    key="d-s1"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    className="flex-grow flex flex-col justify-center items-center space-y-6"
                  >
                    <div className="w-14 h-14 rounded-full bg-brand-pink/10 border border-brand-pink/20 flex items-center justify-center text-brand-pink animate-bounce">
                      <Heart className="w-6 h-6 fill-brand-pink/20" />
                    </div>
                    <div className="space-y-2 px-2">
                      <h4 className="font-heading font-extrabold text-white text-base leading-snug">
                        Someone made something special for you ❤️
                      </h4>
                      <p className="text-[10px] text-brand-muted leading-relaxed">
                        Prepare to smile. Experience a mock story in real time.
                      </p>
                    </div>
                    <CustomButton variant="glow" size="sm" onClick={() => setDemoStep(2)}>
                      Open Surprise
                    </CustomButton>
                  </motion.div>
                )}

                {/* STEP 2: SMILE PROMISE (RUNAWAY BUTTON) */}
                {demoStep === 2 && (
                  <motion.div 
                    key="d-s2"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="flex-grow flex flex-col justify-center items-center space-y-8 w-full"
                  >
                    <h3 className="font-heading font-extrabold text-white text-base px-2">
                      Promise you will smile today? 🥺
                    </h3>
                    
                    {noCount > 0 && (
                      <motion.span 
                        key={noCount}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-[10px] text-brand-pink font-semibold bg-brand-pink/10 border border-brand-pink/20 px-3 py-1 rounded-full"
                      >
                        {FUNNY_PHRASES[(noCount - 1) % FUNNY_PHRASES.length]}
                      </motion.span>
                    )}

                    <div className="flex items-center gap-6 relative w-full justify-center min-h-[60px]">
                      <CustomButton 
                        variant="primary" 
                        size="sm" 
                        onClick={() => setDemoStep(3)}
                        className="px-6 py-2 z-10"
                      >
                        Yes ❤️
                      </CustomButton>
                      
                      <motion.div
                        animate={{ x: noButtonPosition.x, y: noButtonPosition.y }}
                        transition={{ type: 'spring', stiffness: 350, damping: 18 }}
                        className="z-10"
                      >
                        <button
                          onMouseEnter={handleNoInteraction}
                          onClick={handleNoInteraction}
                          className="px-4 py-2 rounded-lg border border-brand-border bg-brand-dark text-[11px] text-brand-muted hover:text-white transition-colors cursor-pointer"
                        >
                          No 🙄
                        </button>
                      </motion.div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: CINEMATIC REVEAL */}
                {demoStep === 3 && (
                  <motion.div 
                    key="d-s3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-grow flex flex-col justify-center items-center space-y-6"
                  >
                    <div className="space-y-2">
                      <p className="text-[8px] tracking-widest text-brand-purple uppercase font-mono font-bold">Atmosphere Playing</p>
                      <h4 className="text-xs text-brand-muted mt-2">This was made specially for...</h4>
                      <h2 className="font-heading font-extrabold text-lg text-transparent bg-clip-text bg-gradient-to-r from-brand-purple via-brand-pink to-brand-blue text-glow-purple">
                        My Favorite Person ✨
                      </h2>
                    </div>
                    <CustomButton variant="secondary" size="sm" icon={ChevronRight} iconPosition="right" onClick={() => setDemoStep(4)}>
                      Next
                    </CustomButton>
                  </motion.div>
                )}

                {/* STEP 4: POLAROID SLIDE */}
                {demoStep === 4 && (
                  <motion.div 
                    key="d-s4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex-grow flex flex-col justify-center space-y-3 w-full"
                  >
                    <span className="text-[8px] font-mono text-brand-muted text-left uppercase">Memory collage</span>
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden border border-white/5 bg-brand-dark/40">
                      <Image 
                        src="https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400&auto=format&fit=crop&q=80" 
                        alt="romantic mockup" 
                        fill
                        sizes="320px"
                        className="object-cover filter brightness-90"
                      />
                    </div>
                    <div className="glass-panel p-2.5 rounded-lg border border-white/5 text-[9px] text-brand-muted text-left italic">
                      “Cooking dinner together. We burnt the pasta but it was perfect.”
                    </div>
                    <CustomButton variant="primary" size="sm" onClick={() => setDemoStep(5)} className="w-full mt-2">
                      Unveil surprise
                    </CustomButton>
                  </motion.div>
                )}

                {/* STEP 5: FINAL CELEBRATION */}
                {demoStep === 5 && (
                  <motion.div 
                    key="d-s5"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-grow flex flex-col justify-center items-center space-y-6"
                  >
                    <div className="w-14 h-14 rounded-full bg-brand-pink/10 border border-brand-pink/20 flex items-center justify-center text-brand-pink">
                      <Heart className="w-6 h-6 fill-brand-pink/20 animate-ping" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-heading font-extrabold text-white text-base">Happy Anniversary! 🎈</h3>
                      <p className="text-[10px] text-brand-muted px-2">
                        “Thank you for loving me at my best, and more importantly, at my worst. Always yours...”
                      </p>
                    </div>
                    <button 
                      onClick={() => {
                        setDemoStep(1);
                        setNoCount(0);
                        setNoButtonPosition({ x: 0, y: 0 });
                      }}
                      className="text-[9px] font-semibold text-brand-purple hover:underline cursor-pointer flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Replay simulator</span>
                    </button>
                  </motion.div>
                )}

              </AnimatePresence>

              {/* URL slug */}
              <div className="text-[8px] text-brand-muted font-mono tracking-wider pt-2 mt-auto">
                heartly.me/r/demo-anniversary
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PRICING SECTION */}
      <section className="space-y-16">
        <div className="text-center space-y-4 max-w-xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-white text-glow">Pricing Tiers</h2>
          <p className="text-sm text-brand-muted">Simple pricing. Pay once per surprise link and own it forever.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 select-none">
          {[
            {
              name: 'Free',
              price: '₹0',
              tagline: 'Simple heartfelt note',
              features: ['2 Memory Photos', 'Heartly Watermark', 'Standard loading speeds', 'Basic themes only', 'Standard sharing slug'],
              buttonText: 'Get Started',
              popular: false,
            },
            {
              name: 'Basic',
              price: '₹39',
              tagline: 'Sleek custom surprise',
              features: ['5 Memory Photos', 'Custom text formatting', 'Melody soundtrack options', '1 Premium theme', 'No Watermark', 'Custom URL slug'],
              buttonText: 'Create Basic',
              popular: false,
            },
            {
              name: 'Premium',
              price: '₹79',
              tagline: 'The ideal emotional gift',
              features: ['10 Memory Photos', 'Access to all themes', 'Special passcode lock', 'Active countdown timer', 'Priority load speeds', 'No Watermark', 'Lifetime Archival'],
              buttonText: 'Create Premium',
              popular: true,
            },
            {
              name: 'Luxury',
              price: '₹149',
              tagline: 'For absolute perfection',
              features: ['20 Memory Photos', 'Voice note uploads', 'Midnight Unlock Schedule', 'Hidden interaction keys', 'Priority VIP Support', 'Custom metadata tags', 'Lifetime Archival'],
              buttonText: 'Create Luxury',
              popular: false,
            },
          ].map((plan, idx) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className={`rounded-3xl p-6 text-left relative flex flex-col justify-between border ${
                plan.popular 
                  ? 'border-brand-purple shadow-[0_0_30px_rgba(168,85,247,0.15)] bg-gradient-to-b from-brand-purple/10 to-brand-dark/95 scale-105 z-10' 
                  : 'border-brand-border bg-brand-dark/40'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-brand-purple to-brand-pink text-[9px] font-bold tracking-widest uppercase rounded-full text-white shadow-md">
                  Most Popular
                </div>
              )}
              <div className="space-y-6">
                <div className="space-y-1">
                  <h3 className="font-heading font-bold text-lg text-white">{plan.name}</h3>
                  <p className="text-[11px] text-brand-muted">{plan.tagline}</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-heading font-extrabold text-white">{plan.price}</span>
                  {plan.price !== '₹0' && <span className="text-xs text-brand-muted">/ surprise</span>}
                </div>
                <hr className="border-brand-border" />
                <ul className="space-y-3">
                  {plan.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2 text-xs text-brand-muted">
                      <Check className="w-3.5 h-3.5 text-brand-purple shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-8">
                <Link href="/dashboard/create">
                  <CustomButton 
                    variant={plan.popular ? 'glow' : 'secondary'} 
                    className="w-full text-xs font-semibold py-2.5"
                  >
                    {plan.buttonText}
                  </CustomButton>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 6. WHY HEARTLY (EDITORIAL COMPONENT) */}
      <section className="space-y-16">
        <div className="text-center space-y-4 max-w-xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-white text-glow">The Heartly Difference</h2>
          <p className="text-sm text-brand-muted">Why digital storytelling experiences beat physical alternatives.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* TRADITIONAL COLUMN */}
          <div className="glass-panel p-8 rounded-3xl border border-brand-border flex flex-col justify-between space-y-6 text-left opacity-70 hover:opacity-100 transition-opacity duration-300">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                <X className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-bold text-lg text-white">Traditional Greeting Card</h3>
              <p className="text-xs text-brand-muted leading-relaxed">
                Standard cards get thrown away or put in a cabinet. They arrive late due to courier shipping delays, contain static letters with no music, and fail to capture multiple photo memories.
              </p>
            </div>
            <ul className="space-y-2.5 border-t border-brand-border/40 pt-6 text-xs text-brand-muted">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                <span>3-5 Working Days Shipping</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                <span>No animations or atmospheric music</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                <span>Static paper (silent and limited space)</span>
              </li>
            </ul>
          </div>

          {/* HEARTLY COLUMN */}
          <div className="rounded-3xl p-8 border border-brand-purple/20 bg-brand-purple/5 shadow-[0_0_20px_rgba(168,85,247,0.05)] flex flex-col justify-between space-y-6 text-left">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-lg bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center text-brand-purple">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-bold text-lg text-white">Heartly Digital Surprise Link</h3>
              <p className="text-xs text-brand-muted leading-relaxed">
                An interactive cinematic digital monument of your memories, accessible instantly and kept permanently. Set background melodies, lock it with password passcodes, and play scrolling typewriter captures.
              </p>
            </div>
            <ul className="space-y-2.5 border-t border-brand-border/40 pt-6 text-xs text-brand-muted">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-purple" />
                <span className="text-white font-medium">Delivered instantly at exactly 12:00 AM</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-purple" />
                <span className="text-white font-medium">Curated background melodies and confetti</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-purple" />
                <span className="text-white font-medium">Permanent digital URL (accessible anywhere)</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 7. TESTIMONIALS */}
      <section className="space-y-16">
        <div className="text-center space-y-4 max-w-xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-white text-glow">Real Emotional Reactions</h2>
          <p className="text-sm text-brand-muted">What users feel when they receive a Heartly surprise.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              quote: "My partner created an anniversary page for me on Heartly. When the music faded in and our college photos scrolled by, I literally got goosebumps. It was so much more special than a physical card.",
              author: "Ananya Roy",
              role: "Received Anniversary Surprise",
              color: "text-brand-purple"
            },
            {
              quote: "I wanted to apologize to my best friend after a huge misunderstanding. The 'Promise you will smile' question broke the ice perfectly. The custom music played and we sorted things out.",
              author: "Kabir Sharma",
              role: "Created Sorry Surprise",
              color: "text-brand-pink"
            },
            {
              quote: "Sent my sister a surprise link right at 12:00 AM on her birthday. She woke up, clicked it, and called me crying happy tears. The experience layout feels extremely high-end and premium.",
              author: "Nisha Patel",
              role: "Created Birthday Surprise",
              color: "text-brand-blue"
            }
          ].map((t, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="glass-card p-6 rounded-2xl text-left flex flex-col justify-between"
            >
              <p className="text-xs text-brand-muted italic leading-relaxed">
                "{t.quote}"
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full bg-brand-dark border border-brand-border flex items-center justify-center text-xs font-bold ${t.color}`}>
                  {t.author.charAt(0)}
                </div>
                <div>
                  <h4 className="font-heading font-semibold text-white text-xs">{t.author}</h4>
                  <p className="text-[10px] text-brand-muted">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 8. FINAL CTA SECTION */}
      <section className="relative rounded-3xl overflow-hidden border border-brand-purple/20 bg-gradient-to-r from-brand-purple/10 to-brand-pink/5 p-8 md:p-16 text-center space-y-6">
        <div className="absolute top-0 right-1/4 w-[300px] h-[300px] glow-purple opacity-20 pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] glow-pink opacity-20 pointer-events-none" />
        
        <h2 className="text-3xl md:text-5xl font-heading font-extrabold text-white text-glow max-w-2xl mx-auto leading-tight">
          Someone special deserves something unforgettable ❤️
        </h2>
        <p className="text-xs sm:text-sm text-brand-muted max-w-md mx-auto">
          Create their cinematic digital surprise in less than 5 minutes. Seed happiness today.
        </p>
        <div className="pt-4">
          <Link href="/dashboard/create">
            <CustomButton variant="glow" size="lg" icon={ArrowRight} iconPosition="right">
              Create Your Surprise
            </CustomButton>
          </Link>
        </div>
      </section>

    </div>
  );
}
