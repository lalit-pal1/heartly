'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Lock, Calendar, Heart } from 'lucide-react';
import CustomButton from '@/components/ui/CustomButton';
import { createClient } from '@/utils/supabase/client';
import { getOccasionTheme } from '@/utils/occasionThemes';
import OccasionCinematicFlow from '@/components/occasion/OccasionCinematicFlow';

interface Memory {
  id: string;
  imageUrl: string;
  caption: string;
}

interface SurpriseData {
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
  passwordLock?: string | null;
  countdownEnabled?: boolean;
  countdownDuration?: number | null;
  status?: string;
  olsEnabled?: boolean;
  olsMessage?: string | null;
  olsStyle?: string;
  olsMusicUrl?: string | null;
  olsVoiceNoteUrl?: string | null;
}

interface SlugClientProps {
  slug: string;
  initialSurprise: SurpriseData | null;
}

// Device classification helper
const getDeviceType = (): string => {
  if (typeof window === 'undefined') return 'Desktop';
  const width = window.innerWidth;
  if (width < 768) return 'Mobile';
  if (width >= 768 && width < 1024) return 'Tablet';
  return 'Desktop';
};

// Open tracking with session-level deduplication
const trackOpenAnalytics = async (surpriseId: string) => {
  if (typeof window === 'undefined') return;
  const supabase = createClient();

  try {
    const sessionKey = `heartly_session_${surpriseId}`;
    let sessionId = sessionStorage.getItem(sessionKey);
    if (!sessionId) {
      sessionId = 'sess-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem(sessionKey, sessionId);

      const device = getDeviceType();
      const { error } = await supabase.from('surprise_analytics').insert({
        surprise_id: surpriseId,
        session_id: sessionId,
        device_type: device,
        opened_at: new Date().toISOString()
      });

      if (error) {
        if (error.code === 'PGRST205' || error.message.includes('surprise_analytics')) {
          console.warn('surprise_analytics table missing, falling back to surprise_views insertion...');
          const { error: fallbackErr } = await supabase.from('surprise_views').insert({
            surprise_id: surpriseId,
            viewed_at: new Date().toISOString(),
            device_type: device
          });
          if (fallbackErr) {
            console.warn('Failed to insert fallback view event:', fallbackErr.message);
          } else {
            console.log('Logged fallback view event. Device:', device);
          }
        } else {
          console.warn('Failed to insert open event:', error.message);
        }
      } else {
        console.log('Logged open event. Session:', sessionId, 'Device:', device);
      }
    }
  } catch (err) {
    console.error('Error logging open event:', err);
  }
};

// Completion tracking with session-level deduplication
const trackCompleteAnalytics = async (surpriseId: string) => {
  if (typeof window === 'undefined') return;
  const supabase = createClient();

  try {
    const sessionKey = `heartly_session_${surpriseId}`;
    const completeKey = `heartly_completed_${surpriseId}`;
    const sessionId = sessionStorage.getItem(sessionKey);
    const isCompleted = sessionStorage.getItem(completeKey);

    if (sessionId && !isCompleted) {
      const { error } = await supabase
        .from('surprise_analytics')
        .update({ completed_at: new Date().toISOString() })
        .eq('surprise_id', surpriseId)
        .eq('session_id', sessionId);

      if (error) {
        console.warn('Failed to update completion event:', error.message);
      } else {
        sessionStorage.setItem(completeKey, 'true');
        console.log('Logged completion event. Session:', sessionId);
      }
    }
  } catch (err) {
    console.error('Error logging completion event:', err);
  }
};

export default function SlugClient({ slug, initialSurprise }: SlugClientProps) {
  const router = useRouter();

  // Surprise Data State
  const [surprise, setSurprise] = useState<SurpriseData | null>(initialSurprise);
  const [loading, setLoading] = useState(!initialSurprise);
  const [notFound, setNotFound] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  
  // Security locks (Passcode / Countdown)
  const [isPasscodeLocked, setIsPasscodeLocked] = useState(!!initialSurprise?.passwordLock);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState(false);

  const [isCountdownLocked, setIsCountdownLocked] = useState(!!initialSurprise?.countdownEnabled);
  const [countdownSecondsLeft, setCountdownSecondsLeft] = useState<number>(initialSurprise?.countdownDuration || 60);

  // 1. Fetch surprise data from Supabase if not loaded server-side, fallback to localStorage
  useEffect(() => {
    const fetchSurprise = async () => {
      if (initialSurprise) {
        setupCountdownLock(!!initialSurprise.countdownEnabled, initialSurprise.countdownDuration);
        // Track open of preloaded server surprise
        await trackOpenAnalytics(initialSurprise.id);
        return;
      }

      setLoading(true);
      
      // Check rate limiting first
      try {
        const rateLimitRes = await fetch(`/api/surprise/rate-limit?slug=${slug}`);
        if (rateLimitRes.ok) {
          const limitData = await rateLimitRes.json();
          if (limitData && limitData.allowed === false) {
            setRateLimited(true);
            setLoading(false);
            return;
          }
        }
      } catch (rateErr) {
        console.warn('Rate limit lookup skipped:', rateErr);
      }

      const supabase = createClient();

      try {
        // Securely fetch only public surprise fields
        const { data: dbSurprise, error: dbError } = await supabase
          .from('surprises')
          .select(`
            id,
            recipient_name,
            relationship_type,
            occasion,
            custom_message,
            selected_theme,
            selected_music,
            status,
            password_lock,
            countdown_enabled,
            countdown_duration,
            midnight_unlock,
            cute_no_button,
            plan_type,
            hidden_ending_url,
            one_last_surprise_enabled,
            one_last_surprise_message,
            one_last_surprise_style,
            one_last_surprise_music_url,
            one_last_surprise_voice_note_url
          `)
          .eq('surprise_slug', slug)
          .single();

        if (dbError || !dbSurprise) {
          throw new Error('Supabase record not found');
        }

        // Fetch corresponding memory photos
        const { data: dbPhotos } = await supabase
          .from('photos')
          .select('id, image_url, caption, sort_order')
          .eq('surprise_id', dbSurprise.id)
          .order('sort_order', { ascending: true });

        const mappedPhotos: Memory[] = (dbPhotos || []).map(p => ({
          id: p.id,
          imageUrl: p.image_url,
          caption: p.caption || ''
        }));

        const surprisePayload: SurpriseData = {
          id: dbSurprise.id,
          recipientName: dbSurprise.recipient_name,
          occasion: dbSurprise.occasion || 'Celebration',
          relationship: dbSurprise.relationship_type || 'Special Someone',
          message: dbSurprise.custom_message || '',
          music: dbSurprise.selected_music || 'guitar-1',
          theme: dbSurprise.selected_theme || 'dreamy',
          cuteNoButton: dbSurprise.cute_no_button,
          planType: dbSurprise.plan_type || 'Free',
          hiddenEndingUrl: dbSurprise.hidden_ending_url,
          passwordLock: dbSurprise.password_lock,
          countdownEnabled: dbSurprise.countdown_enabled,
          countdownDuration: dbSurprise.countdown_duration || 60,
          status: dbSurprise.status,
          memories: mappedPhotos,
          olsEnabled: dbSurprise.one_last_surprise_enabled,
          olsMessage: dbSurprise.one_last_surprise_message,
          olsStyle: dbSurprise.one_last_surprise_style || 'auto',
          olsMusicUrl: dbSurprise.one_last_surprise_music_url,
          olsVoiceNoteUrl: dbSurprise.one_last_surprise_voice_note_url
        };

        // Increment public opens securely with deduplication
        await trackOpenAnalytics(dbSurprise.id);

        setSurprise(surprisePayload);
        
        // Setup security checks
        if (dbSurprise.password_lock) {
          setIsPasscodeLocked(true);
        }
        setupCountdownLock(dbSurprise.countdown_enabled, dbSurprise.countdown_duration);
        setNotFound(false);
      } catch (err) {
        console.warn('Supabase fetch failed, trying localStorage fallback:', err);
        // Fallback for local pairings / offline testing
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('heartly_surprises');
          if (stored) {
            const list = JSON.parse(stored);
            const matched = list.find((s: any) => s.id === slug || s.id === `demo-${slug}` || s.recipientName?.toLowerCase() === slug.toLowerCase());
            if (matched) {
              const localSurprise: SurpriseData = {
                id: matched.id,
                recipientName: matched.recipientName,
                occasion: matched.occasion,
                relationship: matched.relationship,
                memories: matched.memories,
                message: matched.message,
                music: matched.music,
                theme: matched.theme,
                cuteNoButton: matched.cuteNoButton ?? true,
                planType: matched.planType || 'Free',
                hiddenEndingUrl: matched.hiddenEndingUrl,
                passwordLock: matched.effects?.passwordLock,
                countdownEnabled: matched.effects?.countdownEnabled ?? !!matched.effects?.countdownDate,
                countdownDuration: matched.effects?.countdownDuration ?? 60,
                olsEnabled: matched.olsEnabled ?? matched.one_last_surprise_enabled ?? false,
                olsMessage: matched.olsMessage ?? matched.one_last_surprise_message,
                olsStyle: matched.olsStyle ?? matched.one_last_surprise_style ?? 'auto',
                olsMusicUrl: matched.olsMusicUrl ?? matched.one_last_surprise_music_url,
                olsVoiceNoteUrl: matched.olsVoiceNoteUrl ?? matched.one_last_surprise_voice_note_url
              };
              setSurprise(localSurprise);
              if (matched.effects?.passwordLock) {
                setIsPasscodeLocked(true);
              }
               setupCountdownLock(!!localSurprise.countdownEnabled, localSurprise.countdownDuration);
              setNotFound(false);
              setLoading(false);
              return;
            }
          }
        }
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchSurprise();
  }, [slug, initialSurprise]);

  // Setup/calculate countdown timings
  const setupCountdownLock = (enabled: boolean, durationSeconds?: number | null) => {
    if (!enabled) return;
    setIsCountdownLocked(true);
    setCountdownSecondsLeft(durationSeconds || 60);
  };

  // Countdown Lock Timer Loop
  useEffect(() => {
    if (!isCountdownLocked || !surprise) return;

    const interval = setInterval(() => {
      setCountdownSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsCountdownLocked(false);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isCountdownLocked, surprise]);

  const handleUnlockPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    const lockPass = surprise?.passwordLock;
    if (surprise && passcodeInput === lockPass) {
      setIsPasscodeLocked(false);
      setPasscodeError(false);
    } else {
      setPasscodeError(true);
      setPasscodeInput('');
    }
  };

  // Retrieve theme tokens dynamically based on occasion
  const occasionTheme = getOccasionTheme(surprise?.occasion);

  // Render Theme styling mappers
  const getThemeConfig = () => {
    if (!surprise) return { bgGradient: '', glowColor: '', accentColor: '', buttonGradient: '' };
    const { theme } = surprise;

    // Default to the occasion-specific color schemes
    let bgGradient = occasionTheme.colors.bgGradient;
    let glowColor = occasionTheme.colors.glow;
    let accentColor = occasionTheme.colors.accent;
    let buttonGradient = occasionTheme.colors.primaryBtn;

    // Apply layout style overrides if user explicitly chose a premium theme
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

  // RATE LIMITED STATE
  if (rateLimited) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center p-4 text-left select-none">
        <div className="w-full max-w-sm glass-panel p-8 rounded-3xl border border-brand-border/60 text-center space-y-6">
          <div className="w-14 h-14 rounded-full bg-brand-pink/10 border border-brand-pink/20 flex items-center justify-center text-brand-pink mx-auto animate-pulse">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="font-heading font-extrabold text-white text-lg">Too many requests 💔</h1>
            <p className="text-xs text-brand-muted px-2 leading-relaxed">
              You are accessing this surprise too frequently. Please wait a minute and try again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // LOADING STATE
  if (loading) {
    return (
      <div className="min-h-screen bg-brand-black flex flex-col items-center justify-center text-center space-y-4 select-none">
        <div className="w-10 h-10 rounded-full border-[3px] border-brand-purple/20 border-t-brand-purple animate-spin" />
        <p className="text-xs text-brand-muted font-semibold animate-pulse">Unlocking your cinematic experience... ❤️</p>
      </div>
    );
  }

  // NOT FOUND STATE
  if (notFound) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center p-4 text-left select-none">
        <div className="w-full max-w-sm glass-panel p-8 rounded-3xl border border-brand-border/60 text-center space-y-6">
          <div className="w-14 h-14 rounded-full bg-brand-pink/10 border border-brand-pink/20 flex items-center justify-center text-brand-pink mx-auto">
            <Heart className="w-8 h-8 fill-brand-pink/5 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h1 className="font-heading font-extrabold text-white text-lg">Surprise Not Found 💔</h1>
            <p className="text-xs text-brand-muted px-2 leading-relaxed">
              We couldn't find the emotional story for this link. It may have been deleted, or the slug URL is invalid.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => router.push('/')}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-purple to-brand-pink text-xs font-bold text-white cursor-pointer active:scale-95 transition-transform"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // EXPIRED STATE
  if (surprise && surprise.status === 'expired') {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center p-4 text-left select-none">
        <div className="w-full max-w-sm glass-panel p-8 rounded-3xl border border-brand-border/60 text-center space-y-6">
          <div className="w-14 h-14 rounded-full bg-brand-pink/10 border border-brand-pink/20 flex items-center justify-center text-brand-pink mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="font-heading font-extrabold text-white text-lg">This surprise has expired 💔</h1>
            <p className="text-xs text-brand-muted px-2 leading-relaxed">
              This digital surprise card page has exceeded its activation timeframe. Let the sender know!
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => router.push('/')}
              className="w-full py-3 rounded-xl border border-brand-border bg-brand-dark/40 text-xs font-bold text-brand-muted hover:text-white cursor-pointer active:scale-95 transition-transform"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // COUNTDOWN LOCK SCREEN
  if (isCountdownLocked && surprise) {
    const mins = Math.floor(countdownSecondsLeft / 60);
    const secs = countdownSecondsLeft % 60;
    
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center p-4 text-left select-none w-full">
        <div className="w-full max-w-md glass-panel p-6 sm:p-8 rounded-3xl border border-brand-border/60 text-center space-y-6">
          <div className="w-12 h-12 rounded-full bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center text-brand-purple mx-auto animate-pulse">
            <Calendar className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h3 className="font-heading font-extrabold text-white text-base">Unlocks in... ⏰</h3>
            <p className="text-xs text-brand-muted px-4 leading-relaxed animate-pulse">
              Hold tight! Your special surprise is unlocking shortly.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto pt-2">
            {[
              { label: 'Minutes', val: mins },
              { label: 'Seconds', val: secs }
            ].map((t) => (
              <div key={t.label} className="p-4 rounded-xl border border-brand-border bg-brand-dark/40 shadow-inner">
                <span className="block font-mono font-extrabold text-white text-3xl text-glow-purple">
                  {t.val.toString().padStart(2, '0')}
                </span>
                <span className="block text-[9px] text-brand-muted uppercase font-bold tracking-wider mt-1">
                  {t.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // PASSCODE LOCKED SCREEN
  if (isPasscodeLocked && surprise) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center p-4 text-left select-none w-full">
        <div className="w-full max-w-sm glass-panel p-6 sm:p-8 rounded-3xl border border-brand-border/60 text-center space-y-6">
          <div className="w-12 h-12 rounded-full bg-brand-pink/10 border border-brand-pink/20 flex items-center justify-center text-brand-pink mx-auto animate-pulse">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-heading font-extrabold text-white text-base">Passcode Protected</h3>
            <p className="text-xs text-brand-muted px-2">Please enter the security lock passcode to view your surprise.</p>
          </div>
          <form onSubmit={handleUnlockPasscode} className="space-y-4">
            <input 
              type="password" 
              value={passcodeInput}
              onChange={(e) => setPasscodeInput(e.target.value)}
              placeholder="••••"
              className="w-full text-center text-lg p-3 glass-input tracking-widest font-mono"
            />
            {passcodeError && (
              <p className="text-[10px] text-brand-pink font-semibold flex items-center justify-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Incorrect passcode key. Try again.</span>
              </p>
            )}
            <CustomButton variant="glow" size="md" className="w-full">
              Unlock surprise
            </CustomButton>
          </form>
        </div>
      </div>
    );
  }

  // CORE CINEMATIC STAGE
  if (!surprise) return null;

  return (
    <OccasionCinematicFlow
      surprise={surprise}
      occasionTheme={occasionTheme}
      bgGradient={bgGradient}
      glowColor={glowColor}
      accentColor={accentColor}
      buttonGradient={buttonGradient}
      onReactionSend={(emoji) => {
        const supabase = createClient();
        supabase.from('surprise_reactions').insert({
          surprise_id: surprise.id,
          reaction_emoji: emoji
        }).then(({ error }) => {
          if (error) console.warn('Failed to insert reaction:', error.message);
        });
      }}
      onGoHome={() => router.push('/')}
      onComplete={() => trackCompleteAnalytics(surprise.id)}
    />
  );
}
