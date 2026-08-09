'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useHeartly, Surprise } from '@/context/HeartlyContext';
import { AlertCircle, Lock } from 'lucide-react';
import CustomButton from '@/components/ui/CustomButton';
import { getOccasionTheme } from '@/utils/occasionThemes';
import OccasionCinematicFlow from '@/components/occasion/OccasionCinematicFlow';
import { createClient } from '@/utils/supabase/client';

export default function ReceiverExperience() {
  const params = useParams();
  const router = useRouter();
  const { getSurpriseById, incrementViews } = useHeartly();
  
  const id = params.id as string;
  const [surprise, setSurprise] = useState<Surprise | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Passcode Lock States
  const [isLocked, setIsLocked] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [lockError, setLockError] = useState(false);

  // Fetch surprise
  useEffect(() => {
    if (id) {
      const found = getSurpriseById(id);
      if (found) {
        setSurprise(found);
        incrementViews(found.id);
        if (found.effects.passwordLock) {
          setIsLocked(true);
        }
      } else {
        // Seeding fallback preview
        const fallback: Surprise = {
          id: 'fallback',
          title: 'Happy Anniversary David! ❤️',
          occasion: 'Anniversary',
          recipientName: 'David',
          relationship: 'Partner',
          memories: [
            { id: 'f1', imageUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&auto=format&fit=crop&q=80', caption: 'Our first date. Spilling coffee but smiling.' },
            { id: 'f2', imageUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600&auto=format&fit=crop&q=80', caption: 'Burnt the pasta but it was perfect.' },
          ],
          message: 'Wishing you all the joy, smiles, and laughter in the world today. Thank you for being such an incredible partner and best friend. I love you!',
          music: 'piano',
          theme: 'dreamy',
          effects: {},
          plan: 'free',
          views: 0,
          status: 'active',
          createdAt: new Date().toISOString()
        };
        setSurprise(fallback);
      }
      setLoading(false);
    }
  }, [id]);

  const handleUnlockPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (surprise && passcodeInput === surprise.effects.passwordLock) {
      setIsLocked(false);
      setLockError(false);
    } else {
      setLockError(true);
      setPasscodeInput('');
    }
  };

  const occasionTheme = getOccasionTheme(surprise?.occasion);

  // Retrieve theme tokens dynamically
  const getThemeConfig = () => {
    if (!surprise) return { bgGradient: '', glowColor: '', accentColor: '', buttonGradient: '' };
    const { theme } = surprise;

    let bgGradient = occasionTheme.colors.bgGradient;
    let glowColor = occasionTheme.colors.glow;
    let accentColor = occasionTheme.colors.accent;
    let buttonGradient = occasionTheme.colors.primaryBtn;

    if (theme === 'midnight') {
      bgGradient = 'bg-gradient-to-tr from-[#02020e] via-[#05051c] to-[#0a0f30]';
      glowColor = 'glow-blue opacity-20';
      accentColor = 'text-blue-400';
      buttonGradient = 'from-blue-600 to-[#1253a4]';
    } else if (theme === 'sunset') {
      bgGradient = 'bg-gradient-to-tr from-[#240618] via-[#661625] to-[#c2642a]';
      glowColor = 'glow-pink opacity-20';
      accentColor = 'text-amber-400';
      buttonGradient = 'from-[#e03f56] via-[#f76a3b] to-[#fcaa25]';
    } else if (theme === 'nordic') {
      bgGradient = 'bg-gradient-to-tr from-[#faf8f6] via-[#fff1f2] to-[#edf3fa]';
      glowColor = 'opacity-0';
      accentColor = 'text-brand-pink font-bold';
      buttonGradient = 'from-brand-purple to-brand-pink';
    }

    return { bgGradient, glowColor, accentColor, buttonGradient };
  };

  const { bgGradient, glowColor, accentColor, buttonGradient } = getThemeConfig();

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center text-brand-muted text-xs">
        Loading surprise story...
      </div>
    );
  }

  if (isLocked && surprise) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center p-4 text-left select-none">
        <div className="w-full max-w-sm glass-panel p-6 sm:p-8 rounded-3xl border border-brand-border/60 text-center space-y-6">
          <div className="w-12 h-12 rounded-full bg-brand-pink/10 border border-brand-pink/20 flex items-center justify-center text-brand-pink mx-auto animate-pulse">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-heading font-bold text-white text-lg">Passcode Protected</h3>
            <p className="text-xs text-brand-muted">Please enter the security lock passcode to view this surprise.</p>
          </div>
          <form onSubmit={handleUnlockPasscode} className="space-y-4">
            <input 
              type="password" 
              maxLength={6}
              value={passcodeInput}
              onChange={(e) => setPasscodeInput(e.target.value)}
              placeholder="••••"
              className="w-full text-center text-lg p-3 glass-input tracking-widest font-mono"
            />
            {lockError && (
              <p className="text-[10px] text-brand-pink font-semibold flex items-center justify-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Incorrect password lock. Try again.</span>
              </p>
            )}
            <CustomButton variant="glow" size="md" className="w-full">
              Unlock page
            </CustomButton>
          </form>
        </div>
      </div>
    );
  }

  // Resolve selected music track to public audio URL client-side
  const [resolvedMusicUrl, setResolvedMusicUrl] = useState('');

  useEffect(() => {
    const resolveMusic = async () => {
      if (!surprise || !surprise.music) return;
      
      let trackMusic = surprise.music;
      
      if (trackMusic.startsWith('http')) {
        setResolvedMusicUrl(trackMusic);
        return;
      }
      
      const supabase = createClient();
      try {
        const { data } = await supabase
          .from('music_library')
          .select('audio_url')
          .eq('id', trackMusic)
          .maybeSingle();
        
        if (data && data.audio_url) {
          setResolvedMusicUrl(data.audio_url);
          return;
        }
      } catch (err) {
        console.warn('Could not resolve music client-side:', err);
      }
      
      // Fallback legacy URLs
      const legacyMap: Record<string, string> = {
        'piano': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        'ambient': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        'acoustic': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
        'piano-1': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        'piano-2': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        'happy-1': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
        'happy-2': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
        'guitar-1': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
        'soft-1': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
        'party-1': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3'
      };
      
      setResolvedMusicUrl(legacyMap[trackMusic] || trackMusic || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
    };
    
    resolveMusic();
  }, [surprise]);

  // Map Context Surprise to SurpriseData interface expected by OccasionCinematicFlow
  const surprisePayload = surprise ? {
    id: surprise.id,
    recipientName: surprise.recipientName,
    occasion: surprise.occasion,
    relationship: surprise.relationship,
    memories: surprise.memories,
    message: surprise.message,
    music: resolvedMusicUrl || surprise.music,
    theme: surprise.theme,
    cuteNoButton: surprise.cuteNoButton,
    hiddenEndingUrl: surprise.hiddenEndingUrl,
    plan: surprise.plan
  } : null;

  return surprisePayload ? (
    <OccasionCinematicFlow
      surprise={surprisePayload}
      occasionTheme={occasionTheme}
      bgGradient={bgGradient}
      glowColor={glowColor}
      accentColor={accentColor}
      buttonGradient={buttonGradient}
      onReactionSend={(emoji) => {
        console.log('Emoji reaction mock preview send:', emoji);
      }}
      onGoHome={() => router.push('/')}
      isPreview={true}
    />
  ) : null;
}
