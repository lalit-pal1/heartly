'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { 
  Heart, Volume2, VolumeX, ArrowRight, Play, Pause,
  RotateCcw, Sparkles, ChevronRight, Gift, Smile, 
  RefreshCw, Frown, Sparkle, Share2
} from 'lucide-react';

import CustomButton from '@/components/ui/CustomButton';
import FloatingBackgroundParticles from '@/components/ui/FloatingBackgroundParticles';
import SparkleEffect from '@/components/ui/SparkleEffect';
import BirthdayCakeReveal from '@/components/ui/BirthdayCakeReveal';
import AnniversaryHeartReveal from '@/components/ui/AnniversaryHeartReveal';
import SorryEmotionalPause from '@/components/ui/SorryEmotionalPause';
import FriendshipRoast from '@/components/ui/FriendshipRoast';
import FarewellFutureWishes from '@/components/ui/FarewellFutureWishes';
import LoveFeelingsReveal from '@/components/ui/LoveFeelingsReveal';
import LoveProposal from '@/components/ui/LoveProposal';
import { OccasionTheme } from '@/utils/occasionThemes';
import OneLastSurpriseReveal from '@/components/ui/OneLastSurpriseReveal';

// Music URLs are resolved dynamically from the database.

export interface Memory {
  id: string;
  imageUrl: string;
  caption: string;
}

export interface SurpriseData {
  id: string;
  recipientName: string;
  occasion: string;
  relationship: string;
  memories: Memory[];
  message: string;
  music: string;
  theme: string;
  cuteNoButton?: boolean;
  hiddenEndingUrl?: string | null;
  planType?: string;
  plan?: string; // fallback matching r/[id] context
  olsEnabled?: boolean;
  olsMessage?: string | null;
  olsStyle?: string;
  olsMusicUrl?: string | null;
  olsVoiceNoteUrl?: string | null;
}

interface FloatingEmoji {
  id: number;
  char: string;
  x: number;
  delay: number;
}

// Helper to gracefully fade audio volume
const fadeAudio = (audio: HTMLAudioElement | null, targetVolume: number, durationMs: number = 800) => {
  if (!audio) return;
  const startVolume = audio.volume;
  const volumeDifference = targetVolume - startVolume;
  if (volumeDifference === 0) return;

  const startTime = performance.now();

  const updateVolume = (now: number) => {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / durationMs, 1);
    
    // Ease out quad
    const easeProgress = progress * (2 - progress);
    
    // Clamp the volume between 0 and 1 to prevent floating-point underflow/overflow errors
    audio.volume = Math.max(0, Math.min(1, startVolume + volumeDifference * easeProgress));

    if (progress < 1) {
      requestAnimationFrame(updateVolume);
    }
  };

  requestAnimationFrame(updateVolume);
};


const getStepTransition = (theme: OccasionTheme): any => {
  const { transitionType, stepDuration } = theme.motion;
  if (transitionType === 'playful') {
    return { type: 'spring', stiffness: 140, damping: 15 };
  }
  if (transitionType === 'slow-calm') {
    return { ease: 'easeOut', duration: stepDuration };
  }
  if (transitionType === 'slow-elegant') {
    return { ease: 'easeInOut', duration: stepDuration };
  }
  if (transitionType === 'nostalgic') {
    return { ease: 'easeInOut', duration: stepDuration };
  }
  return { ease: [0.16, 1, 0.3, 1], duration: stepDuration };
};

interface OccasionCinematicFlowProps {
  surprise: SurpriseData;
  occasionTheme: OccasionTheme;
  bgGradient: string;
  glowColor: string;
  accentColor: string;
  buttonGradient: string;
  onReactionSend?: (emoji: string) => void;
  onGoHome?: () => void;
  isPreview?: boolean;
  onComplete?: () => void;
}

export default function OccasionCinematicFlow({
  surprise,
  occasionTheme,
  bgGradient,
  glowColor,
  accentColor,
  buttonGradient,
  onReactionSend,
  onGoHome,
  isPreview = false,
  onComplete
}: OccasionCinematicFlowProps) {
  
  const router = useRouter();
  // flow steps: e.g. ['intro', 'promise', 'hero', 'memories', 'cake', 'letter', 'celebration', 'outro']
  const flowSteps = occasionTheme.flow || ['intro', 'promise', 'hero', 'memories', 'letter', 'celebration', 'outro'];
  const [stepIndex, setStepIndex] = useState(0);
  const currentStep = flowSteps[stepIndex];

  // Trigger onComplete when the flow reaches the final screen
  useEffect(() => {
    if (currentStep === 'outro' && !isPreview && onComplete) {
      onComplete();
    }
  }, [currentStep, isPreview, onComplete]);

  const getNextStepButtonLabel = (nextStepName: string) => {
    switch (nextStepName) {
      case 'cake':
        return 'Blow Candle 🎂';
      case 'heart-reveal':
        return 'Unlock Heart 💖';
      case 'emotional-pause':
        return 'Continue 🥹';
      case 'roast':
        return 'Tolerate Me 😈';
      case 'future-wishes':
        return 'Continue 🌅';
      case 'feelings-reveal':
        return 'Continue ❤️';
      case 'proposal':
        return 'Continue 💍';
      case 'letter':
        return 'Read Letter ✉️';
      default:
        return 'Continue';
    }
  };

  const getHeroNameTitle = () => {
    const name = surprise.recipientName;
    if (occasionTheme.id === 'birthday') return `Happy Birthday ${name}! 🎂❤️`;
    if (occasionTheme.id === 'anniversary') return `Happy Anniversary ${name}! 🥂❤️`;
    if (occasionTheme.id === 'sorry') return `I'm really sorry ${name} 🥺`;
    if (occasionTheme.id === 'farewell') return `We'll miss you ${name} 👋❤️`;
    return `${name} ❤️`;
  };

  // Interactivity states
  const [noCount, setNoCount] = useState(0);
  const [noButtonPosition, setNoButtonPosition] = useState({ x: 0, y: 0 });
  const [shareCopied, setShareCopied] = useState(false);
  const [musicMuted, setMusicMuted] = useState(false);
  const [currentMemoryIdx, setCurrentMemoryIdx] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const [showHiddenEnding, setShowHiddenEnding] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const [emojiCount, setEmojiCount] = useState(0);

  const [unlockState, setUnlockState] = useState<'idle' | 'animating' | 'completed'>('idle');

  // OLS Cinematic Stage State
  const [olsStage, setOlsStage] = useState<'idle' | 'the_end' | 'fade_black' | 'actually' | 'title' | 'animating' | 'completed'>('idle');
  const [olsVoicePlaying, setOlsVoicePlaying] = useState(false);
  const olsAudioRef = useRef<HTMLAudioElement | null>(null);
  const olsVoiceAudioRef = useRef<HTMLAudioElement | null>(null);

  const handleUnlockClick = () => {
    if (unlockState !== 'idle') return;
    setUnlockState('animating');
    // Fade in background music if not muted
    if (audioRef.current && !musicMuted) {
      audioRef.current.volume = 0;
      audioRef.current.play()
        .then(() => fadeAudio(audioRef.current, 0.45, 1200))
        .catch(err => console.log('Audio autoplay interaction:', err));
    }
    setTimeout(() => {
      setUnlockState('completed');
      handleNextStep();
    }, 1500);
  };

  // Audio refs
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Preload background music
  useEffect(() => {
    if (surprise && !audioRef.current) {
      const audioUrl = surprise.music;
      if (audioUrl) {
        const audio = new Audio(audioUrl);
        audio.preload = 'auto';
        audio.loop = true;
        audio.volume = 0.45;
        audioRef.current = audio;
      }
    }
  }, [surprise]);

  // Handle music mute synchronization
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = musicMuted;
    }
  }, [musicMuted]);

  // Clean up audio objects on unmount
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (olsAudioRef.current) {
        olsAudioRef.current.pause();
        olsAudioRef.current = null;
      }
      if (olsVoiceAudioRef.current) {
        olsVoiceAudioRef.current.pause();
        olsVoiceAudioRef.current = null;
      }
    };
  }, []);

  // OLS timing control loop
  useEffect(() => {
    if (olsStage === 'idle') return;

    let timer: NodeJS.Timeout;

    if (olsStage === 'the_end') {
      timer = setTimeout(() => {
        setOlsStage('fade_black');
      }, 2500);
    } else if (olsStage === 'fade_black') {
      // Fade out main background music
      if (audioRef.current && !musicMuted) {
        fadeAudio(audioRef.current, 0, 1000);
      }
      
      // Load ending music if provided
      if (surprise.olsMusicUrl && !musicMuted && !olsAudioRef.current) {
        olsAudioRef.current = new Audio(surprise.olsMusicUrl);
        olsAudioRef.current.loop = true;
        olsAudioRef.current.volume = 0;
      }
      
      timer = setTimeout(() => {
        setOlsStage('actually');
      }, 1500);
    } else if (olsStage === 'actually') {
      // Fade in ending music if provided, otherwise restore main background music to default volume
      if (olsAudioRef.current && !musicMuted) {
        olsAudioRef.current.muted = false;
        olsAudioRef.current.play()
          .then(() => fadeAudio(olsAudioRef.current, 0.45, 1200))
          .catch(err => console.log('OLS ending music autoplay fail:', err));
      } else if (audioRef.current && !musicMuted) {
        // If no custom OLS music, fade main music back up
        fadeAudio(audioRef.current, 0.45, 1000);
      }

      timer = setTimeout(() => {
        setOlsStage('title');
      }, 2000);
    } else if (olsStage === 'title') {
      timer = setTimeout(() => {
        setOlsStage('animating');
      }, 2500);
    }

    return () => clearTimeout(timer);
  }, [olsStage, surprise.olsMusicUrl, musicMuted]);

  // Confetti trigger for celebration screen
  useEffect(() => {
    if (currentStep === 'celebration') {
      let active = true;
      const runConfetti = async () => {
        try {
          const confetti = (await import('canvas-confetti')).default;
          const duration = 4.5 * 1000;
          const animationEnd = Date.now() + duration;
          const defaults = { startVelocity: 22, spread: 360, ticks: 50, zIndex: 100 };

          const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

          const interval = setInterval(() => {
            if (!active) {
              clearInterval(interval);
              return;
            }
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);

            const count = 35 * (timeLeft / duration);
            confetti({ ...defaults, particleCount: count, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount: count, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
          }, 250);
        } catch (err) {
          console.warn('Confetti fail:', err);
        }
      };
      runConfetti();
      return () => {
        active = false;
      };
    }
  }, [currentStep]);

  // Trigger floating emojis in outro
  const handleEmojiReact = (char: string) => {
    const nextEmoji: FloatingEmoji = {
      id: emojiCount,
      char,
      x: Math.random() * 120 - 60,
      delay: Math.random() * 0.1
    };
    setFloatingEmojis((prev) => [...prev, nextEmoji]);
    setEmojiCount((prev) => prev + 1);

    // Call database logger callback if provided
    if (onReactionSend) {
      onReactionSend(char);
    }

    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter(e => e.id !== nextEmoji.id));
    }, 2200);
  };

  const handleToggleMute = () => {
    const willMute = !musicMuted;
    
    if (audioRef.current) {
      if (willMute) {
        fadeAudio(audioRef.current, 0, 400);
        setTimeout(() => {
          if (audioRef.current) audioRef.current.muted = true;
        }, 400);
      } else {
        audioRef.current.muted = false;
        audioRef.current.volume = 0;
        fadeAudio(audioRef.current, 0.45, 600);
      }
    }

    if (olsAudioRef.current) {
      if (willMute) {
        fadeAudio(olsAudioRef.current, 0, 400);
        setTimeout(() => {
          if (olsAudioRef.current) olsAudioRef.current.muted = true;
        }, 400);
      } else {
        olsAudioRef.current.muted = false;
        olsAudioRef.current.volume = 0;
        fadeAudio(olsAudioRef.current, 0.45, 600);
      }
    }
    
    setMusicMuted(willMute);
  };

  const handleNoButtonRunaway = () => {
    const x = (Math.random() - 0.5) * 200;
    const y = (Math.random() - 0.5) * 110;
    setNoButtonPosition({ x, y });
    setNoCount((prev) => prev + 1);
  };

  const handleYesClick = () => {
    // Proceed to next step
    const nextIdx = flowSteps.indexOf('promise') + 1;
    if (nextIdx > 0 && nextIdx < flowSteps.length) {
      setStepIndex(nextIdx);
    }
    
    // Play background music
    if (audioRef.current && !musicMuted) {
      audioRef.current.volume = 0;
      audioRef.current.play()
        .then(() => fadeAudio(audioRef.current, 0.45, 1200))
        .catch(err => console.log('Audio autoplay interaction:', err));
    }
  };

  const getActiveOlsStyle = () => {
    if (!surprise.olsStyle || surprise.olsStyle === 'auto') {
      const occ = (surprise.occasion || '').toLowerCase();
      if (occ === 'love') return 'hearts';
      if (occ === 'proposal') return 'ring';
      if (occ === 'birthday') return 'balloons';
      if (occ === 'anniversary') return 'timeline';
      if (occ === 'sorry') return 'sorry';
      if (occ === 'friendship') return 'polaroid';
      return 'fireworks';
    }
    return surprise.olsStyle;
  };

  const handleOlsAnimationComplete = () => {
    setOlsStage('completed');
    
    // Autoplay voice note if provided
    if (surprise.olsVoiceNoteUrl) {
      if (olsAudioRef.current) {
        fadeAudio(olsAudioRef.current, 0.08, 500);
      } else if (audioRef.current) {
        fadeAudio(audioRef.current, 0.08, 500);
      }
      
      const voiceAudio = new Audio(surprise.olsVoiceNoteUrl);
      olsVoiceAudioRef.current = voiceAudio;
      voiceAudio.volume = 1.0;
      
      voiceAudio.addEventListener('ended', () => {
        setOlsVoicePlaying(false);
        if (olsAudioRef.current) {
          fadeAudio(olsAudioRef.current, 0.45, 600);
        } else if (audioRef.current && !musicMuted) {
          fadeAudio(audioRef.current, 0.45, 600);
        }
      });
      
      setOlsVoicePlaying(true);
      voiceAudio.play().catch(err => console.warn('OLS Voice note autoplay fail:', err));
    }
    
    setStepIndex(flowSteps.indexOf('outro'));
  };

  const handleNextStep = () => {
    const plan = (planType || '').toLowerCase();
    if (currentStep === 'celebration' && surprise.olsEnabled && plan === 'luxury') {
      setOlsStage('the_end');
      return;
    }
    setStepIndex((prev) => Math.min(flowSteps.length - 1, prev + 1));
  };

  const handlePrevStep = () => {
    setStepIndex((prev) => Math.max(0, prev - 1));
  };

  const handleCakeComplete = () => {
    handleNextStep();
  };

  const handleReplay = () => {
    // Reset indices
    setStepIndex(flowSteps.indexOf('hero')); // Restart from greeting
    setCurrentMemoryIdx(0);
    setShowHiddenEnding(false);
    setUnlockState('idle');
    setOlsStage('idle');
    setOlsVoicePlaying(false);

    // Reset audio
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      if (!musicMuted) {
        audioRef.current.volume = 0;
        audioRef.current.play()
          .then(() => fadeAudio(audioRef.current, 0.45, 1200))
          .catch(err => console.log('Audio replay error:', err));
      }
    }
    if (olsAudioRef.current) {
      olsAudioRef.current.pause();
      olsAudioRef.current.currentTime = 0;
    }
    if (olsVoiceAudioRef.current) {
      olsVoiceAudioRef.current.pause();
    }
  };

  // Helper to render opening icons
  const renderOpeningIcon = (iconName: string) => {
    const iconClass = "w-8 h-8";
    switch (iconName) {
      case 'gift':
        return <Gift className={`${iconClass} fill-amber-400/20 text-amber-400`} />;
      case 'smile':
        return <Smile className={`${iconClass} fill-teal-400/20 text-teal-400`} />;
      case 'sorry':
        return <Frown className={`${iconClass} fill-sky-400/20 text-sky-400`} />;
      case 'farewell':
        return <Sparkles className={`${iconClass} fill-indigo-400/20 text-indigo-400`} />;
      case 'heart':
      default:
        return <Heart className={`${iconClass} fill-rose-500/20 text-rose-500 animate-pulse`} />;
    }
  };

  // Helper to map timeline labels for Anniversary memories
  const getTimelineLabel = (idx: number, total: number) => {
    if (idx === 0) return "Where it started 📍";
    if (idx === total - 1) return "Still my favorite person 🥂";
    if (idx === 1) return "Our sweet moments ✨";
    return "A beautiful chapter 📸";
  };

  // Helper to map timeline labels for Friendship memories (funny progression)
  const getFriendshipTimelineLabel = (idx: number, total: number) => {
    if (idx === 0) return "First chaos 😂";
    if (idx === total - 1) return "Still friends somehow ❤️";
    if (idx === 1) return "Peak stupidity 😭";
    return "A golden chapter 🍕";
  };

  // Helper to map timeline labels for Farewell memories (nostalgic progression)
  const getFarewellTimelineLabel = (idx: number, total: number) => {
    if (idx === 0) return "The best memory 😭";
    if (idx === total - 1) return "A few memories before goodbye ✨";
    if (idx === 1) return "Can't believe this actually happened ✨";
    return "The funny times 📸";
  };

  // Helper to map timeline labels for Love memories
  const getLoveTimelineLabel = (idx: number, total: number) => {
    if (idx === 0) return "Still my favorite memory ❤️";
    if (idx === total - 1) return "The moment everything changed ✨";
    if (idx === 1) return "Every second with you 🥂";
    return "A beautiful page of us 📸";
  };

  const planType = surprise.planType || surprise.plan || 'Free';

  return (
    <div className={`min-h-screen bg-brand-black text-foreground relative overflow-hidden flex flex-col justify-center items-center p-4 select-none w-full ${occasionTheme.typography.fontClass} ${surprise.theme === 'nordic' ? 'theme-light' : ''}`}>
      {/* Dynamic gradients overlay */}
      <div className={`absolute inset-0 transition-all duration-1000 ${bgGradient}`} />
      <div className={`absolute inset-0 opacity-10 pointer-events-none ${glowColor}`} />
      {surprise.theme === 'sunset' && (
        <div className="absolute inset-0 bg-glow-gold-bloom opacity-30 pointer-events-none z-10 animate-pulse-slow" />
      )}

      {/* Ambient custom lighting overlay based on occasion theme */}
      {occasionTheme.ambientOverlayClass && (
        <div className={`absolute inset-0 pointer-events-none ${occasionTheme.ambientOverlayClass}`} />
      )}

      {/* Floating Emojis in Outro */}
      {currentStep === 'outro' && (
        <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
          {floatingEmojis.map((emoji) => (
            <motion.div
              key={emoji.id}
              initial={{ opacity: 1, y: '100vh', x: `calc(50% + ${emoji.x}px)` }}
              animate={{ opacity: 0, y: '-10vh' }}
              transition={{ duration: 2.2, ease: 'easeOut', delay: emoji.delay }}
              className="absolute text-3xl"
            >
              {emoji.char}
            </motion.div>
          ))}
        </div>
      )}

      {/* Background Particles from step 3 onwards */}
      {stepIndex >= 2 && (() => {
        const getThemeParticles = () => {
          if (surprise.theme === 'midnight') return ['✨', '⭐', '💫', '🌟'];
          if (surprise.theme === 'sunset') return ['✨', '🔥', '🍂', '💛'];
          if (surprise.theme === 'nordic') return ['🤍', '✨', '🌸', '✨'];
          return occasionTheme.particles.emojis;
        };
        return (
          <FloatingBackgroundParticles emojis={getThemeParticles()} count={12} />
        );
      })()}

      {/* Dynamic Ambient Sparkles */}
      {occasionTheme.sparkles && ['hero', 'memories', 'feelings-reveal', 'proposal', 'celebration'].includes(currentStep) && (
        <SparkleEffect 
          count={occasionTheme.sparkles.count} 
          colorClass={occasionTheme.sparkles.colorClass}
          shadowFilter={occasionTheme.sparkles.shadowFilter}
        />
      )}

      {/* Top Bar Controls */}
      {stepIndex >= 2 && (
        <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-50">
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-muted">
            <Heart className="w-4 h-4 text-brand-pink fill-brand-pink/20 animate-pulse" />
            <span>Heartly Surprise</span>
          </div>
          <button 
            onClick={handleToggleMute}
            className="p-2 rounded-lg border border-brand-border bg-brand-dark/40 text-brand-muted hover:text-white cursor-pointer transition-colors"
          >
            {musicMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10 text-center px-4 py-8">
        <AnimatePresence mode="wait">
          
          {/* STEP: INTRO */}
          {currentStep === 'intro' && (() => {
            const plan = (planType || '').toLowerCase();
            const isPremium = plan === 'premium';
            const isLuxury = plan === 'luxury';
            const isStandard = !isPremium && !isLuxury;

            if (isStandard) {
              return (
                <motion.div 
                  key="intro-step"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={getStepTransition(occasionTheme)}
                  className="space-y-6"
                >
                  <div className="w-16 h-16 rounded-full bg-brand-dark/60 border border-brand-border flex items-center justify-center mx-auto animate-bounce shadow-xl">
                    {renderOpeningIcon(occasionTheme.hero.openingIcon)}
                  </div>
                  <div className="space-y-2">
                    <h1 className={`${occasionTheme.typography.headingFont} font-extrabold text-white text-2xl leading-snug`}>
                      {occasionTheme.hero.title}
                    </h1>
                    <p className="text-xs text-brand-muted">{occasionTheme.hero.subtitle}</p>
                  </div>
                  <div className="pt-2">
                    <CustomButton 
                      variant="glow" 
                      size="lg" 
                      icon={ArrowRight} 
                      iconPosition="right" 
                      onClick={handleNextStep}
                    >
                      Open Surprise
                    </CustomButton>
                  </div>
                </motion.div>
              );
            }

            // Redesigned Premium / Luxury Flow
            const normOcc = (surprise.occasion || '').toLowerCase().trim();
            let helperText = 'Tap the heart to begin ❤️';
            if (normOcc.includes('birthday')) {
              helperText = 'Tap the gift to open your surprise 🎁';
            } else if (normOcc.includes('love')) {
              helperText = 'Tap the heart to reveal my feelings ❤️';
            } else if (normOcc.includes('anniversary')) {
              helperText = 'Tap the ring to celebrate our journey 💍';
            } else if (normOcc.includes('proposal')) {
              helperText = 'Tap the rose to read my proposal 🌹';
            } else if (normOcc.includes('friendship') || normOcc.includes('farewell')) {
              helperText = 'Tap the hands to begin our story 🤝';
            } else if (normOcc.includes('sorry')) {
              helperText = 'Tap the heart to forgive me 🥺';
            } else if (normOcc.includes('congratulations')) {
              helperText = 'Tap the popper to celebrate 🎉';
            }

            return (
              <motion.div 
                key="intro-step-premium-luxury"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={getStepTransition(occasionTheme)}
                className="space-y-8 flex flex-col items-center justify-center"
              >
                <div className="space-y-2">
                  <h1 className={`${occasionTheme.typography.headingFont} font-extrabold text-white text-2xl sm:text-3xl leading-snug`}>
                    {occasionTheme.hero.title}
                  </h1>
                  <p className="text-xs text-brand-muted max-w-[280px] mx-auto leading-relaxed">
                    {occasionTheme.hero.subtitle}
                  </p>
                </div>

                {/* Interactive Trigger Container */}
                <div className="relative py-4 flex flex-col items-center justify-center w-full min-h-[220px]">
                  {/* Luxury Effects (glow, blurs, particles) */}
                  {isLuxury && (
                    <>
                      {/* Ambient glows */}
                      <div className="absolute w-48 h-48 rounded-full bg-gradient-to-tr from-brand-pink/30 to-brand-purple/30 blur-2xl opacity-75 animate-pulse pointer-events-none" />
                      <div className="absolute w-36 h-36 rounded-full bg-gradient-to-br from-amber-400/20 to-rose-500/20 blur-xl opacity-50 animate-bounce-slow pointer-events-none" />
                      
                      {/* Floating local particles */}
                      {isMounted && (
                        <div className="absolute inset-0 pointer-events-none overflow-hidden h-full w-full">
                          {[...Array(6)].map((_, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ 
                                opacity: 0, 
                                y: 100, 
                                x: (idx - 2.5) * 50 + (Math.random() - 0.5) * 20, 
                                scale: 0.5 + Math.random() * 0.5 
                              }}
                              animate={{ 
                                opacity: [0, 0.7, 0.7, 0], 
                                y: -80,
                                x: (idx - 2.5) * 50 + (Math.random() - 0.5) * 40
                              }}
                              transition={{ 
                                duration: 3 + Math.random() * 2, 
                                repeat: Infinity, 
                                delay: idx * 0.5 
                              }}
                              className="absolute text-sm"
                            >
                              {normOcc.includes('love') || normOcc.includes('sorry') ? '❤️' : '✨'}
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {/* Pulsing trigger wrapper */}
                  <motion.div
                    whileHover={{ scale: isLuxury ? 1.15 : 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleUnlockClick}
                    className={`relative z-10 flex items-center justify-center p-6 rounded-full cursor-pointer transition-all duration-300 ${
                      isLuxury 
                        ? 'bg-white/5 border border-white/15 shadow-2xl backdrop-blur-md drop-shadow-[0_0_25px_rgba(255,255,255,0.1)]' 
                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {renderUnlockTrigger(normOcc, unlockState === 'animating', isLuxury)}
                  </motion.div>
                </div>

                {/* Helper text display */}
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="text-xs font-medium tracking-wide uppercase text-brand-muted select-none pointer-events-none"
                >
                  {helperText}
                </motion.p>
              </motion.div>
            );
          })()}

          {/* STEP: PROMISE */}
          {currentStep === 'promise' && (
            <motion.div 
              key="promise-step"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={getStepTransition(occasionTheme)}
              className="space-y-8 w-full"
            >
              <h2 className={`${occasionTheme.typography.headingFont} font-extrabold text-white text-xl sm:text-2xl leading-normal`}>
                {occasionTheme.hero.promiseQuestion}
              </h2>
              
              {noCount > 0 && (
                <motion.div 
                  key={noCount}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-xs text-brand-pink font-semibold bg-brand-pink/10 border border-brand-pink/20 px-3.5 py-1.5 rounded-full inline-block"
                >
                  {occasionTheme.hero.funnyPhrases[Math.min(noCount - 1, occasionTheme.hero.funnyPhrases.length - 1)]}
                </motion.div>
              )}

              <div className="flex items-center justify-center gap-6 relative min-h-[80px]">
                <CustomButton 
                  variant="primary" 
                  size="md" 
                  onClick={handleYesClick}
                  className="px-6 py-2.5 z-10"
                >
                  Yes ❤️
                </CustomButton>
                
                <motion.div
                  animate={{ 
                    x: (surprise.cuteNoButton ?? true) ? noButtonPosition.x : 0, 
                    y: (surprise.cuteNoButton ?? true) ? noButtonPosition.y : 0 
                  }}
                  transition={{ type: 'spring', stiffness: 350, damping: 18 }}
                  className="z-10"
                >
                  <button
                    onMouseEnter={handleNoButtonRunaway}
                    onClick={handleNoButtonRunaway}
                    className="px-5 py-2.5 rounded-lg border border-brand-border bg-brand-dark text-xs text-brand-muted hover:text-white transition-colors cursor-pointer"
                  >
                    {occasionTheme.hero.noButtonText}
                  </button>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* STEP: HERO */}
          {currentStep === 'hero' && (
            <motion.div 
              key="hero-step"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={getStepTransition(occasionTheme)}
              className="space-y-6"
            >
              <p className="text-[10px] tracking-widest text-brand-purple uppercase font-mono font-bold">Atmosphere Playing</p>
              
              <div className="space-y-2 py-8">
                <motion.h3 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 1 }}
                  className="text-lg text-brand-muted font-normal"
                >
                  {occasionTheme.hero.heroGreeting}
                </motion.h3>
                
                <motion.h2 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.5, duration: 1.5 }}
                  className={`text-3xl sm:text-4xl ${occasionTheme.typography.headingFont} font-extrabold text-transparent bg-clip-text bg-gradient-to-r ${buttonGradient} text-glow-purple`}
                >
                  {getHeroNameTitle()}
                </motion.h2>
              </div>

              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3 }}
              >
                <CustomButton 
                  variant="secondary" 
                  size="sm" 
                  icon={ChevronRight} 
                  iconPosition="right" 
                  onClick={handleNextStep}
                >
                  See Memories
                </CustomButton>
              </motion.div>
            </motion.div>
          )}

          {/* STEP: MEMORIES */}
          {currentStep === 'memories' && (
            <motion.div 
              key="memories-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={getStepTransition(occasionTheme)}
              className="space-y-6 w-full"
            >
              {!surprise.memories || surprise.memories.length === 0 ? (
                <>
                  <div className="flex justify-between items-center text-xs text-brand-muted font-mono mb-2">
                    <span>Memory scrapbook</span>
                    <span>0 of 0</span>
                  </div>

                  {/* Empty state polaroid card */}
                  <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-brand-border bg-brand-dark/20 shadow-2xl flex flex-col items-center justify-center p-6 space-y-4">
                    <div className="absolute inset-0 bg-radial-gradient from-brand-purple/5 to-transparent pointer-events-none" />
                    <div className="w-16 h-16 rounded-full bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center text-brand-purple animate-pulse">
                      <Heart className="w-8 h-8 fill-brand-purple/20" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-white">A space for memories</h3>
                      <p className="text-xs text-brand-muted max-w-[200px] mx-auto leading-relaxed">
                        Once photos are added, your beautiful scrapbook journey will unfold here. ✨
                      </p>
                    </div>
                  </div>

                  {/* Caption Card */}
                  <div className="glass-panel p-4 rounded-xl border border-white/5 min-h-[60px] flex items-center justify-center">
                    <p className="text-xs text-brand-muted italic leading-relaxed text-center">
                      “The best things in life are the memories we share together.”
                    </p>
                  </div>

                  {/* Navigation Controls (Single Read Letter button) */}
                  <div className="flex justify-center pt-2">
                    <CustomButton variant="primary" size="sm" onClick={handleNextStep}>
                      {getNextStepButtonLabel(flowSteps[stepIndex + 1])}
                    </CustomButton>
                  </div>
                </>
              ) : (
                <>
                  {/* Horizontal Timeline Segment Bar (for all occasions showing memory progress) */}
                  <div className="w-full flex gap-1.5 items-center justify-between mb-4">
                    {surprise.memories.map((_, mIdx) => (
                      <div 
                        key={mIdx} 
                        className="flex-1 h-[3px] rounded-full relative overflow-hidden bg-brand-border/40"
                      >
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: mIdx <= currentMemoryIdx ? '100%' : '0%' }}
                          className={`absolute inset-0 bg-gradient-to-r ${occasionTheme.colors.primaryBtn}`}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center text-xs text-brand-muted font-mono mb-2">
                    <span>
                      {occasionTheme.id === 'anniversary' 
                        ? 'Relationship timeline' 
                        : occasionTheme.id === 'sorry' 
                        ? 'Remember these moments? 🥹' 
                        : occasionTheme.id === 'farewell'
                        ? 'Memory journey 🌅'
                        : 'Memory scrapbook'
                      }
                    </span>
                    <span>{currentMemoryIdx + 1} of {surprise.memories.length}</span>
                  </div>

                  {/* Occasion-specific Timeline Badge */}
                  {occasionTheme.timelineLabels && occasionTheme.timelineLabels.length > 0 && (
                    <div className="text-center mb-2">
                      <span className={`text-[10px] tracking-wider font-bold bg-white/5 px-3 py-1 rounded-full border border-white/10 inline-block animate-pulse ${occasionTheme.colors.accent}`}>
                        {occasionTheme.timelineLabels[Math.min(currentMemoryIdx, occasionTheme.timelineLabels.length - 1)]}
                      </span>
                    </div>
                  )}

                  {/* Polaroid Frame */}
                  <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-brand-border bg-brand-dark/20 shadow-2xl">
                    {surprise.memories.map((mem, idx) => (
                      <motion.div
                        key={mem.id}
                        initial={false}
                        animate={{ 
                          opacity: idx === currentMemoryIdx ? 1 : 0,
                          scale: idx === currentMemoryIdx ? 1 : 0.95,
                          pointerEvents: idx === currentMemoryIdx ? 'auto' : 'none'
                        }}
                        transition={{ duration: occasionTheme.motion.polaroidDuration }}
                        className="absolute inset-0 w-full h-full"
                      >
                        {/* Polaroid loading skeleton shimmer */}
                        {!loadedImages[mem.id] && (
                          <div className="absolute inset-0 bg-gradient-to-r from-brand-dark via-brand-dark/80 to-brand-dark animate-pulse flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full border-4 border-brand-purple/20 border-t-brand-purple animate-spin" />
                          </div>
                        )}
                        <Image 
                          src={mem.imageUrl}
                          alt="scrapbook memory"
                          fill
                          sizes="(max-width: 768px) 100vw, 400px"
                          priority={idx === 0}
                          className={`object-cover filter brightness-95 transition-opacity duration-300 ${loadedImages[mem.id] ? 'opacity-100' : 'opacity-0'}`}
                          onLoad={() => setLoadedImages(prev => ({ ...prev, [mem.id]: true }))}
                        />
                      </motion.div>
                    ))}
                  </div>

                  {/* Caption Card */}
                  <div className="glass-panel p-4 rounded-xl border border-white/5 min-h-[60px] flex items-center justify-center">
                    <AnimatePresence mode="wait">
                      <motion.p 
                        key={currentMemoryIdx}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="text-xs text-brand-muted italic leading-relaxed"
                      >
                        “{surprise.memories[currentMemoryIdx]?.caption || 'A beautiful memory...'}”
                      </motion.p>
                    </AnimatePresence>
                  </div>

                  {/* Navigation Controls */}
                  <div className="flex justify-between items-center pt-2">
                    <button
                      onClick={() => setCurrentMemoryIdx(prev => Math.max(0, prev - 1))}
                      disabled={currentMemoryIdx === 0}
                      className="px-3 py-1.5 rounded-lg border border-brand-border bg-brand-dark text-xs text-brand-muted hover:text-white disabled:opacity-30 cursor-pointer"
                    >
                      Prev
                    </button>

                    <div className="flex gap-1.5">
                      {surprise.memories.map((_, dotIdx) => (
                        <span 
                          key={dotIdx}
                          className={`w-1.5 h-1.5 rounded-full transition-all ${
                            dotIdx === currentMemoryIdx ? `w-4 bg-brand-purple` : 'bg-brand-border'
                          }`}
                        />
                      ))}
                    </div>

                    {currentMemoryIdx === surprise.memories.length - 1 ? (
                      <CustomButton variant="primary" size="sm" onClick={handleNextStep}>
                        {getNextStepButtonLabel(flowSteps[stepIndex + 1])}
                      </CustomButton>
                    ) : (
                      <button
                        onClick={() => setCurrentMemoryIdx(prev => Math.min(surprise.memories.length - 1, prev + 1))}
                        className="px-3 py-1.5 rounded-lg border border-brand-border bg-brand-purple text-xs text-white cursor-pointer"
                      >
                        Next
                      </button>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* STEP: CAKE REVEAL (Birthday Only) */}
          {currentStep === 'cake' && (
            <motion.div
              key="cake-step"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <BirthdayCakeReveal 
                recipientName={surprise.recipientName} 
                onComplete={handleCakeComplete} 
              />
            </motion.div>
          )}

          {/* STEP: HEART REVEAL (Anniversary Only) */}
          {currentStep === 'heart-reveal' && (
            <motion.div
              key="heart-reveal-step"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <AnniversaryHeartReveal onComplete={handleNextStep} />
            </motion.div>
          )}

          {/* STEP: EMOTIONAL PAUSE (Sorry Only) */}
          {currentStep === 'emotional-pause' && (
            <motion.div
              key="emotional-pause-step"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <SorryEmotionalPause onComplete={handleNextStep} />
            </motion.div>
          )}

          {/* STEP: FRIENDSHIP ROAST (Friendship Only) */}
          {currentStep === 'roast' && (
            <motion.div
              key="friendship-roast-step"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <FriendshipRoast onComplete={handleNextStep} />
            </motion.div>
          )}

          {/* STEP: FUTURE WISHES (Farewell Only) */}
          {currentStep === 'future-wishes' && (
            <motion.div
              key="future-wishes-step"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <FarewellFutureWishes onComplete={handleNextStep} />
            </motion.div>
          )}

          {/* STEP: FEELINGS REVEAL (Love/Proposal Only) */}
          {currentStep === 'feelings-reveal' && (
            <motion.div
              key="feelings-reveal-step"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <LoveFeelingsReveal onComplete={handleNextStep} />
            </motion.div>
          )}

          {/* STEP: PROPOSAL (Love/Proposal Only) */}
          {currentStep === 'proposal' && (
            <motion.div
              key="proposal-step"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <LoveProposal 
                recipientName={surprise.recipientName} 
                onComplete={handleNextStep} 
              />
            </motion.div>
          )}

          {/* STEP: LETTER */}
          {currentStep === 'letter' && (
            <motion.div 
              key="letter-step"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={getStepTransition(occasionTheme)}
              className="space-y-6 text-left"
            >
              <div className="text-center">
                <span className="text-[10px] tracking-widest text-brand-purple uppercase font-mono font-bold">The Letter</span>
              </div>

              <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-brand-border/60 min-h-[250px] max-h-[300px] overflow-y-auto shadow-2xl relative">
                <div className="absolute top-4 right-4 text-[9px] text-brand-muted font-mono">
                  From: {surprise.relationship}
                </div>
                <div className="text-xs text-brand-muted leading-relaxed whitespace-pre-wrap font-sans">
                  <DynamicTypewriterMessage text={surprise.message} speed={occasionTheme.typewriterSpeed || 30} />
                </div>
              </div>

              <div className="text-center pt-2">
                <CustomButton 
                  variant="glow" 
                  size="md" 
                  icon={Sparkles} 
                  onClick={handleNextStep}
                  className="w-full"
                >
                  Unveil Surprise
                </CustomButton>
              </div>
            </motion.div>
          )}

          {/* STEP: CELEBRATION */}
          {currentStep === 'celebration' && (
            <motion.div 
              key="celebration-step"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={getStepTransition(occasionTheme)}
              className="space-y-6"
            >
              <div className="w-16 h-16 rounded-full bg-brand-dark/60 border border-brand-border flex items-center justify-center mx-auto animate-spin-slow shadow-xl">
                {renderOpeningIcon(occasionTheme.hero.openingIcon)}
              </div>
              
              <div className="space-y-3">
                <p className="text-[10px] tracking-widest text-brand-purple uppercase font-mono font-bold">Atmosphere Connected</p>
                <h1 className={`${occasionTheme.typography.headingFont} font-extrabold text-3xl sm:text-4xl tracking-tight leading-tight text-glow ${accentColor}`}>
                  {occasionTheme.reveal.title}
                </h1>
                <p className="text-xs text-brand-muted max-w-xs mx-auto leading-relaxed">
                  {occasionTheme.reveal.celebrationMessage}
                </p>
              </div>

              <div className="pt-4">
                <CustomButton variant="glow" size="md" icon={ArrowRight} iconPosition="right" onClick={handleNextStep}>
                  One Last Thing...
                </CustomButton>
              </div>
            </motion.div>
          )}

          {/* STEP: OUTRO */}
          {currentStep === 'outro' && (
            <motion.div 
              key="outro-step"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.85 }}
              className="space-y-6"
            >
              {surprise.olsEnabled && planType.toLowerCase() === 'luxury' && olsStage === 'completed' ? (
                <>
                  <div className="w-14 h-14 rounded-full bg-brand-pink/10 border border-brand-pink/20 flex items-center justify-center text-brand-pink mx-auto animate-pulse">
                    <Heart className="w-7 h-7 fill-brand-pink/20" />
                  </div>

                  <div className="space-y-3 px-4">
                    <p className="text-[10px] tracking-widest text-brand-pink uppercase font-mono font-bold">One Last Surprise</p>
                    <h3 className={`${occasionTheme.typography.headingFont} font-extrabold text-2xl sm:text-3xl text-glow leading-relaxed text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-white`}>
                      "{surprise.olsMessage || surprise.message}"
                    </h3>
                  </div>

                  {/* Custom OLS Voice Note Card */}
                  {surprise.olsVoiceNoteUrl && (
                    <div className="p-4 rounded-2xl border border-brand-pink/30 bg-brand-pink/5 flex items-center justify-between max-w-xs mx-auto text-left select-none">
                      <div className="flex items-center gap-3">
                        <button 
                          type="button"
                          onClick={() => {
                            if (olsVoicePlaying) {
                              if (olsVoiceAudioRef.current) {
                                olsVoiceAudioRef.current.pause();
                              }
                              setOlsVoicePlaying(false);
                              if (olsAudioRef.current) {
                                fadeAudio(olsAudioRef.current, 0.45, 600);
                              } else if (audioRef.current && !musicMuted) {
                                fadeAudio(audioRef.current, 0.45, 600);
                              }
                            } else {
                              if (olsAudioRef.current) {
                                fadeAudio(olsAudioRef.current, 0.08, 500);
                              } else if (audioRef.current) {
                                fadeAudio(audioRef.current, 0.08, 500);
                              }
                              
                              if (!olsVoiceAudioRef.current) {
                                olsVoiceAudioRef.current = new Audio(surprise.olsVoiceNoteUrl!);
                                olsVoiceAudioRef.current.addEventListener('ended', () => {
                                  setOlsVoicePlaying(false);
                                  if (olsAudioRef.current) {
                                    fadeAudio(olsAudioRef.current, 0.45, 600);
                                  } else if (audioRef.current && !musicMuted) {
                                    fadeAudio(audioRef.current, 0.45, 600);
                                  }
                                });
                              } else {
                                olsVoiceAudioRef.current.src = surprise.olsVoiceNoteUrl!;
                              }
                              const playPromise = olsVoiceAudioRef.current.play();
                              if (playPromise !== undefined) {
                                playPromise.catch((err) => {
                                  if (err.name !== 'AbortError') {
                                    console.error('Voice play failed:', err);
                                  }
                                });
                              }
                              setOlsVoicePlaying(true);
                            }
                          }}
                          className="w-10 h-10 rounded-full bg-brand-pink/10 border border-brand-pink/20 flex items-center justify-center text-brand-pink shrink-0 cursor-pointer transition-colors hover:bg-brand-pink/20"
                        >
                          {olsVoicePlaying ? <Pause className="w-5 h-5 fill-brand-pink/20" /> : <Play className="w-5 h-5 fill-brand-pink/20 ml-0.5" />}
                        </button>
                        <div>
                          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>One Last Voice Note</span>
                            {olsVoicePlaying && <span className="w-2 h-2 rounded-full bg-brand-pink animate-ping" />}
                          </h4>
                          <p className="text-[9px] text-brand-muted mt-0.5">Click to play audio message</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Custom OLS Media Player (Direct display) */}
                  {surprise.hiddenEndingUrl && (
                    <div className="pt-2">
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-3 max-w-xs mx-auto"
                      >
                        <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-brand-border bg-brand-dark/20 shadow-lg">
                          {surprise.hiddenEndingUrl.match(/\.(mp4|webm|ogg)/i) ? (
                            <video 
                              src={surprise.hiddenEndingUrl} 
                              controls 
                              autoPlay
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Image 
                              src={surprise.hiddenEndingUrl} 
                              alt="final surprise media" 
                              fill
                              sizes="(max-width: 768px) 100vw, 400px"
                              className="object-cover"
                            />
                          )}
                        </div>
                      </motion.div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center text-brand-purple mx-auto animate-pulse">
                    <Smile className="w-6 h-6" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-heading font-bold text-white text-lg">Hope this made you smile ❤️</h3>
                    <p className="text-xs text-brand-muted max-w-xs mx-auto">
                      Send an instant emotional reaction back to the sender to let them know how you felt!
                    </p>
                  </div>



                  {/* Custom Hidden Ending Card */}
                  {surprise.hiddenEndingUrl && (
                    <div className="pt-2">
                      {!showHiddenEnding ? (
                        <button
                          onClick={() => setShowHiddenEnding(true)}
                          className="px-4 py-2 rounded-xl border border-brand-purple/20 bg-brand-purple/10 hover:bg-brand-purple/20 text-xs font-bold text-brand-purple cursor-pointer transition-all"
                        >
                          🤫 Unveil Secret Hidden Ending
                        </button>
                      ) : (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="space-y-3 max-w-xs mx-auto"
                        >
                          <h4 className="text-xs font-bold text-white">🤫 Secret Ending Unveiled</h4>
                          <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-brand-border bg-brand-dark/20 shadow-lg">
                            {surprise.hiddenEndingUrl.match(/\.(mp4|webm|ogg)/i) ? (
                              <video 
                                src={surprise.hiddenEndingUrl} 
                                controls 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Image 
                                src={surprise.hiddenEndingUrl} 
                                alt="secret ending" 
                                fill
                                sizes="(max-width: 768px) 100vw, 400px"
                                className="object-cover"
                              />
                            )}
                          </div>
                          <button
                            onClick={() => setShowHiddenEnding(false)}
                            className="text-[10px] text-brand-muted hover:text-white cursor-pointer transition-colors"
                          >
                            Hide Secret Ending
                          </button>
                        </motion.div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Emoji Reaction Tray */}
              <div className="flex justify-center gap-3 py-4 select-none">
                {['❤️', '😭', '😂', '🥹', '✨'].map((emojiChar) => (
                  <button
                    key={emojiChar}
                    onClick={() => handleEmojiReact(emojiChar)}
                    className="w-12 h-12 rounded-full border border-brand-border bg-brand-dark/40 flex items-center justify-center text-2xl hover:scale-110 active:scale-95 hover:border-brand-purple/20 transition-all cursor-pointer"
                  >
                    {emojiChar}
                  </button>
                ))}
              </div>

              {/* "Send One Back" Loop Card */}
              <div className="p-5 rounded-2xl border border-brand-border/60 bg-brand-dark/30 backdrop-blur-sm max-w-xs mx-auto space-y-4 text-center">
                <p className="text-xs text-white font-medium">
                  Want to make someone smile too? ❤️
                </p>
                <button
                  onClick={() => router.push('/')}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-brand-purple to-brand-pink text-xs font-bold text-white shadow-md hover:brightness-110 active:scale-[0.97] transition-all cursor-pointer"
                >
                  {occasionTheme.reveal.outroButtonText}
                </button>
              </div>

              {/* Bottom Action buttons */}
              <div className="pt-2 flex flex-col gap-3 max-w-xs mx-auto">
                <div className="flex gap-2">
                  <button
                    onClick={handleReplay}
                    className="flex-1 py-3 rounded-lg border border-brand-border bg-brand-dark/40 text-xs font-semibold text-brand-muted hover:text-white hover:bg-brand-dark transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Replay</span>
                  </button>
                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        const url = window.location.href;
                        if (navigator.share) {
                          navigator.share({
                            title: `Heartly Surprise for ${surprise.recipientName}`,
                            text: `Look at this beautiful surprise made for ${surprise.recipientName} on Heartly! ❤️`,
                            url: url
                           }).catch(err => console.log('Share failed:', err));
                         } else {
                           navigator.clipboard.writeText(url);
                           setShareCopied(true);
                           setTimeout(() => setShareCopied(false), 2000);
                         }
                       }
                     }}
                     className="flex-1 py-3 rounded-lg border border-brand-border bg-brand-dark/40 text-xs font-semibold text-brand-muted hover:text-white hover:bg-brand-dark transition-all cursor-pointer flex items-center justify-center gap-1.5"
                   >
                     <Share2 className="w-3.5 h-3.5" />
                     <span>{shareCopied ? 'Copied! 📋' : 'Share Link'}</span>
                   </button>
                 </div>
               </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ONE LAST SURPRISE CINEMATIC OVERLAYS */}
      <AnimatePresence>
        {olsStage !== 'idle' && olsStage !== 'completed' && (
          <motion.div
            key="ols-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4 text-center select-none"
          >
            <AnimatePresence mode="wait">
              {olsStage === 'the_end' && (
                <motion.div
                  key="the-end"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  transition={{ duration: 1.2 }}
                  className="space-y-2"
                >
                  <h1 className="font-serif italic text-white text-4xl sm:text-5xl tracking-wide opacity-90">
                    The End
                  </h1>
                </motion.div>
              )}

              {olsStage === 'fade_black' && (
                <motion.div
                  key="fade-black"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full bg-black"
                />
              )}

              {olsStage === 'actually' && (
                <motion.div
                  key="actually"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 1.0 }}
                >
                  <h2 className="font-heading font-extrabold text-white text-2xl sm:text-3xl tracking-wide opacity-90 animate-pulse">
                    Actually...
                  </h2>
                </motion.div>
              )}

              {olsStage === 'title' && (
                <motion.div
                  key="title"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 2.5, times: [0, 0.2, 0.8, 1] }}
                >
                  <h2 className="font-caveat font-extrabold text-brand-pink text-4xl sm:text-5xl tracking-wide animate-pulse">
                    One Last Surprise ❤️
                  </h2>
                </motion.div>
              )}

              {olsStage === 'animating' && (
                <OneLastSurpriseReveal
                  style={getActiveOlsStyle()}
                  message={surprise.olsMessage || surprise.message}
                  recipientName={surprise.recipientName}
                  memories={surprise.memories}
                  onComplete={handleOlsAnimationComplete}
                  accentColor={accentColor}
                />
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Free Plan Sticky Watermark */}
      {planType.toLowerCase() === 'free' && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 text-[10px] text-brand-muted/70 font-semibold tracking-wider flex items-center gap-1 bg-brand-dark/40 border border-brand-border/40 px-3 py-1 rounded-full pointer-events-none select-none">
          <span>Made with Heartly ❤️</span>
        </div>
      )}
    </div>
  );
}

function DynamicTypewriterMessage({ text, speed }: { text: string; speed: number }) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let index = 0;
    let timeoutId: NodeJS.Timeout;
    setDisplayedText('');

    let baseSpeed = speed;

    const typeCharacter = () => {
      if (index >= text.length) return;

      const char = text.charAt(index);
      setDisplayedText((prev) => prev + char);
      index++;

      let delay = baseSpeed + (Math.random() - 0.5) * (baseSpeed * 0.3); // Add subtle jitter

      // Pause for punctuation
      if (char === '.' || char === '!' || char === '?') {
        delay += 350; // Pause at end of sentence
      } else if (char === ',' || char === ';') {
        delay += 150; // Pause at comma
      } else if (char.match(/[\uD800-\uDFFF]|\u200D/)) {
        delay += 200; // Pause briefly on emoji characters
      }

      timeoutId = setTimeout(typeCharacter, delay);
    };

    typeCharacter();
    return () => clearTimeout(timeoutId);
  }, [text, speed]);

  return (
    <>
      {displayedText}
      <span className="animate-pulse inline-block text-brand-purple ml-0.5 font-bold">|</span>
    </>
  );
}

// ==========================================
// Interactive Animated Occasion Unlock Triggers
// ==========================================

function BirthdayGiftUnlock({ isAnimating, isLuxury }: { isAnimating: boolean, isLuxury: boolean }) {
  return (
    <div className="relative flex items-center justify-center">
      <motion.div
        animate={isAnimating ? {
          rotate: [-6, 6, -6, 6, -10, 10, -3, 3, 0],
          scale: [1, 1.1, 0.95, 1.05, 1],
          y: [0, -10, 5, -5, 0]
        } : {
          y: [0, -6, 0]
        }}
        transition={isAnimating ? {
          duration: 0.8,
          ease: 'easeInOut'
        } : {
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="w-24 h-24 relative flex items-center justify-center cursor-pointer"
      >
        <motion.div
          animate={isAnimating ? {
            y: -80,
            x: 20,
            rotate: 55,
            opacity: 0,
            scale: 0.8
          } : {}}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="absolute top-[8px] w-20 h-5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-sm shadow-md z-20 flex items-center justify-center"
        >
          <div className="absolute -top-3 w-6 h-3 border-4 border-rose-500 rounded-full" />
        </motion.div>

        <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-md shadow-lg z-10 relative overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-full bg-rose-500" />
            <div className="h-4 w-full bg-rose-500 absolute" />
          </div>
        </div>
      </motion.div>

      {isAnimating && (
        <div className="absolute inset-0 pointer-events-none z-30 animate-fade-out">
          {[...Array(12)].map((_, i) => {
            const angle = (i * 360) / 12;
            const radius = 80 + Math.random() * 40;
            const x = Math.cos((angle * Math.PI) / 180) * radius;
            const y = Math.sin((angle * Math.PI) / 180) * radius;
            return (
              <motion.div
                key={i}
                initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                animate={{ scale: [0, 1.5, 0.5, 0], x, y, opacity: [1, 1, 0] }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                className="absolute text-xl"
              >
                ✨
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LoveHeartUnlock({ isAnimating, isLuxury }: { isAnimating: boolean, isLuxury: boolean }) {
  return (
    <div className="relative flex items-center justify-center">
      <motion.div
        animate={isAnimating ? {
          scale: [1, 1.4, 0.8, 2.5, 30],
          opacity: [1, 1, 1, 0.8, 0],
          rotate: [0, -10, 10, -5, 0]
        } : {
          scale: [1, 1.1, 1]
        }}
        transition={isAnimating ? {
          duration: 1.2,
          ease: 'easeInOut'
        } : {
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="w-24 h-24 flex items-center justify-center cursor-pointer"
      >
        <svg
          viewBox="0 0 24 24"
          className="w-20 h-20 fill-rose-500 text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.6)]"
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </motion.div>

      {isAnimating && (
        <div className="absolute pointer-events-none z-30">
          {[...Array(12)].map((_, i) => {
            const angle = (i * 360) / 12 + Math.random() * 20;
            const dist = 70 + Math.random() * 60;
            const x = Math.cos((angle * Math.PI) / 180) * dist;
            const y = Math.sin((angle * Math.PI) / 180) * dist - 30;
            return (
              <motion.div
                key={i}
                initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                animate={{ scale: [0, 1.2, 0.8, 0], x, y, opacity: [1, 0.8, 0] }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                className="absolute text-lg text-rose-400"
              >
                ❤️
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AnniversaryRingUnlock({ isAnimating, isLuxury }: { isAnimating: boolean, isLuxury: boolean }) {
  return (
    <div className="relative flex items-center justify-center">
      <motion.div
        animate={isAnimating ? {
          scale: [1, 1.15, 0.9, 1.2, 1],
          rotate: [0, 10, -10, 180, 360]
        } : {
          y: [0, -4, 0]
        }}
        transition={isAnimating ? {
          duration: 1.2,
          ease: 'easeInOut'
        } : {
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="w-24 h-24 relative flex items-center justify-center cursor-pointer"
      >
        <svg viewBox="0 0 64 64" className="w-20 h-20 text-teal-400 drop-shadow-[0_0_12px_rgba(45,212,191,0.5)]">
          <polygon points="32,6 22,18 42,18" fill="#99f6e4" stroke="#2dd4bf" strokeWidth="2" />
          <polygon points="22,18 32,24 42,18" fill="#ccfbf1" stroke="#2dd4bf" strokeWidth="2" />
          <circle cx="32" cy="38" r="18" fill="none" stroke="#e2e8f0" strokeWidth="4" className="stroke-amber-300" />
        </svg>
        <motion.div
          initial={{ x: '-150%', opacity: 0 }}
          animate={isAnimating ? {
            x: '150%',
            opacity: [0, 1, 1, 0]
          } : {}}
          transition={{ duration: 1, ease: 'easeInOut' }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 z-20 pointer-events-none"
        />
      </motion.div>

      {isAnimating && (
        <motion.div
          initial={{ scale: 0.4, opacity: 1, border: '2px solid rgba(45,212,191,0.8)' }}
          animate={{ scale: 3.5, opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="absolute w-24 h-24 rounded-full pointer-events-none z-10"
        />
      )}
    </div>
  );
}

function ProposalRoseUnlock({ isAnimating, isLuxury }: { isAnimating: boolean, isLuxury: boolean }) {
  return (
    <div className="relative flex items-center justify-center">
      <motion.div
        animate={isAnimating ? {
          rotate: [0, 15, -15, 45, 0],
          scale: [1, 1.2, 0.95, 1.1, 1]
        } : {
          rotate: [0, 5, -5, 0]
        }}
        transition={isAnimating ? {
          duration: 1.2,
          ease: 'easeInOut'
        } : {
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="w-24 h-24 flex items-center justify-center cursor-pointer"
      >
        <svg viewBox="0 0 64 64" className="w-20 h-20 text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.5)]">
          <motion.g
            animate={isAnimating ? {
              scale: [1, 1.25, 1.1, 1.2, 1.15]
            } : {}}
            transition={{ duration: 1, ease: 'easeInOut' }}
            transform="translate(32, 26)"
          >
            <circle cx="0" cy="0" r="10" fill="currentColor" />
            <path d="M-8,-8 C-16,-4 -12,12 0,10 C12,12 16,-4 8,-8 C4,-14 -4,-14 -8,-8 Z" fill="#b91c1c" />
            <path d="M-12,0 C-18,8 -8,18 2,12 C12,18 18,8 12,0 C8,6 -8,6 -12,0 Z" fill="#dc2626" />
          </motion.g>
          <path d="M32,36 Q30,48 26,58" fill="none" stroke="#16a34a" strokeWidth="3" />
          <path d="M30,42 Q20,40 24,34 Q28,36 31,41 Z" fill="#15803d" />
          <path d="M31,48 Q40,50 36,44 Q32,44 31,47 Z" fill="#15803d" />
        </svg>
      </motion.div>

      {isAnimating && (
        <div className="absolute pointer-events-none z-30">
          {[...Array(10)].map((_, i) => {
            const startX = 0;
            const startY = 0;
            const x = (Math.random() - 0.5) * 160;
            const y = 60 + Math.random() * 80;
            return (
              <motion.div
                key={i}
                initial={{ scale: 0, x: startX, y: startY, opacity: 1, rotate: 0 }}
                animate={{ scale: [0, 1.2, 0.7, 0], x, y, opacity: [1, 0.9, 0], rotate: [0, Math.random() * 360] }}
                transition={{ duration: 1.4, ease: 'easeOut' }}
                className="absolute text-lg text-red-600"
              >
                🌹
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FriendshipHandshakeUnlock({ isAnimating, isLuxury }: { isAnimating: boolean, isLuxury: boolean }) {
  return (
    <div className="relative flex items-center justify-center">
      <motion.div
        animate={isAnimating ? {
          y: [-5, 5, -5, 5, -3, 3, 0],
          scale: [1, 1.1, 0.95, 1.05, 1]
        } : {
          x: [-2, 2, -2]
        }}
        transition={isAnimating ? {
          duration: 0.8,
          ease: 'easeInOut'
        } : {
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="w-24 h-24 flex items-center justify-center cursor-pointer"
      >
        <svg viewBox="0 0 64 64" className="w-20 h-20 text-orange-400 drop-shadow-[0_0_12px_rgba(251,146,60,0.5)]" fill="currentColor">
          <path d="M48,22 C43,17 38,20 34,24 C33,25 31,25 30,24 C26,20 21,17 16,22 C10,28 14,35 22,41 C27,45 30,47 32,47 C34,47 37,45 42,41 C50,35 54,28 48,22 Z" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M12,32 C20,32 26,28 32,32 C38,36 44,32 52,32" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <path d="M22,26 L26,38" stroke="currentColor" strokeWidth="2" />
          <path d="M38,26 L34,38" stroke="currentColor" strokeWidth="2" />
        </svg>
      </motion.div>

      {isAnimating && (
        <>
          <motion.div
            initial={{ scale: 0.5, opacity: 1, background: 'radial-gradient(circle, rgba(251,146,60,0.4) 0%, transparent 70%)' }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="absolute w-24 h-24 rounded-full pointer-events-none z-10"
          />
          <div className="absolute pointer-events-none z-30">
            {[...Array(12)].map((_, i) => {
              const angle = (i * 360) / 12;
              const radius = 60 + Math.random() * 40;
              const x = Math.cos((angle * Math.PI) / 180) * radius;
              const y = Math.sin((angle * Math.PI) / 180) * radius - 20;
              return (
                <motion.div
                  key={i}
                  initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                  animate={{ scale: [0, 1.4, 0.6, 0], x, y, opacity: [1, 0.8, 0] }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className="absolute w-2 h-2 rounded-full bg-amber-400"
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function SorryBrokenHeartUnlock({ isAnimating, isLuxury }: { isAnimating: boolean, isLuxury: boolean }) {
  return (
    <div className="relative flex items-center justify-center">
      <motion.div
        animate={isAnimating ? {
          scale: [1, 1.15, 0.9, 1.3, 1],
          y: [0, -10, 0]
        } : {
          y: [0, -3, 0]
        }}
        transition={isAnimating ? {
          duration: 1.2,
          ease: 'easeInOut'
        } : {
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="w-24 h-24 relative flex items-center justify-center cursor-pointer"
      >
        <div className="w-20 h-20 relative flex items-center justify-center">
          <motion.svg
            viewBox="0 0 24 24"
            animate={isAnimating ? {
              x: 1,
              rotate: 0,
              fill: '#ef4444'
            } : {
              x: -3,
              rotate: -4,
              fill: '#9ca3af'
            }}
            transition={{ duration: 0.8 }}
            className="w-20 h-20 absolute left-0 text-transparent"
            style={{ clipPath: 'polygon(0% 0%, 50% 0%, 50% 100%, 0% 100%)' }}
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </motion.svg>

          <motion.svg
            viewBox="0 0 24 24"
            animate={isAnimating ? {
              x: -1,
              rotate: 0,
              fill: '#ef4444'
            } : {
              x: 3,
              rotate: 4,
              fill: '#9ca3af'
            }}
            transition={{ duration: 0.8 }}
            className="w-20 h-20 absolute right-0 text-transparent"
            style={{ clipPath: 'polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%)' }}
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </motion.svg>
        </div>
      </motion.div>

      {isAnimating && (
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: [0, 0.4, 0.4, 0], scale: [0.8, 1.8, 2.5] }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
          className="absolute w-24 h-48 bg-gradient-to-b from-blue-400/40 via-blue-500/10 to-transparent rounded-full blur-xl pointer-events-none -top-12 z-0"
        />
      )}
    </div>
  );
}

function CongratulationsPopperUnlock({ isAnimating, isLuxury }: { isAnimating: boolean, isLuxury: boolean }) {
  return (
    <div className="relative flex items-center justify-center">
      <motion.div
        animate={isAnimating ? {
          rotate: [-15, -35, 15, 0],
          scale: [1, 1.25, 0.8, 1.1, 1],
          x: [0, -10, 5, 0]
        } : {
          rotate: [-15, -5, -15]
        }}
        transition={isAnimating ? {
          duration: 0.8,
          ease: 'easeInOut'
        } : {
          duration: 2.2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="w-24 h-24 flex items-center justify-center cursor-pointer"
      >
        <svg viewBox="0 0 64 64" className="w-20 h-20 text-yellow-400 drop-shadow-[0_0_12px_rgba(234,179,8,0.5)]">
          <path d="M12,48 L32,32 L48,48 Z" fill="currentColor" />
          <path d="M12,48 L48,48" stroke="#d97706" strokeWidth="2" />
          <path d="M22,40 C24,42 26,42 28,40" fill="none" stroke="#ea580c" strokeWidth="2" />
          <path d="M16,45 C20,47 24,47 28,45" fill="none" stroke="#ea580c" strokeWidth="2" />
          <circle cx="30" cy="45" r="2" fill="#ef4444" />
          <circle cx="20" cy="42" r="1.5" fill="#3b82f6" />
        </svg>
      </motion.div>

      {isAnimating && (
        <div className="absolute pointer-events-none z-30">
          {[...Array(20)].map((_, i) => {
            const angle = -45 + (Math.random() - 0.5) * 70;
            const dist = 90 + Math.random() * 90;
            const x = Math.cos((angle * Math.PI) / 180) * dist;
            const y = Math.sin((angle * Math.PI) / 180) * dist;
            const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            const isSquare = Math.random() > 0.5;

            return (
              <motion.div
                key={i}
                initial={{ scale: 0, x: 10, y: -10, opacity: 1, rotate: 0 }}
                animate={{
                  scale: [0, 1.2, 0.6, 0],
                  x,
                  y,
                  opacity: [1, 1, 0.8, 0],
                  rotate: [0, Math.random() * 360]
                }}
                transition={{ duration: 1.4, ease: 'easeOut' }}
                className="absolute"
                style={{
                  width: isSquare ? '8px' : '6px',
                  height: '8px',
                  borderRadius: isSquare ? '1px' : '50%',
                  backgroundColor: randomColor
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function renderUnlockTrigger(normOcc: string, isAnimating: boolean, isLuxury: boolean) {
  if (normOcc.includes('birthday')) {
    return <BirthdayGiftUnlock isAnimating={isAnimating} isLuxury={isLuxury} />;
  } else if (normOcc.includes('love')) {
    return <LoveHeartUnlock isAnimating={isAnimating} isLuxury={isLuxury} />;
  } else if (normOcc.includes('anniversary')) {
    return <AnniversaryRingUnlock isAnimating={isAnimating} isLuxury={isLuxury} />;
  } else if (normOcc.includes('proposal')) {
    return <ProposalRoseUnlock isAnimating={isAnimating} isLuxury={isLuxury} />;
  } else if (normOcc.includes('friendship') || normOcc.includes('farewell')) {
    return <FriendshipHandshakeUnlock isAnimating={isAnimating} isLuxury={isLuxury} />;
  } else if (normOcc.includes('sorry')) {
    return <SorryBrokenHeartUnlock isAnimating={isAnimating} isLuxury={isLuxury} />;
  } else if (normOcc.includes('congratulations')) {
    return <CongratulationsPopperUnlock isAnimating={isAnimating} isLuxury={isLuxury} />;
  }
  return <LoveHeartUnlock isAnimating={isAnimating} isLuxury={isLuxury} />;
}
