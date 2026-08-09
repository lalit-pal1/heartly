'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useHeartly, Memory } from '@/context/HeartlyContext';
import { 
  Sparkles, Gift, Heart, Smile, Clock, Volume2, 
  ChevronLeft, ChevronRight, Upload, Play, Pause, 
  Lock, Calendar, Eye, EyeOff, CreditCard, Check, ArrowRight, X,
  Wand2, Trash2, HelpCircle, AlertCircle, RefreshCw, Sparkle, Loader2, Search, Music
} from 'lucide-react';
import CustomButton from '@/components/ui/CustomButton';
import { useAuth } from '@/context/AuthContext';
import { getOccasionTheme } from '@/utils/occasionThemes';
import { createClient } from '@/utils/supabase/client';
import { compressImage } from '@/utils/imageCompressor';
import Image from 'next/image';
import { OptimizedInput, OptimizedTextarea } from '@/components/ui/OptimizedInput';

const PLAN_LIMITS: Record<string, number> = {
  free: 2,
  basic: 5,
  premium: 10,
  luxury: 20
};

const generateUUID = () => {
  if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const generateSecureSlug = () => {
  if (typeof window !== 'undefined' && window.crypto) {
    const arr = new Uint8Array(8);
    window.crypto.getRandomValues(arr);
    return Array.from(arr, dec => dec.toString(16).padStart(2, '0')).join('');
  }
  return Math.random().toString(36).substring(2, 10);
};

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

// Emotional Vibe Music Library containing 36 covers / royalty-free alternatives
// Dynamic Music Library is now fetched from Supabase database.

const MOCK_UNSPLASH_POOL = [
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1496302661278-520520ef2246?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1464746133101-a2c3f88e0dd9?w=600&auto=format&fit=crop&q=80'
];

// Helper to upload files to Supabase Storage with up to 3 retries and exponential backoff
const uploadWithRetry = async (
  supabase: any,
  bucket: string,
  filePath: string,
  fileBlob: Blob | File,
  retries = 3,
  delay = 1000
): Promise<any> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, fileBlob, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;
      return data;
    } catch (err: any) {
      if (attempt === retries) throw err;
      console.warn(`Upload attempt ${attempt} failed. Retrying in ${delay}ms... Error: ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2; // exponential backoff
    }
  }
};

function CreateSurpriseBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const editId = searchParams.get('id');

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Input refs for uploads
  const fileInputRef = useRef<HTMLInputElement>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);
  const hiddenEndingInputRef = useRef<HTMLInputElement>(null);
  const olsMusicInputRef = useRef<HTMLInputElement>(null);
  const olsVoiceInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back

  // Form Fields
  const [occasion, setOccasion] = useState('Birthday');
  const [recipientName, setRecipientName] = useState('');
  const [relationship, setRelationship] = useState('Crush');
  const [specialDetails, setSpecialDetails] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [memories, setMemories] = useState<Memory[]>([
    {
      id: 'mem-1',
      imageUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=600&auto=format&fit=crop&q=80',
      caption: 'The night we stayed up laughing until sunrise...'
    }
  ]);
  const [musicCategory, setMusicCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [languageFilter, setLanguageFilter] = useState<string>('All');
  const [musicTrack, setMusicTrack] = useState('bday-h-3');
  const [musicTracks, setMusicTracks] = useState<any[]>([]);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [vibeTheme, setVibeTheme] = useState<'dreamy' | 'midnight' | 'sunset' | 'nordic'>('dreamy');
  
  // Atmosphere Magic Effects
  const [passwordLock, setPasswordLock] = useState('');
  const [isPasswordEnabled, setIsPasswordEnabled] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [countdownEnabled, setCountdownEnabled] = useState(false);
  const [countdownDuration, setCountdownDuration] = useState(60);
  const [midnightUnlock, setMidnightUnlock] = useState(false);
  const [noRunawayInteraction, setNoRunawayInteraction] = useState(true);

  const handleOccasionChange = (newOccasion: string) => {
    setOccasion(newOccasion);
    
    // Auto-align preset music based on getOccasionTheme
    const theme = getOccasionTheme(newOccasion);
    if (theme && theme.defaultMusic) {
      setMusicCategory(theme.defaultMusic.category);
      setMusicTrack(theme.defaultMusic.trackId);
    }
  };

  // Billing, Modal & Async States
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'basic' | 'premium' | 'luxury'>('premium');
  const [hasUsedFreePlan, setHasUsedFreePlan] = useState(false);
  const [basicCredits, setBasicCredits] = useState(0);
  const [useCreditChecked, setUseCreditChecked] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeTargetFeature, setUpgradeTargetFeature] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [hiddenEndingUrl, setHiddenEndingUrl] = useState('');
  const [olsEnabled, setOlsEnabled] = useState(false);
  const [olsMessage, setOlsMessage] = useState('');
  const [olsStyle, setOlsStyle] = useState('auto');
  const [olsMusicUrl, setOlsMusicUrl] = useState('');
  const [olsVoiceNoteUrl, setOlsVoiceNoteUrl] = useState('');

  const triggerUpgradeModal = (feature: string) => {
    setUpgradeTargetFeature(feature);
    setUpgradeModalOpen(true);
  };

  useEffect(() => {
    // Reset features based on new plan restrictions to prevent DB validation errors
    if (selectedPlan === 'free') {
      setPasswordLock('');
      setIsPasswordEnabled(false);
      setCountdownEnabled(false);
      setCountdownDuration(60);
      setMidnightUnlock(false);
      setNoRunawayInteraction(false);
      if (vibeTheme !== 'dreamy') {
        setVibeTheme('dreamy');
      }
      if (musicTrack.startsWith('http')) {
        setMusicTrack('bday-h-3');
      }
      setHiddenEndingUrl('');
      setCustomUrl('');
      setOlsEnabled(false);
      setOlsMessage('');
      setOlsStyle('auto');
      setOlsMusicUrl('');
      setOlsVoiceNoteUrl('');
      // Truncate memories to 2
      if (memories.length > 2) {
        setMemories(memories.slice(0, 2));
      }
    } else if (selectedPlan === 'basic') {
      setPasswordLock('');
      setIsPasswordEnabled(false);
      setCountdownEnabled(false);
      setCountdownDuration(60);
      setMidnightUnlock(false);
      setNoRunawayInteraction(false);
      setHiddenEndingUrl('');
      setCustomUrl('');
      setOlsEnabled(false);
      setOlsMessage('');
      setOlsStyle('auto');
      setOlsMusicUrl('');
      setOlsVoiceNoteUrl('');
      // Truncate memories to 5
      if (memories.length > 5) {
        setMemories(memories.slice(0, 5));
      }
    } else if (selectedPlan === 'premium') {
      setMidnightUnlock(false);
      setHiddenEndingUrl('');
      setCustomUrl('');
      setOlsEnabled(false);
      setOlsMessage('');
      setOlsStyle('auto');
      setOlsMusicUrl('');
      setOlsVoiceNoteUrl('');
      // Truncate memories to 10
      if (memories.length > 10) {
        setMemories(memories.slice(0, 10));
      }
    }
  }, [selectedPlan, memories.length]);

  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [microcopyText, setMicrocopyText] = useState("Let's add some sweet memories! 📸");
  
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [draftData, setDraftData] = useState<any>(null);
  const [isDraftLoading, setIsDraftLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [surpriseId, setSurpriseId] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedLink, setPublishedLink] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [gentleGuidanceShown, setGentleGuidanceShown] = useState(false);

  // Sandbox Mode fallback checkout states
  const [showSandboxPaymentModal, setShowSandboxPaymentModal] = useState(false);
  const [sandboxPaymentData, setSandboxPaymentData] = useState<any>(null);

  // Phone simulator playback indexes
  const [previewScreenIdx, setPreviewScreenIdx] = useState(1);
  const [previewNoCount, setPreviewNoCount] = useState(0);
  const [previewNoPosition, setPreviewNoPosition] = useState({ x: 0, y: 0 });

  const stepsList = [
    'Occasion',
    'Plan Selection',
    'Recipient Details',
    'Memories',
    'Letter',
    'Melody',
    'Theme Vibe',
    'Atmosphere',
    'Confirmation'
  ];

  const getStepEmotionalSubtitle = (step: number) => {
    switch (step) {
      case 1: return "Let’s start the magic ✨";
      case 2: return "Choose the surprise scale 💎";
      case 3: return "Tell us about them ❤️";
      case 4: return "Add beautiful memories 📸";
      case 5: return "Make it personal ❤️";
      case 6: return "Choose the soundtrack 🎵";
      case 7: return "Select the visual vibe 🎨";
      case 8: return "Add a little magic ✨";
      case 9: return "Almost ready 😭";
      default: return "Surprise Builder";
    }
  };

  const getStorytellingLabel = (index: number) => {
    switch (index) {
      case 0: return "First Memory (Where it started 📍)";
      case 1: return "Funny Moment (A goofy laugh 😂)";
      case 2: return "Favorite Memory (Good times 🌟)";
      case 3: return "Emotional Memory (Deep connection ❤️)";
      case 4: return "Final Special Moment (Looking forward ✨)";
      default: return `Memory #${index + 1} 📸`;
    }
  };

  const getMessageStarters = () => {
    switch (occasion) {
      case 'Birthday':
        return [
          "Happy birthday to someone who makes life brighter…",
          "On your special day, I wanted to remind you of how much you mean to me…",
          "Wishing the happiest birthday to the one with the best memories…"
        ];
      case 'Anniversary':
        return [
          "Every moment with you has been a beautiful adventure…",
          "To the person who makes my heart full every single day…",
          "Happy anniversary to my favorite partner in crime…"
        ];
      case 'Sorry':
        return [
          "I know I hurt you, and I sincerely want to make things right…",
          "Looking back at our happy memories, it breaks my heart that we're silent…",
          "Sometimes words aren't enough, but I want to start by saying I'm sorry…"
        ];
      case 'Friendship':
        return [
          "Bro, looking at these memories, we are actually so chaotic 😂…",
          "To my absolute best friend who knows way too many of my secrets…",
          "Just a little reminder of why you can never get rid of me…"
        ];
      case 'Farewell':
        return [
          "It's hard to find the right words to say goodbye, but thank you for everything…",
          "As you start this new journey, remember you'll always have a place here…",
          "This isn't a final goodbye, just the end of a beautiful chapter…"
        ];
      case 'Love':
        return [
          "From the moment I met you, my life became infinitely more beautiful…",
          "You are my today, my tomorrow, and my entire forever…",
          "I wanted to create something as special and magical as you are…"
        ];
      default:
        return [
          "Just a little surprise to bring a smile to your face today…",
          "Thought we could take a little trip down memory lane together…"
        ];
    }
  };

  const getOccasionAssistantTip = () => {
    // 1. Check if memories is too short on memories step
    if (currentStep === 4 && memories.length === 1) {
      return "Adding more memories makes it feel extra special ❤️. Try uploading at least 3-5 photos to create a beautiful scrolling storytelling journey!";
    }

    // 2. Custom step-based adaptation
    switch (currentStep) {
      case 1:
        if (occasion === 'Birthday') return "Let’s make their birthday unforgettable 🎂❤️ Upbeat vibes work best here!";
        if (occasion === 'Anniversary') return "Let’s create something beautiful together ❤️ Focus on your shared journey.";
        if (occasion === 'Sorry') return "Sometimes effort matters more than words 🥹 Let's make this sincere.";
        if (occasion === 'Friendship') return "Time to expose embarrassing memories 😂 Keep it fun and goofy!";
        if (occasion === 'Farewell') return "Let’s create a meaningful goodbye sunset memory journey 🌅";
        if (occasion === 'Love') return "Some feelings deserve more than words ✨ Let's plan a romantic surprise.";
        return "Let's create a beautiful custom surprise ✨";

      case 3: {
        let msg = "Tell us about them to customize the visual pacing.";
        if (relationship === 'Crush') {
          msg = "Ooh, a crush surprise! Keep it cute, sweet, and a little mysterious. We'll help you pacing it beautifully.";
        } else if (relationship === 'Best Friend') {
          msg = "Best friends deserve the best banter. Feel free to use funny nicknames and inside jokes!";
        } else if (relationship === 'Partner') {
          msg = "For your partner, focus on emotional depth. Highlight milestones, cozy dates, and tiny things you love about them.";
        }
        if (specialDetails.trim()) {
          msg += ` ❤️ Love that you mentioned: "${specialDetails.slice(0, 30)}...". That personal detail will make the letter feel incredibly special.`;
        }
        return msg;
      }

      case 4:
        return "Storytelling flow is key: Order your photos from 'Where it started' 📍 to 'A funny moment' 😂 to 'Looking forward' ✨. Drag and reorder them on the right.";

      case 5: {
        let text = "Struggling with words? Use our Smart Starters below or click 'Need Help Writing?' for a full AI draft.";
        if (specialDetails.trim()) {
          text += ` 💡 Try weaving in details about: "${specialDetails.slice(0, 40)}..."`;
        }
        return text;
      }

      case 6:
        if (selectedPlan === 'free') {
          return "Want custom music? Upgrade for ₹39 ✨. For free plans, our 'Lofi Chill' or 'Warm Guitar' tracks are perfect matches!";
        }
        if (occasion === 'Love' || occasion === 'Anniversary') {
          return "Piano Instrumentals or Soft Cinematic music will make this feel like a romantic movie scene 🎹.";
        }
        if (occasion === 'Sorry') {
          return "A soft, quiet acoustic melody helps create a sincere and healing atmosphere.";
        }
        if (occasion === 'Friendship' || occasion === 'Birthday') {
          return "Try upbeat indie-pop or acoustic celebration tracks to keep the energy high and fun! 🎉";
        }
        return "Select a soundtrack that matches the tempo of your memories.";

      case 7:
        if (selectedPlan === 'free') {
          return "Want premium themes? Upgrade for ₹39 ✨. The default dark mode vibe looks incredibly sleek!";
        }
        if (occasion === 'Love' || occasion === 'Anniversary') {
          return "The 'Sunset Warmth' or 'Midnight Glow' themes create a gorgeous, high-end romantic glow.";
        }
        if (occasion === 'Sorry') {
          return "The 'Nordic Minimalist' theme creates a quiet, honest space where your words speak loudest.";
        }
        return "Match your theme to their favorite colors or the overall mood of the photos.";

      case 8: {
        if (selectedPlan === 'free' || selectedPlan === 'basic') {
          return "✨ Upgrade to Premium or Luxury to enable passcode security, countdown timers, voice notes, and secret ending rewards!";
        }
        let list = [];
        if (selectedPlan === 'premium' || selectedPlan === 'luxury') {
          if (relationship === 'Crush') list.push("enable the runaway 'No' button for cute banter");
          if (occasion === 'Birthday') list.push("set a countdown timer to unlock exactly at midnight");
          if (selectedPlan === 'luxury') list.push("record a voice note for that raw emotional punch");
        }
        if (list.length > 0) {
          return `Pro-Tip: We recommend you ${list.join(' and ')} to make this surprise truly unforgettable.`;
        }
        return "Customize these settings to add the final interactive magic to your surprise page.";
      }

      default:
        return "Some feelings deserve more than words. We're here to help you craft the perfect surprise ✨";
    }
  };

  // 1. Initial Load Hook: fetch edit target surprise or unfinished draft
  useEffect(() => {
    const checkDraftOrEdit = async () => {
      if (!user) return;
      const supabase = createClient();
      
      if (editId) {
        setIsDraftLoading(true);
        const { data, error } = await supabase
          .from('surprises')
          .select('*')
          .eq('id', editId)
          .single();

        const surprise = data as any;

        if (!error && surprise) {
          setSurpriseId(editId);
          setOccasion(surprise.occasion);
          setRecipientName(surprise.recipient_name);
          setRelationship(surprise.relationship_type || 'Other');
          setSpecialDetails(surprise.special_note || '');
          setMessage(surprise.custom_message || '');
          setVibeTheme(surprise.selected_theme as any);
          setMusicTrack(surprise.selected_music || 'bday-h-3');
          setPasswordLock(surprise.password_lock || '');
          setIsPasswordEnabled(!!surprise.password_lock);
          setCountdownEnabled(surprise.countdown_enabled || false);
          setCountdownDuration(surprise.countdown_duration || 60);
          setMidnightUnlock(surprise.midnight_unlock);
          setNoRunawayInteraction(surprise.cute_no_button);
          setSelectedPlan(surprise.plan_type?.toLowerCase() as any || 'premium');
          setCustomUrl(surprise.surprise_slug || '');
          setHiddenEndingUrl(surprise.hidden_ending_url || '');
          setOlsEnabled(surprise.one_last_surprise_enabled || false);
          setOlsMessage(surprise.one_last_surprise_message || '');
          setOlsStyle(surprise.one_last_surprise_style || 'auto');
          setOlsMusicUrl(surprise.one_last_surprise_music_url || '');
          setOlsVoiceNoteUrl(surprise.one_last_surprise_voice_note_url || '');

          // Load photos
          const { data: photos } = await supabase
            .from('photos')
            .select('*')
            .eq('surprise_id', editId)
            .order('sort_order', { ascending: true });

          if (photos) {
            setMemories((photos as any[]).map(p => ({
              id: p.id,
              imageUrl: p.image_url,
              caption: p.caption || ''
            })));
          }
        }
        setIsDraftLoading(false);
      } else {
        setIsDraftLoading(true);
        const { data: draft } = await supabase
          .from('drafts')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (draft && draft.draft_data) {
          setDraftData(draft.draft_data);
          setShowResumeModal(true);
        } else {
          setSurpriseId(generateUUID());
        }
        setIsDraftLoading(false);
      }
    };

    checkDraftOrEdit();
  }, [user, editId]);

  // Load Free Plan usage and available credits
  useEffect(() => {
    const fetchUsageAndCredits = async () => {
      if (!user) return;
      const supabase = createClient();
      try {
        // Fetch free plan usage
        const { data: freeUsage } = await supabase
          .from('free_plan_usage')
          .select('surprise_id')
          .eq('user_id', user.id)
          .maybeSingle();
        setHasUsedFreePlan(!!freeUsage);

        // Fetch basic reward credits
        const { data: creditsData } = await supabase
          .from('reward_credits')
          .select('basic_credits')
          .eq('user_id', user.id)
          .maybeSingle();
        if (creditsData) {
          setBasicCredits(creditsData.basic_credits);
        }
      } catch (err) {
        console.warn('Error fetching usage/credits:', err);
      }
    };

    fetchUsageAndCredits();
  }, [user]);

  // Load Music Library from Supabase
  useEffect(() => {
    const loadMusic = async () => {
      const supabase = createClient();
      try {
        const { data, error } = await supabase
          .from('music_library')
          .select('*')
          .eq('is_hidden', false)
          .order('sort_order', { ascending: true });

        if (!error && data) {
          const mapped = data.map((song: any) => ({
            id: song.id,
            name: song.title,
            artist: song.artist,
            duration: song.duration,
            category: song.category,
            language: song.language,
            url: song.audio_url,
            coverUrl: song.cover_url,
            isTrending: song.is_trending,
            isMostEmotional: song.is_featured,
            isMostUsed: song.is_premium
          }));
          setMusicTracks(mapped);
        }
      } catch (err) {
        console.warn('Failed to fetch dynamic music library from Supabase:', err);
      }
    };

    loadMusic();
  }, []);

  // Audio Playback Hook
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;

    const legacyMap: Record<string, string> = {
      'guitar-1': 'love-h-1',
      'piano-1': 'sorry-h-1',
      'piano-2': 'sorry-h-2',
      'happy-1': 'bday-e-3',
      'happy-2': 'friend-h-2',
      'soft-1': 'sorry-e-3',
      'party-1': 'bday-h-3'
    };

    const resolvedTrackId = legacyMap[musicTrack] || musicTrack;

    let currentUrl = '';
    if (resolvedTrackId.startsWith('http')) {
      currentUrl = resolvedTrackId;
    } else {
      const found = musicTracks.find(t => t.id === resolvedTrackId);
      if (found) {
        currentUrl = found.url;
      }
    }

    let isCurrent = true;

    if (currentUrl) {
      if (audio.src !== currentUrl) {
        audio.src = currentUrl;
      }
      if (isPlayingAudio) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            if (err.name !== 'AbortError' && isCurrent) {
              console.warn('Audio play failed:', err);
              setIsPlayingAudio(false);
            }
          });
        }
      } else {
        audio.pause();
      }
    } else {
      audio.pause();
    }

    return () => {
      isCurrent = false;
      audio.pause();
    };
  }, [musicTrack, isPlayingAudio, musicTracks]);

  // 2. Debounced Draft Autosave (upserts state 3 seconds after user stops editing)
  const debouncedSaveRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timeoutId: NodeJS.Timeout | null = null;

    debouncedSaveRef.current = (data: any) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        if (!user || editId || isDraftLoading || !surpriseId) return;
        const supabase = createClient();
        const { error } = await supabase.from('drafts').upsert({
          user_id: user.id,
          draft_data: data,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
        if (error) {
          console.warn('Autosave draft failed:', error.message);
        }
      }, 3000);
    };

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user, editId, isDraftLoading, surpriseId]);

  useEffect(() => {
    if (!user || editId || isDraftLoading || !surpriseId || !debouncedSaveRef.current) return;

    debouncedSaveRef.current({
      surpriseId,
      occasion,
      recipientName,
      relationship,
      specialDetails,
      message,
      memories,
      musicCategory,
      musicTrack,
      vibeTheme,
      passwordLock,
      isPasswordEnabled,
      countdownEnabled,
      countdownDuration,
      midnightUnlock,
      noRunawayInteraction,
      selectedPlan,
      currentStep,
      customUrl,
      hiddenEndingUrl,
      olsEnabled,
      olsMessage,
      olsStyle,
      olsMusicUrl,
      olsVoiceNoteUrl
    });
  }, [
    occasion, recipientName, relationship, specialDetails, message, memories,
    musicCategory, musicTrack, vibeTheme, passwordLock, isPasswordEnabled, countdownEnabled, countdownDuration,
    midnightUnlock, noRunawayInteraction, selectedPlan, currentStep, customUrl,
    hiddenEndingUrl, olsEnabled, olsMessage, olsStyle, olsMusicUrl, olsVoiceNoteUrl
  ]);

  const handleResumeDraft = () => {
    if (draftData) {
      setSurpriseId(draftData.surpriseId || generateUUID());
      setOccasion(draftData.occasion || 'Birthday');
      setRecipientName(draftData.recipientName || '');
      setRelationship(draftData.relationship || 'Best Friend');
      setSpecialDetails(draftData.specialDetails || '');
      setMessage(draftData.message || '');
      setMemories(draftData.memories || []);
      setMusicCategory(draftData.musicCategory || 'All');
      setMusicTrack(draftData.musicTrack || 'bday-h-3');
      setVibeTheme(draftData.vibeTheme || 'dreamy');
      setPasswordLock(draftData.passwordLock || '');
      setIsPasswordEnabled(draftData.isPasswordEnabled || false);
      setCountdownEnabled(draftData.countdownEnabled || false);
      setCountdownDuration(draftData.countdownDuration || 60);
      setMidnightUnlock(draftData.midnightUnlock || false);
      setNoRunawayInteraction(draftData.noRunawayInteraction ?? true);
      setSelectedPlan(draftData.selectedPlan || 'premium');
      setCurrentStep(draftData.currentStep || 1);
      setCustomUrl(draftData.customUrl || '');
      setHiddenEndingUrl(draftData.hiddenEndingUrl || '');
      setOlsEnabled(draftData.olsEnabled || false);
      setOlsMessage(draftData.olsMessage || '');
      setOlsStyle(draftData.olsStyle || 'auto');
      setOlsMusicUrl(draftData.olsMusicUrl || '');
      setOlsVoiceNoteUrl(draftData.olsVoiceNoteUrl || '');
    }
    setShowResumeModal(false);
  };

  const handleDiscardDraft = async () => {
    if (user) {
      const supabase = createClient();
      await supabase.from('drafts').delete().eq('user_id', user.id);
    }
    setSurpriseId(generateUUID());
    setShowResumeModal(false);
  };

  // Update memory microcopy depending on upload count
  useEffect(() => {
    const count = memories.length;
    if (count === 0) {
      setMicrocopyText("Don't be shy, upload some memories! 📸");
    } else if (count === 1) {
      setMicrocopyText("Aww… this memory looks cute 😭");
    } else if (count === 2 || count === 3) {
      setMicrocopyText("Oh, this is going to be so special! ✨");
    } else {
      setMicrocopyText("Pure gold! They are going to love this! 💖");
    }
  }, [memories]);

  // Helper to extract storage path from a public Supabase URL
  const getStoragePathFromUrl = (url: string) => {
    const bucketName = 'heartly-storage';
    const bucketSegment = `/${bucketName}/`;
    const index = url.indexOf(bucketSegment);
    if (index !== -1) {
      return url.substring(index + bucketSegment.length);
    }
    return null;
  };

  // Polaroid mockup upload addition
  const handleAddMemory = () => {
    const maxPhotos = PLAN_LIMITS[selectedPlan] || 10;
    if (memories.length >= maxPhotos) {
      triggerUpgradeModal('photos');
      return;
    }
    fileInputRef.current?.click();
  };

  const uploadImages = async (files: File[]) => {
    if (!user || !surpriseId) return;
    const maxPhotos = PLAN_LIMITS[selectedPlan] || 10;
    const currentCount = memories.length;
    const slotsLeft = maxPhotos - currentCount;

    if (files.length > slotsLeft) {
      triggerUpgradeModal('photos');
      return;
    }

    setIsUploading(true);
    const supabase = createClient();

    await Promise.all(
      files.map(async (file) => {
        // Validate format
        const validFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
        const extension = file.name.split('.').pop()?.toLowerCase() || '';
        const isHeic = ['heic', 'heif'].includes(extension);
        if (!validFormats.includes(file.type) && !isHeic) {
          showToast(`Format not supported for ${file.name}. Only JPG, PNG, WEBP, and HEIC are allowed.`, "error");
          return;
        }

        // Validate size (5MB limit)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
          showToast(`File ${file.name} is too large. Maximum size allowed is 5MB.`, "error");
          return;
        }

        const fileName = `${Math.random().toString(36).substring(2, 11)}.${isHeic ? 'jpg' : extension}`;
        const filePath = `users/${user.id}/surprises/${surpriseId}/images/${fileName}`;

        // Track progress in state via simulation
        setUploadProgress((prev) => ({ ...prev, [file.name]: 5 }));
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev[file.name] === undefined) return prev;
            const current = prev[file.name];
            if (current >= 95) return prev;
            const increment = Math.max(1, Math.round((98 - current) * 0.1));
            return { ...prev, [file.name]: current + increment };
          });
        }, 200);

        try {
          // Compress image
          const compressedBlob = await compressImage(file, 1200, 1200, 0.8);

          // Upload image using retry logic
          let uploadError = null;
          try {
            await uploadWithRetry(supabase, 'heartly-storage', filePath, compressedBlob);
          } catch (err: any) {
            uploadError = err;
          }

          clearInterval(progressInterval);

          if (uploadError) {
            showToast(`Upload failed for ${file.name}: ${uploadError.message}`, "error");
            setUploadProgress((prev) => {
              const copy = { ...prev };
              delete copy[file.name];
              return copy;
            });
            return;
          }

          setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }));

          const { data: { publicUrl } } = supabase.storage
            .from('heartly-storage')
            .getPublicUrl(filePath);

          const newMemory: Memory = {
            id: 'm-' + Math.random().toString(36).substring(2, 9),
            imageUrl: publicUrl,
            caption: ''
          };

          setMemories((prev) => [...prev, newMemory]);
        } catch (err: any) {
          clearInterval(progressInterval);
          showToast(`Oops, upload broke 💔: ${err.message}`, "error");
        } finally {
          setTimeout(() => {
            setUploadProgress((prev) => {
              const copy = { ...prev };
              delete copy[file.name];
              return copy;
            });
          }, 1000);
        }
      })
    );
    setIsUploading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      await uploadImages(files);
    }
  };

  const handleMusicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !surpriseId) return;

    // Validate size (< 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      showToast("Custom music file is too large. Maximum size allowed is 10MB.", "error");
      return;
    }

    // Validate format
    const validFormats = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/x-m4a', 'audio/m4a', 'audio/x-aac', 'audio/aac'];
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const isAudioExt = ['mp3', 'wav', 'm4a'].includes(extension);
    if (!validFormats.includes(file.type) && !isAudioExt) {
      showToast("Only MP3, WAV, and M4A audio files are allowed.", "error");
      return;
    }

    setIsUploading(true);
    const supabase = createClient();
    try {
      // Cleanup previous custom music if any
      if (musicTrack && musicTrack.startsWith('http')) {
        const oldPath = getStoragePathFromUrl(musicTrack);
        if (oldPath) {
          await supabase.storage.from('heartly-storage').remove([oldPath]);
        }
      }

      const fileExt = file.name.split('.').pop() || 'mp3';
      const fileName = `${Math.random().toString(36).substring(2, 11)}.${fileExt}`;
      const filePath = `users/${user.id}/surprises/${surpriseId}/music/${fileName}`;

      let uploadError = null;
      try {
        await uploadWithRetry(supabase, 'heartly-storage', filePath, file);
      } catch (err: any) {
        uploadError = err;
      }

      if (uploadError) {
        showToast('Upload failed: ' + uploadError.message, 'error');
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('heartly-storage')
        .getPublicUrl(filePath);

      setMusicTrack(publicUrl);
      showToast('Custom music track uploaded successfully! 🎵', 'success');
    } catch (err: any) {
      showToast('Error uploading custom music: ' + err.message, 'error');
    } finally {
      setIsUploading(false);
    }
  };



  const uploadHiddenEnding = async (file: File) => {
    if (!file || !user || !surpriseId) return;

    // Validate size (< 20MB)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      showToast("Hidden ending file is too large. Maximum size allowed is 20MB.", "error");
      return;
    }

    // Validate format (images + videos)
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'webm', 'ogg'];
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    if (!validExtensions.includes(extension)) {
      showToast("Only image (JPG, PNG, WEBP) and video (MP4, WEBM) files are allowed.", "error");
      return;
    }

    setIsUploading(true);
    const supabase = createClient();
    try {
      // Cleanup previous hidden ending if any
      if (hiddenEndingUrl && hiddenEndingUrl.startsWith('http')) {
        const oldPath = getStoragePathFromUrl(hiddenEndingUrl);
        if (oldPath) {
          await supabase.storage.from('heartly-storage').remove([oldPath]);
        }
      }

      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `secret-${Math.random().toString(36).substring(2, 11)}.${fileExt}`;
      const filePath = `users/${user.id}/surprises/${surpriseId}/secret/${fileName}`;

      let uploadError = null;
      try {
        await uploadWithRetry(supabase, 'heartly-storage', filePath, file);
      } catch (err: any) {
        uploadError = err;
      }
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('heartly-storage')
        .getPublicUrl(filePath);
      setHiddenEndingUrl(publicUrl);
      showToast('Hidden ending uploaded successfully! 🤫', 'success');
    } catch (err: any) {
      showToast('Error uploading hidden ending: ' + err.message, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const uploadOlsMusic = async (file: File) => {
    if (!file || !user || !surpriseId) return;

    // Validate size (< 15MB)
    const maxSize = 15 * 1024 * 1024;
    if (file.size > maxSize) {
      showToast("Ending music file is too large. Maximum size allowed is 15MB.", "error");
      return;
    }

    // Validate format (MP3, WAV, M4A)
    const validExtensions = ['mp3', 'wav', 'm4a'];
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    if (!validExtensions.includes(extension)) {
      showToast("Only MP3, WAV, and M4A audio files are allowed.", "error");
      return;
    }

    setIsUploading(true);
    const supabase = createClient();
    try {
      if (olsMusicUrl && olsMusicUrl.startsWith('http')) {
        const oldPath = getStoragePathFromUrl(olsMusicUrl);
        if (oldPath) {
          await supabase.storage.from('heartly-storage').remove([oldPath]);
        }
      }

      const fileExt = file.name.split('.').pop() || 'mp3';
      const fileName = `olsmusic-${Math.random().toString(36).substring(2, 11)}.${fileExt}`;
      const filePath = `users/${user.id}/surprises/${surpriseId}/olsmusic/${fileName}`;

      let uploadError = null;
      try {
        await uploadWithRetry(supabase, 'heartly-storage', filePath, file);
      } catch (err: any) {
        uploadError = err;
      }
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('heartly-storage')
        .getPublicUrl(filePath);
      setOlsMusicUrl(publicUrl);
      showToast('Ending music uploaded successfully! 🎵', 'success');
    } catch (err: any) {
      showToast('Error uploading ending music: ' + err.message, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const uploadOlsVoiceNote = async (file: File) => {
    if (!file || !user || !surpriseId) return;

    // Validate size (< 15MB)
    const maxSize = 15 * 1024 * 1024;
    if (file.size > maxSize) {
      showToast("Ending voice note file is too large. Maximum size allowed is 15MB.", "error");
      return;
    }

    // Validate format (MP3, WAV, M4A)
    const validExtensions = ['mp3', 'wav', 'm4a'];
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    if (!validExtensions.includes(extension)) {
      showToast("Only MP3, WAV, and M4A audio files are allowed.", "error");
      return;
    }

    setIsUploading(true);
    const supabase = createClient();
    try {
      if (olsVoiceNoteUrl && olsVoiceNoteUrl.startsWith('http')) {
        const oldPath = getStoragePathFromUrl(olsVoiceNoteUrl);
        if (oldPath) {
          await supabase.storage.from('heartly-storage').remove([oldPath]);
        }
      }

      const fileExt = file.name.split('.').pop() || 'mp3';
      const fileName = `olsvoice-${Math.random().toString(36).substring(2, 11)}.${fileExt}`;
      const filePath = `users/${user.id}/surprises/${surpriseId}/olsvoice/${fileName}`;

      let uploadError = null;
      try {
        await uploadWithRetry(supabase, 'heartly-storage', filePath, file);
      } catch (err: any) {
        uploadError = err;
      }
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('heartly-storage')
        .getPublicUrl(filePath);
      setOlsVoiceNoteUrl(publicUrl);
      showToast('Ending voice note uploaded successfully! 🎤', 'success');
    } catch (err: any) {
      showToast('Error uploading ending voice note: ' + err.message, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const triggerMusicInput = () => {
    if (selectedPlan === 'free') {
      triggerUpgradeModal('music');
      return;
    }
    musicInputRef.current?.click();
  };

  const handleUpdateCaption = (id: string, text: string) => {
    setMemories(memories.map(m => m.id === id ? { ...m, caption: text } : m));
  };

  const handleDeleteMemory = async (id: string) => {
    const memoryToDelete = memories.find(m => m.id === id);
    if (memoryToDelete) {
      const path = getStoragePathFromUrl(memoryToDelete.imageUrl);
      if (path) {
        const supabase = createClient();
        await supabase.storage.from('heartly-storage').remove([path]);
      }
    }
    setMemories(memories.filter(m => m.id !== id));
  };

  // Reorder memories helper
  const handleReorder = (idx: number, dir: 'up' | 'down') => {
    const newMems = [...memories];
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (targetIdx >= 0 && targetIdx < newMems.length) {
      const temp = newMems[idx];
      newMems[idx] = newMems[targetIdx];
      newMems[targetIdx] = temp;
      setMemories(newMems);
    }
  };

  // Helper to validate and clean up text for spelling, spacing, capitalization, and duplicate words
  const cleanAndValidateText = (text: string): string => {
    if (!text) return '';

    let cleaned = text;

    // 1. Remove accidental duplicated words (e.g., "the the", "we we", "and and", "to to")
    cleaned = cleaned.replace(/\b(\w+)\s+\1\b/gi, '$1');

    // 2. Fix spacing around punctuation: "hello , world" -> "hello, world"
    cleaned = cleaned.replace(/\s+([.,!?;:])(\s*)/g, '$1$2');

    // 3. Fix double spaces or spaces at beginning of lines
    cleaned = cleaned.replace(/ +/g, ' ');
    cleaned = cleaned.replace(/\n +/g, '\n');
    cleaned = cleaned.replace(/ +\n/g, '\n');

    // 4. Ensure proper capitalization at start of sentences
    cleaned = cleaned.replace(/(^\s*|[.!?]\s+)([a-z])/g, (match, separator, letter) => {
      return separator + letter.toUpperCase();
    });

    // 5. Automatic spell corrections for common typing errors
    const spellCorrections: Record<string, string> = {
      'recieve': 'receive',
      'wierd': 'weird',
      'tommorrow': 'tomorrow',
      'comming': 'coming',
      'beleive': 'believe',
      'happend': 'happened',
      'definately': 'definitely',
      'seperate': 'separate',
      'untill': 'until',
      'truely': 'truly',
      'awsome': 'awesome',
      'excitment': 'excitement',
      'gratefull': 'grateful',
      'memmory': 'memory',
      'memmories': 'memories',
      'anniversery': 'anniversary',
      'freind': 'friend',
      'freinds': 'friends',
      'specialy': 'specially',
      'appologize': 'apologize',
    };

    Object.entries(spellCorrections).forEach(([wrong, right]) => {
      const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
      cleaned = cleaned.replace(regex, (match) => {
        if (match.charAt(0) === match.charAt(0).toUpperCase()) {
          return right.charAt(0).toUpperCase() + right.slice(1);
        }
        return right;
      });
    });

    return cleaned;
  };

  // Helper to generate dynamic emotional letters with context integration
  const generateDynamicLetter = (tone: string, name: string, relationship: string, specialDetails: string): string => {
    const nameStr = name || 'My Favorite Person';
    const relationStr = relationship ? relationship.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim() : '';
    const relationshipNoun = relationStr || 'special someone';

    const detailsParagraph = specialDetails 
      ? `I was thinking about the time when ${specialDetails.trim()}. Moments like those remind me of how truly unique our connection is.`
      : '';

    switch (tone) {
      case 'warm': // Birthday
        return `Dear ${nameStr},

Happy Birthday! Today is all about celebrating the incredible light you bring to this world. From our midnight conversations to all our shared laughs, you have been a true source of joy in my life.

${detailsParagraph || 'I put together these memories to remind you of how far we\'ve come and how much you mean to me.'} Here is to celebrating your day, and to making many more beautiful memories together. I hope today brings you endless reasons to smile!

With all my warmth and love,
Your Friend`;

      case 'romantic': // Anniversary
        return `My dearest ${nameStr},

Happy Anniversary! Looking back at our journey, I am filled with gratitude for the day you walked into my life. You make every ordinary day feel extraordinary, and every moment feel lighter and warmer.

${detailsParagraph || 'Looking at these polaroids of our times together, I am reminded of all the small and big ways you make me feel loved.'} Thank you for standing by me through all of life's seasons, for being my partner, my peace, and my greatest adventure.

Forever yours,
Your Partner`;

      case 'sorry': // Apology
        return `Hey ${nameStr},

I have been thinking a lot about what happened between us. I truly hate that we went silent, and I wanted to reach out and say a sincere apology. Our bond means too much to me to let a misunderstanding get in the way.

${detailsParagraph || 'I compiled these special moments to remind us of the laughter and connection we share.'} I hope we can put this behind us and talk soon. I truly value you.`;

      case 'love': // Love / Proposal
        return `My special ${relationshipNoun}, ${nameStr},

Every single day with you feels like a beautiful dream. You are my anchor, my peace, and my greatest happiness. I want to take a moment to tell you how deeply I cherish you.

${detailsParagraph || 'Looking back at these moments we\'ve shared, I know in my heart that my favorite place in the world is right by your side.'} I want to write all my future chapters with you. Thank you for being my love, my partner, and my home. ❤️`;

      case 'friendship': // Friendship / Roast
        return `To my favorite partner-in-crime, ${nameStr} 😂,

They say good friends are hard to find, but with a laugh as loud as yours, you were impossible to miss! From our chaotic plans to the constant inside jokes, life is so much better with you around.

${detailsParagraph || 'I compiled these memory drops so you can look back and remember how awesome (and slightly embarrassing) our bond is.'} Cheers to the laughs, the roasting, and the endless adventures! 🍻`;

      default:
        return `Dear ${nameStr},

I wanted to share this special surprise with you to celebrate our bond. Every memory we share is a treasure, and I look forward to creating many more together.`;
    }
  };

  // Simulated AI draft generator typewriter effect
  const handleAiDraftInsert = (draftType: string) => {
    const nameStr = recipientName || 'My Favorite Person';
    const rawText = generateDynamicLetter(draftType, nameStr, relationship, specialDetails);
    const targetText = cleanAndValidateText(rawText);

    setAiAssistantOpen(false);
    setMessage('');
    
    let index = 0;
    const interval = setInterval(() => {
      if (index < targetText.length) {
        setMessage((prev) => prev + targetText.charAt(index));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 12);
    
    if (!title) {
      setTitle(`${occasion} surprise for ${nameStr} ❤️`);
    }
  };

  // Helper to load Razorpay modal checkout script
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve(false);
        return;
      }
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const mapPlanToDbName = (plan: string) => {
    const map: Record<string, string> = {
      free: 'Free',
      basic: 'Basic',
      premium: 'Premium',
      luxury: 'Luxury'
    };
    return map[plan.toLowerCase()] || plan;
  };

  // Save creation & Payment Checkout
  const handleGenerateSurprise = async () => {
    setValidationError(null);

    // 1. Validation checks
    if (!recipientName.trim()) {
      setValidationError("Recipient name is required. Please set it in Step 1.");
      setCurrentStep(1);
      return;
    }
    if (!occasion) {
      setValidationError("Please select an occasion in Step 1.");
      setCurrentStep(1);
      return;
    }
    if (memories.length === 0) {
      setValidationError("At least one memory photo is required. Please add it in Step 4.");
      setCurrentStep(4);
      return;
    }
    if (!message.trim()) {
      setValidationError("Your personal letter message is required. Please write it in Step 5.");
      setCurrentStep(5);
      return;
    }

    if (!user) {
      setValidationError("You must be logged in to create surprises.");
      return;
    }

    // Client-side XSS / Injection prevention sanitization
    const sanitizeText = (text: string): string => {
      if (!text) return '';
      return text.replace(/<[^>]*>/g, '').trim();
    };

    const cleanRecipientName = sanitizeText(recipientName);
    const cleanRelationship = sanitizeText(relationship);
    const cleanOccasion = sanitizeText(occasion);
    const cleanSpecialDetails = sanitizeText(specialDetails);
    const cleanMessage = sanitizeText(message);
    const cleanPasswordLock = isPasswordEnabled ? sanitizeText(passwordLock) : '';
    const cleanCustomUrl = sanitizeText(customUrl);

    setIsPublishing(true);
    const supabase = createClient();

    // Mapping plan mapping casing
    const dbPlanName = mapPlanToDbName(selectedPlan);

    // Determine if this is an already paid edit
    let isPaidEdit = false;
    if (editId) {
      try {
        const { data: surpriseData } = await supabase
          .from('surprises')
          .select('status')
          .eq('id', editId)
          .single();
        if (surpriseData && surpriseData.status === 'active') {
          isPaidEdit = true;
        }
      } catch (err) {
        console.error("Error checking surprise status:", err);
      }
    }

    // Edit Flow for ALREADY PAID surprises (updates database records directly without payments)
    if (editId && isPaidEdit) {
      try {
        // Fetch original surprise slug for fallback
        const { data: surpriseData } = await supabase
          .from('surprises')
          .select('surprise_slug')
          .eq('id', editId)
          .single();

        const originalSlug = surpriseData?.surprise_slug || 'demo';
        const finalSlug = (selectedPlan === 'luxury' && cleanCustomUrl) ? cleanCustomUrl : originalSlug;

        const { error: surpriseError } = await supabase
          .from('surprises')
          .update({
            recipient_name: cleanRecipientName,
            relationship_type: cleanRelationship,
            occasion: cleanOccasion,
            special_note: cleanSpecialDetails,
            custom_message: cleanMessage,
            selected_theme: vibeTheme,
            selected_music: musicTrack,
            plan_type: dbPlanName,
            password_lock: cleanPasswordLock || null,
            countdown_enabled: countdownEnabled,
            countdown_duration: countdownDuration,
            countdown_date: null,
            midnight_unlock: midnightUnlock,
            cute_no_button: noRunawayInteraction,
            voice_note_url: null,
            hidden_ending_url: hiddenEndingUrl || null,
            surprise_slug: finalSlug,
            one_last_surprise_enabled: olsEnabled,
            one_last_surprise_message: olsMessage || null,
            one_last_surprise_style: olsStyle || 'auto',
            one_last_surprise_music_url: olsMusicUrl || null,
            one_last_surprise_voice_note_url: olsVoiceNoteUrl || null
          })
          .eq('id', editId);

        if (surpriseError) {
          if (surpriseError.message.includes('unique constraint') || surpriseError.message.includes('slug')) {
            throw new Error("Custom URL slug is already taken. Please try another custom URL.");
          }
          throw surpriseError;
        }

        // Clear and rewrite memories
        await supabase.from('photos').delete().eq('surprise_id', editId);
        const photoInserts = memories.map((m, idx) => ({
          surprise_id: editId,
          image_url: m.imageUrl,
          caption: sanitizeText(m.caption),
          sort_order: idx
        }));
        const { error: photosError } = await supabase.from('photos').insert(photoInserts);
        if (photosError) throw photosError;

        // Handle custom music uploads
        if (musicTrack.startsWith('http')) {
          const { error: musicError } = await supabase.from('music_uploads').upsert({
            surprise_id: editId,
            music_url: musicTrack,
            music_type: 'custom'
          });
          if (musicError) throw musicError;
        }

        setPublishedLink(`${window.location.origin}/s/${finalSlug}`);
      } catch (err: any) {
        setValidationError("Failed to save surprise changes: " + err.message);
      } finally {
        setIsPublishing(false);
      }
      return;
    }

    // Free Plan Flow (direct publish for new creations or draft edits)
    if (selectedPlan === 'free') {
      try {
        const slug = editId ? (cleanCustomUrl || generateSecureSlug()) : generateSecureSlug();
        const { data: surprise, error: surpriseError } = await supabase
          .from('surprises')
          .upsert({
            id: surpriseId,
            user_id: user.id,
            recipient_name: cleanRecipientName,
            relationship_type: cleanRelationship,
            occasion: cleanOccasion,
            special_note: cleanSpecialDetails,
            custom_message: cleanMessage,
            selected_theme: vibeTheme,
            selected_music: musicTrack,
            plan_type: dbPlanName,
            surprise_slug: slug,
            status: 'active',
            password_lock: cleanPasswordLock || null,
            countdown_enabled: countdownEnabled,
            countdown_duration: countdownDuration,
            countdown_date: null,
            midnight_unlock: midnightUnlock,
            cute_no_button: noRunawayInteraction,
            voice_note_url: null,
            hidden_ending_url: hiddenEndingUrl || null,
            one_last_surprise_enabled: olsEnabled,
            one_last_surprise_message: olsMessage || null,
            one_last_surprise_style: olsStyle || 'auto',
            one_last_surprise_music_url: olsMusicUrl || null,
            one_last_surprise_voice_note_url: olsVoiceNoteUrl || null
          })
          .select()
          .single();

        if (surpriseError) {
          if (surpriseError.message.includes('unique constraint') || surpriseError.message.includes('slug')) {
            throw new Error("Custom URL slug is already taken. Please try another custom URL.");
          }
          throw surpriseError;
        }

        // Save memories (delete existing first to handle draft updates)
        await supabase.from('photos').delete().eq('surprise_id', surpriseId);
        const photoInserts = memories.map((m, idx) => ({
          surprise_id: surprise.id,
          image_url: m.imageUrl,
          caption: sanitizeText(m.caption),
          sort_order: idx
        }));
        const { error: photosError } = await supabase.from('photos').insert(photoInserts);
        if (photosError) throw photosError;

        // Custom music (delete existing first to handle draft updates)
        await supabase.from('music_uploads').delete().eq('surprise_id', surpriseId);
        if (musicTrack.startsWith('http')) {
          const { error: musicError } = await supabase.from('music_uploads').insert({
            surprise_id: surprise.id,
            music_url: musicTrack,
            music_type: 'custom'
          });
          if (musicError) throw musicError;
        }

        // Discard draft
        await supabase.from('drafts').delete().eq('user_id', user.id);

        setPublishedLink(`${window.location.origin}/s/${slug}`);
      } catch (err: any) {
        setValidationError("Failed to publish surprise: " + err.message);
      } finally {
        setIsPublishing(false);
      }
      return;
    }

    // Paid Plan Flow (Saves surprise in 'draft' status, opens Razorpay modal)
    const isRedeemingCredit = selectedPlan === 'basic' && useCreditChecked && basicCredits > 0;
    if (!isRedeemingCredit) {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        showToast("Failed to load payment checkout script. Please check your internet connection.", "error");
        setIsPublishing(false);
        return;
      }
    }

    const slug = (selectedPlan === 'luxury' && cleanCustomUrl) ? cleanCustomUrl : (editId && cleanCustomUrl ? cleanCustomUrl : generateSecureSlug());

    try {
      // 1. Create or update draft surprise in db first
      const { error: surpriseError } = await supabase
        .from('surprises')
        .upsert({
          id: surpriseId,
          user_id: user.id,
          recipient_name: cleanRecipientName,
          relationship_type: cleanRelationship,
          occasion: cleanOccasion,
          special_note: cleanSpecialDetails,
          custom_message: cleanMessage,
          selected_theme: vibeTheme,
          selected_music: musicTrack,
          plan_type: dbPlanName,
          surprise_slug: slug,
          status: 'draft', // Saved as draft until paid
          password_lock: cleanPasswordLock || null,
          countdown_enabled: countdownEnabled,
          countdown_duration: countdownDuration,
          countdown_date: null,
          midnight_unlock: midnightUnlock,
          cute_no_button: noRunawayInteraction,
          voice_note_url: null,
          hidden_ending_url: hiddenEndingUrl || null,
          one_last_surprise_enabled: olsEnabled,
          one_last_surprise_message: olsMessage || null,
          one_last_surprise_style: olsStyle || 'auto',
          one_last_surprise_music_url: olsMusicUrl || null,
          one_last_surprise_voice_note_url: olsVoiceNoteUrl || null
        });

      if (surpriseError) {
        if (surpriseError.message.includes('unique constraint') || surpriseError.message.includes('slug')) {
          throw new Error("Custom URL slug is already taken. Please try another custom URL.");
        }
        throw new Error("Failed to save draft surprise configuration: " + surpriseError.message);
      }

      // Save memories (delete existing first to handle draft updates)
      await supabase.from('photos').delete().eq('surprise_id', surpriseId);
      const photoInserts = memories.map((m, idx) => ({
        surprise_id: surpriseId,
        image_url: m.imageUrl,
        caption: sanitizeText(m.caption),
        sort_order: idx
      }));
      const { error: photosError } = await supabase.from('photos').insert(photoInserts);
      if (photosError) throw photosError;

      // Custom music (delete existing first to handle draft updates)
      await supabase.from('music_uploads').delete().eq('surprise_id', surpriseId);
      if (musicTrack.startsWith('http')) {
        const { error: musicError } = await supabase.from('music_uploads').insert({
          surprise_id: surpriseId,
          music_url: musicTrack,
          music_type: 'custom'
        });
        if (musicError) throw musicError;
      }

      // 2. Initialize Checkout Session
      const checkoutRes = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surpriseId,
          planName: selectedPlan,
          useCredit: isRedeemingCredit
        })
      });

      if (!checkoutRes.ok) {
        const errorData = await checkoutRes.json();
        throw new Error(errorData.error || 'Checkout session initialization failed');
      }

      const checkoutData = await checkoutRes.json();

      // If credit was redeemed successfully
      if (checkoutData.isCreditRedeemed) {
        setPublishedLink(`${window.location.origin}/s/${checkoutData.slug}`);
        showToast("Credit applied: Surprise published successfully! 🎉", "success");
        setBasicCredits(prev => Math.max(0, prev - 1));
        setIsPublishing(false);
        return;
      }

      // If local development auto-success is returned, complete publishing instantly
      if (checkoutData.isDevelopment) {
        setPublishedLink(`${window.location.origin}/s/${checkoutData.slug}`);
        showToast("Development mode: Payment simulated successfully! 🎉", "success");
        setIsPublishing(false);
        return;
      }

      // If sandbox checkout mode is active, show simulated payment UI
      if (checkoutData.isSandbox) {
        setSandboxPaymentData({
          surpriseId,
          planName: selectedPlan,
          amount: checkoutData.amount / 100,
          orderId: checkoutData.orderId
        });
        setShowSandboxPaymentModal(true);
        setIsPublishing(false);
        return;
      }

      // 3. Open Razorpay Widget Checkout modal
      const options = {
        key: checkoutData.keyId,
        amount: checkoutData.amount,
        currency: checkoutData.currency,
        name: 'Heartly',
        description: `Activate your ${selectedPlan.toUpperCase()} Surprise Page`,
        image: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=100&auto=format&fit=crop&q=80',
        order_id: checkoutData.orderId,
        handler: async function (response: any) {
          setIsPublishing(true);
          try {
            // Verify payment
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                surpriseId,
                planName: selectedPlan
              })
            });

            if (!verifyRes.ok) {
              const verifyError = await verifyRes.json();
              throw new Error(verifyError.error || 'Payment signature verification failed');
            }

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              setPublishedLink(`${window.location.origin}/s/${verifyData.slug}`);
            }
          } catch (err: any) {
            setValidationError("Payment verification failed: " + err.message);
          } finally {
            setIsPublishing(false);
          }
        },
        prefill: {
          name: user.email?.split('@')[0] || '',
          email: user.email || ''
        },
        theme: {
          color: '#a855f7' // Brand color purple
        },
        modal: {
          ondismiss: function () {
            setIsPublishing(false);
            setValidationError("Payment incomplete 💔. Don't worry, your progress has been saved as a draft.");
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      
      rzp.on('payment.failed', function (response: any) {
        setIsPublishing(false);
        setValidationError(`Payment failed: ${response.error.description || 'Transaction unsuccessful'}`);
      });

      rzp.open();
    } catch (err: any) {
      setIsPublishing(false);
      setValidationError("Failed to initialize checkout: " + err.message);
    }
  };

  const handleSimulatePaymentSuccess = async () => {
    if (!sandboxPaymentData) return;
    setIsPublishing(true);
    setValidationError(null);
    
    try {
      const verifyRes = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_payment_id: `pay_sandbox_${Math.random().toString(36).substring(2, 12)}`,
          razorpay_order_id: sandboxPaymentData.orderId,
          razorpay_signature: 'sandbox_signature_passed',
          surpriseId: sandboxPaymentData.surpriseId,
          planName: sandboxPaymentData.planName
        })
      });

      if (!verifyRes.ok) {
        const verifyError = await verifyRes.json();
        throw new Error(verifyError.error || 'Payment signature verification failed');
      }

      const verifyData = await verifyRes.json();
      if (verifyData.success) {
        setPublishedLink(`${window.location.origin}/s/${verifyData.slug}`);
        showToast("Payment verified! Surprise activated successfully 🎉", "success");
      }
    } catch (err: any) {
      console.error('Sandbox verification failed:', err);
      setValidationError("Payment verification failed: " + err.message);
    } finally {
      setIsPublishing(false);
      setShowSandboxPaymentModal(false);
      setSandboxPaymentData(null);
    }
  };

  const handleSimulatePaymentCancel = () => {
    setShowSandboxPaymentModal(false);
    setIsPublishing(false);
    setValidationError("Payment incomplete 💔. Don't worry, your progress has been saved as a draft.");
    setSandboxPaymentData(null);
  };

  const handleNextStep = () => {
    setValidationError(null);
    
    // Smart Validation Guidance
    if (currentStep === 1) {
      if (!recipientName.trim()) {
        setValidationError("Please tell us who this is for before moving forward! ❤️");
        return;
      }
    }
    
    if (currentStep === 4) {
      if (memories.length === 0) {
        setValidationError("At least one memory photo is required. Please add it! 📸");
        return;
      }
      if (memories.length === 1 && !gentleGuidanceShown) {
        setValidationError("Adding more memories makes it feel extra special ❤️. Tap 'Continue' again if you want to proceed with just one photo!");
        setGentleGuidanceShown(true);
        return;
      }
    }
    
    if (currentStep === 5) {
      if (!message.trim()) {
        setValidationError("Please write a small letter message for them! 💌");
        return;
      }
    }

    setGentleGuidanceShown(false);
    setDirection(1);
    setCurrentStep((prev) => Math.min(9, prev + 1));
  };

  const handlePrevStep = () => {
    setValidationError(null);
    setGentleGuidanceShown(false);
    setDirection(-1);
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  // Runway simulator button
  const handlePreviewNoInteract = () => {
    const x = (Math.random() - 0.5) * 160;
    const y = (Math.random() - 0.5) * 100;
    setPreviewNoPosition({ x, y });
    setPreviewNoCount((prev) => prev + 1);
  };

  return (
    <div className="space-y-8 text-left select-none relative">

      {/* 1. Global Publishing Loading Overlay */}
      <AnimatePresence>
        {isPublishing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-brand-black/90 backdrop-blur-md z-50 flex flex-col items-center justify-center space-y-4 text-center"
          >
            <Loader2 className="w-8 h-8 text-brand-purple animate-spin" />
            <p className="text-xs font-semibold text-brand-muted">Generating your emotional experience... ❤️</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Draft Resume Modal */}
      <AnimatePresence>
        {showResumeModal && (
          <>
            <div className="fixed inset-0 bg-brand-black/80 backdrop-blur-sm z-40" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm p-6 sm:p-8 glass-panel rounded-3xl border border-brand-border z-50 text-center space-y-6"
            >
              <div className="w-12 h-12 rounded-full bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center text-brand-purple mx-auto animate-pulse">
                <Heart className="w-6 h-6 fill-brand-purple/15" />
              </div>
              <div className="space-y-2">
                <h3 className="font-heading font-extrabold text-white text-base">Unfinished surprise found!</h3>
                <p className="text-xs text-brand-muted px-2">We noticed you have a draft saved in progress. Would you like to resume editing it or start fresh?</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleResumeDraft}
                  className="flex-1 py-3 rounded-lg bg-gradient-to-r from-brand-purple to-brand-pink text-xs font-semibold text-white cursor-pointer active:scale-95 transition-transform"
                >
                  Resume Draft
                </button>
                <button
                  onClick={handleDiscardDraft}
                  className="flex-1 py-3 rounded-lg border border-brand-border bg-brand-dark/40 text-xs font-semibold text-brand-muted hover:text-white cursor-pointer active:scale-95 transition-transform"
                >
                  Start Fresh
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 3. Published Surprise Link copy card */}
      <AnimatePresence>
        {publishedLink && (
          <>
            <div className="fixed inset-0 bg-brand-black/85 backdrop-blur-md z-40" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-6 sm:p-8 glass-panel rounded-3xl border border-brand-border/60 z-50 text-center space-y-6"
            >
              <div className="w-16 h-16 rounded-full bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center text-brand-purple mx-auto animate-bounce">
                <Heart className="w-8 h-8 fill-brand-purple/20 text-brand-purple" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-heading font-extrabold text-white text-lg sm:text-xl text-glow-purple">Your surprise is ready 😭❤️</h3>
                <p className="text-xs text-brand-muted max-w-xs mx-auto leading-relaxed">
                  Your premium dynamic surprise experience is live. Share the magic with {recipientName}!
                </p>
              </div>
              
              <div className="p-3.5 rounded-xl border border-brand-border bg-brand-dark/60 flex items-center justify-between gap-3 select-all">
                <span className="text-[11px] font-mono text-brand-purple truncate flex-1 text-left">{publishedLink}</span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(publishedLink);
                    showToast('Surprise URL Link copied to clipboard! 📋', 'success');
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-brand-purple/20 border border-brand-purple/35 text-[10px] font-bold text-brand-purple hover:bg-brand-purple/30 cursor-pointer active:scale-95 transition-all animate-pulse"
                >
                  Copy Link
                </button>
              </div>

              {/* Grid of sharing options */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <a 
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`I made a special dynamic surprise for you! Check it out here: ${publishedLink}`)}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="py-3 rounded-xl bg-[#25D366] text-xs font-bold text-white cursor-pointer active:scale-95 transition-transform flex items-center justify-center gap-1.5"
                >
                  <span>Share on WhatsApp</span>
                </a>

                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: `Special Surprise for you ❤️`,
                        text: `I made a special dynamic surprise for you! Check it out here:`,
                        url: publishedLink
                      }).catch(err => console.log('Share failed:', err));
                    } else {
                      navigator.clipboard.writeText(publishedLink);
                      showToast('Surprise URL Link copied! 📋', 'success');
                    }
                  }}
                  className="py-3 rounded-xl bg-brand-dark border border-brand-border hover:bg-brand-dark/80 text-xs font-bold text-white cursor-pointer active:scale-95 transition-transform flex items-center justify-center gap-1.5"
                >
                  <span>Share Manually</span>
                </button>

                <button
                  onClick={() => {
                    try {
                      const canvas = document.createElement('canvas');
                      canvas.width = 1080;
                      canvas.height = 1920;
                      const ctx = canvas.getContext('2d');
                      if (!ctx) return;

                      // Draw Background Gradient
                      const grad = ctx.createLinearGradient(0, 0, 1080, 1920);
                      const occ = (occasion || 'Celebration').toLowerCase();
                      if (occ === 'birthday') {
                        grad.addColorStop(0, '#3b0764');
                        grad.addColorStop(0.5, '#1e1b4b');
                        grad.addColorStop(1, '#701a75');
                      } else if (occ === 'anniversary') {
                        grad.addColorStop(0, '#881337');
                        grad.addColorStop(0.5, '#1e1b4b');
                        grad.addColorStop(1, '#4c0519');
                      } else if (occ === 'sorry') {
                        grad.addColorStop(0, '#0f172a');
                        grad.addColorStop(0.5, '#1e1b4b');
                        grad.addColorStop(1, '#1e293b');
                      } else if (occ === 'friendship') {
                        grad.addColorStop(0, '#7c2d12');
                        grad.addColorStop(0.5, '#18181b');
                        grad.addColorStop(1, '#451a03');
                      } else if (occ === 'farewell') {
                        grad.addColorStop(0, '#581c87');
                        grad.addColorStop(0.5, '#18181b');
                        grad.addColorStop(1, '#7c2d12');
                      } else if (occ === 'love' || occ === 'proposal') {
                        grad.addColorStop(0, '#9f1239');
                        grad.addColorStop(0.5, '#18181b');
                        grad.addColorStop(1, '#be123c');
                      } else {
                        grad.addColorStop(0, '#180828');
                        grad.addColorStop(0.5, '#090214');
                        grad.addColorStop(1, '#2a0b3f');
                      }
                      ctx.fillStyle = grad;
                      ctx.fillRect(0, 0, 1080, 1920);

                      // Draw sparkles
                      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                      ctx.font = '36px sans-serif';
                      ctx.fillText('✨', 150, 250);
                      ctx.fillText('✨', 900, 400);
                      ctx.fillText('✨', 800, 1400);
                      ctx.fillText('✨', 200, 1600);
                      ctx.fillText('❤️', 920, 1000);
                      ctx.fillText('🎁', 120, 1100);

                      // Draw Glass Card rounded rect manually
                      const cardX = 90;
                      const cardY = 360;
                      const cardW = 900;
                      const cardH = 1100;
                      const cardR = 48;

                      ctx.beginPath();
                      ctx.moveTo(cardX + cardR, cardY);
                      ctx.arcTo(cardX + cardW, cardY, cardX + cardW, cardY + cardH, cardR);
                      ctx.arcTo(cardX + cardW, cardY + cardH, cardX, cardY + cardH, cardR);
                      ctx.arcTo(cardX, cardY + cardH, cardX, cardY, cardR);
                      ctx.arcTo(cardX, cardY, cardX + cardW, cardY, cardR);
                      ctx.closePath();
                      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
                      ctx.fill();
                      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
                      ctx.lineWidth = 4;
                      ctx.stroke();

                      // Draw Badge text
                      ctx.textAlign = 'center';
                      ctx.fillStyle = '#ffffff';
                      ctx.font = 'bold 36px sans-serif';
                      ctx.fillText(`${(occasion || 'Celebration').toUpperCase()} SURPRISE 🎁`, 540, 520);

                      // Headline
                      ctx.fillStyle = '#94a3b8';
                      ctx.font = '500 38px sans-serif';
                      ctx.fillText('A special cinematic journey awaits', 540, 740);

                      // Name
                      ctx.fillStyle = '#ffffff';
                      ctx.font = '900 84px sans-serif';
                      ctx.fillText(`${recipientName || 'Someone Special'} ❤️`, 540, 900);

                      // Description
                      ctx.fillStyle = '#64748b';
                      ctx.font = '400 32px sans-serif';
                      ctx.fillText('Unlock memories, wishes, and customized music.', 540, 1060);
                      ctx.fillText('Open the shared Heartly link to view.', 540, 1110);

                      // Footer branding
                      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                      ctx.font = 'bold 36px sans-serif';
                      ctx.fillText('Made with Heartly ❤️', 540, 1340);
                      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                      ctx.font = '30px sans-serif';
                      ctx.fillText('heartly.in', 540, 1395);

                      // Download
                      const image = canvas.toDataURL('image/png');
                      const link = document.createElement('a');
                      link.download = `Heartly_Story_${recipientName || 'Surprise'}.png`;
                      link.href = image;
                      link.click();
                      showToast('Instagram Story card downloaded! 📸', 'success');
                    } catch (canvasErr) {
                      console.error('Canvas generate error:', canvasErr);
                      showToast('Failed to generate Story card.', 'error');
                    }
                  }}
                  className="py-3 rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 text-xs font-bold text-white cursor-pointer active:scale-95 transition-transform flex items-center justify-center gap-1.5"
                >
                  <span>Instagram Story Card</span>
                </button>

                <a 
                  href={publishedLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="py-3 rounded-xl bg-gradient-to-r from-brand-purple to-brand-pink text-xs font-bold text-white cursor-pointer active:scale-95 transition-transform flex items-center justify-center gap-1.5"
                >
                  <span>Open Surprise</span>
                </a>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full py-3 rounded-xl border border-brand-border bg-brand-dark/40 text-xs font-semibold text-brand-muted hover:text-white cursor-pointer active:scale-95 transition-transform"
                >
                  Go to Dashboard
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* AI Assistant modal */}
      <AnimatePresence>
        {aiAssistantOpen && (
          <>
            <div className="fixed inset-0 bg-brand-black/80 backdrop-blur-sm z-50" onClick={() => setAiAssistantOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-6 glass-panel rounded-3xl border border-brand-border z-50 space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-heading font-bold text-white text-base flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-brand-purple" />
                  <span>AI Writing Assistant</span>
                </h3>
                <button onClick={() => setAiAssistantOpen(false)} className="p-1.5 text-brand-muted hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-brand-muted">Select an emotional writing tone to draft your message letter.</p>
              
              <div className="space-y-3 pt-2">
                <button 
                  onClick={() => handleAiDraftInsert('warm')}
                  className="w-full p-4 rounded-xl border border-brand-border bg-brand-dark/40 hover:bg-brand-purple/5 hover:border-brand-purple/35 text-left text-xs transition-all cursor-pointer"
                >
                  <h4 className="font-bold text-white mb-1">🎂 Warm & Friendly Birthday</h4>
                  <p className="text-[10px] text-brand-muted">Perfect for best friends, siblings, or classmates.</p>
                </button>
                <button 
                  onClick={() => handleAiDraftInsert('romantic')}
                  className="w-full p-4 rounded-xl border border-brand-border bg-brand-dark/40 hover:bg-brand-pink/5 hover:border-brand-pink/35 text-left text-xs transition-all cursor-pointer"
                >
                  <h4 className="font-bold text-white mb-1">❤️ Deep & Romantic Anniversary</h4>
                  <p className="text-[10px] text-brand-muted">Perfect for partners, husbands, wives, or crushes.</p>
                </button>
                <button 
                  onClick={() => handleAiDraftInsert('love')}
                  className="w-full p-4 rounded-xl border border-brand-border bg-brand-dark/40 hover:bg-rose-500/5 hover:border-rose-500/35 text-left text-xs transition-all cursor-pointer"
                >
                  <h4 className="font-bold text-white mb-1">💖 Cinematic Love & Proposal</h4>
                  <p className="text-[10px] text-brand-muted">Perfect for expressions of deep love or special proposals.</p>
                </button>
                <button 
                  onClick={() => handleAiDraftInsert('friendship')}
                  className="w-full p-4 rounded-xl border border-brand-border bg-brand-dark/40 hover:bg-amber-500/5 hover:border-amber-500/35 text-left text-xs transition-all cursor-pointer"
                >
                  <h4 className="font-bold text-white mb-1">😂 Fun Friendship & Roast</h4>
                  <p className="text-[10px] text-brand-muted">Perfect for best friends, jokes, and laughing at memories.</p>
                </button>
                <button 
                  onClick={() => handleAiDraftInsert('sorry')}
                  className="w-full p-4 rounded-xl border border-brand-border bg-brand-dark/40 hover:bg-brand-blue/5 hover:border-brand-blue/35 text-left text-xs transition-all cursor-pointer"
                >
                  <h4 className="font-bold text-white mb-1">🥺 Soft Sincere Apology</h4>
                  <p className="text-[10px] text-brand-muted">Perfect for breaking the ice after a fight or misunderstanding.</p>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Upgrade Modal */}
      <AnimatePresence>
        {upgradeModalOpen && (
          <>
            <div className="fixed inset-0 bg-brand-black/80 backdrop-blur-sm z-50 animate-fade-in" onClick={() => setUpgradeModalOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm p-6 sm:p-8 glass-panel rounded-3xl border border-brand-border z-50 text-center space-y-6"
            >
              <div className="w-14 h-14 rounded-full bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center text-brand-purple mx-auto animate-pulse">
                <Sparkles className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h3 className="font-heading font-extrabold text-white text-base">
                  Unlock Premium Features ✨
                </h3>
                <p className="text-[11px] text-brand-muted px-2">
                  Upgrade your plan to unlock more memories and beautiful interactive options!
                </p>
              </div>

              {/* Benefits list */}
              <div className="p-4 rounded-2xl border border-brand-border bg-brand-dark/40 text-left text-[11px] text-brand-muted space-y-2.5">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Up to 20 memory photos & custom music</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Interactive passcode lock protection</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Countdown timers & midnight releases</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Cute runaway No button & premium themes</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => {
                    // Auto-select minimum required plan
                    let nextPlan: 'free' | 'basic' | 'premium' | 'luxury' = 'premium';
                    if (upgradeTargetFeature === 'midnight_unlock' || upgradeTargetFeature === 'custom_url' || upgradeTargetFeature === 'voice_note' || upgradeTargetFeature === 'hidden_ending') {
                      nextPlan = 'luxury';
                    } else if (upgradeTargetFeature === 'music' || upgradeTargetFeature === 'theme') {
                      nextPlan = 'basic';
                    } else if (upgradeTargetFeature === 'photos') {
                      if (selectedPlan === 'free') nextPlan = 'basic';
                      else if (selectedPlan === 'basic') nextPlan = 'premium';
                      else nextPlan = 'luxury';
                    }
                    setSelectedPlan(nextPlan);
                    setUpgradeModalOpen(false);
                    // Redirect to checkout step
                    setDirection(1);
                    setCurrentStep(9);
                  }}
                  className="flex-1 py-3 rounded-lg bg-gradient-to-r from-brand-purple to-brand-pink text-xs font-semibold text-white cursor-pointer active:scale-95 transition-transform"
                >
                  Upgrade Plan
                </button>
                <button
                  onClick={() => setUpgradeModalOpen(false)}
                  className="flex-1 py-3 rounded-lg border border-brand-border bg-brand-dark/40 text-xs font-semibold text-brand-muted hover:text-white cursor-pointer active:scale-95 transition-transform"
                >
                  Maybe Later
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Title */}
      <div>
        <h1 className="text-2xl font-heading font-extrabold text-white">Surprise Builder</h1>
        <p className="text-xs text-brand-muted mt-1">Design an interactive digital story that will make them cry happy tears.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT PANEL: WIZARD FORM */}
        <div className="lg:col-span-7 glass-panel p-6 sm:p-8 rounded-3xl border border-brand-border/60 space-y-8 overflow-hidden relative">
          
          {/* Stepper progress dots */}
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs font-semibold text-brand-muted">
              <span>Step {currentStep} of 9</span>
              <span className="text-brand-purple uppercase tracking-wider text-[10px] font-bold">
                {getStepEmotionalSubtitle(currentStep)}
              </span>
            </div>
            
            <div className="flex items-center gap-1.5 justify-between select-none">
              {stepsList.map((_, idx) => {
                const stepNum = idx + 1;
                const checked = currentStep > stepNum;
                const active = currentStep === stepNum;
                return (
                  <React.Fragment key={idx}>
                    <button
                      onClick={() => {
                        setDirection(idx + 1 > currentStep ? 1 : -1);
                        setCurrentStep(stepNum);
                      }}
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all cursor-pointer ${
                        checked ? 'bg-brand-purple/20 border-brand-purple text-brand-purple' :
                        active ? 'bg-gradient-to-r from-brand-purple to-brand-pink border-transparent text-white shadow-[0_0_10px_rgba(168,85,247,0.3)]' :
                        'bg-brand-dark border-brand-border text-brand-muted'
                      }`}
                    >
                      {checked ? <Check className="w-3.5 h-3.5" /> : stepNum}
                    </button>
                    {idx < stepsList.length - 1 && (
                      <div className={`flex-1 h-[2px] transition-colors ${
                        checked ? 'bg-brand-purple' : 'bg-brand-border'
                      }`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Smart Assistant Coaching Box */}
          {currentStep !== 2 && currentStep !== 9 && (
            <div className="p-3.5 rounded-2xl border border-brand-border bg-brand-dark/40 text-brand-muted text-[10px] sm:text-xs flex gap-2.5 items-start shadow-[0_0_15px_rgba(168,85,247,0.02)] select-none">
              <Sparkles className="w-4 h-4 text-brand-purple shrink-0 mt-0.5 animate-pulse" />
              <div className="leading-relaxed font-sans text-left">
                <span className="font-bold text-white block mb-0.5">Assistant Tip 🧠:</span>
                {getOccasionAssistantTip()}
              </div>
            </div>
          )}

          {validationError && (
            <div className="text-xs font-semibold text-brand-pink bg-brand-pink/10 border border-brand-pink/20 p-3.5 rounded-xl flex items-center gap-2 mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Form Step Slide Animations */}
          <div className="min-h-[340px] flex flex-col justify-center">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: direction * 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* STEP 1: CHOOSE OCCASION & RECIPIENT */}
                {currentStep === 1 && (
                  <div className="space-y-6 text-left">
                    <div>
                      <h3 className="font-heading font-extrabold text-white text-base">Let's create a beautiful surprise ❤️</h3>
                      <p className="text-[11px] text-brand-muted">First, tell us who this is for and select the occasion.</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-white">Who is this for?</label>
                      <OptimizedInput 
                        type="text" 
                        required
                        value={recipientName}
                        onValueChange={setRecipientName}
                        placeholder="e.g. Emma, Kabir, David"
                        className="w-full text-xs p-3 glass-input"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-white">What is the occasion?</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[
                          { id: 'Birthday', label: '🎂 Birthday', glow: 'hover:border-brand-purple/30' },
                          { id: 'Anniversary', label: '❤️ Anniversary', glow: 'hover:border-brand-pink/30' },
                          { id: 'Sorry', label: '🥺 Sorry', glow: 'hover:border-gray-500/30' },
                          { id: 'Friendship', label: '🎉 Friendship', glow: 'hover:border-brand-blue/30' },
                          { id: 'Love', label: '💕 Love', glow: 'hover:border-red-500/30' },
                          { id: 'Farewell', label: '👋 Farewell', glow: 'hover:border-indigo-500/30' },
                          { id: 'Custom', label: '✨ Custom', glow: 'hover:border-amber-500/30' },
                        ].map((item) => {
                          const active = occasion === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleOccasionChange(item.id)}
                              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${item.glow} ${
                                active 
                                  ? 'border-brand-purple bg-brand-purple/5 text-white' 
                                  : 'border-brand-border bg-brand-dark/30 text-brand-muted hover:text-white'
                              }`}
                            >
                              <span className="text-xs font-semibold">{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: PLAN SELECTION */}
                {currentStep === 2 && (
                  <div className="space-y-4 text-left">
                    <div>
                      <h3 className="font-heading font-extrabold text-white text-base">Choose how special you want to make it ❤️</h3>
                      <p className="text-[11px] text-brand-muted">Select a plan to unlock premium features. Pay once, own forever.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 select-none max-h-[380px] overflow-y-auto pr-1">
                      {[
                        { 
                          id: 'free', 
                          name: 'Free', 
                          price: '₹0', 
                          tagline: 'Simple heartfelt note',
                          features: ['2 Memory Photos', 'Dreamy theme', 'Standard URL', 'Heartly Watermark'],
                          color: 'border-white/40 bg-white/5 shadow-[0_0_15px_rgba(255,255,255,0.08)] ring-1 ring-white/10'
                        },
                        { 
                          id: 'basic', 
                          name: 'Basic', 
                          price: '₹39', 
                          tagline: 'Sleek custom surprise',
                          features: ['5 Memory Photos', 'Custom music preset', 'No Watermark', 'Custom URL'],
                          color: 'border-brand-pink bg-brand-pink/5 shadow-[0_0_15px_rgba(236,72,153,0.15)] ring-1 ring-brand-pink/20'
                        },
                        { 
                          id: 'premium', 
                          name: 'Premium ⭐', 
                          price: '₹79', 
                          tagline: 'The ideal emotional gift',
                          features: ['10 Memory Photos', 'Password passcode lock', 'Countdown Release timer', 'Runaway "No" button', 'Premium animations'],
                          color: 'border-brand-purple bg-brand-purple/5 shadow-[0_0_15px_rgba(168,85,247,0.15)] ring-1 ring-brand-purple/30',
                          recommended: true
                        },
                        { 
                          id: 'luxury', 
                          name: 'Luxury 💎', 
                          price: '₹149', 
                          tagline: 'For absolute perfection',
                          features: ['20 Memory Photos', 'Voice note upload', 'Midnight Unlock Schedule', 'Hidden secret ending', 'Priority load speeds'],
                          color: 'border-brand-blue bg-brand-blue/5 hover:border-brand-blue/20'
                        },
                       ].map((p) => {
                        const active = selectedPlan === p.id;
                        const isFreeLocked = p.id === 'free' && hasUsedFreePlan;
                        const displayPrice = isFreeLocked ? 'Consumed' : p.price;
                        return (
                          <div 
                            key={p.id}
                            onClick={() => {
                              if (isFreeLocked) {
                                showToast("You've already used your free surprise. Unlock more unforgettable moments with Premium.", "info");
                                return;
                              }
                              setSelectedPlan(p.id as any);
                            }}
                            className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between min-h-[160px] relative ${
                              isFreeLocked 
                                ? 'opacity-50 cursor-not-allowed border-brand-border bg-brand-dark/10'
                                : (active ? p.color : 'border-brand-border bg-brand-dark/30 hover:border-white/10')
                            }`}
                          >
                            {p.recommended && (
                              <span className="absolute -top-2 left-4 px-2 py-0.5 bg-gradient-to-r from-brand-purple to-brand-pink text-[8px] font-bold uppercase tracking-wider rounded-full text-white shadow-md">
                                Recommended ⭐
                              </span>
                            )}
                            {isFreeLocked && (
                              <span className="absolute top-2 right-2 p-1 bg-brand-pink/20 rounded-full border border-brand-pink/35 text-brand-pink">
                                <Lock className="w-3 h-3" />
                              </span>
                            )}
                            <div className="space-y-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="text-xs font-heading font-bold text-white">{p.name}</h4>
                                  <p className="text-[9px] text-brand-muted mt-0.5">{p.tagline}</p>
                                </div>
                                <span className={`text-xs font-heading font-extrabold text-glow ${isFreeLocked ? 'text-brand-pink' : 'text-white'}`}>{displayPrice}</span>
                              </div>
                              <hr className="border-brand-border/40" />
                              <ul className="space-y-1">
                                {p.features.map((f, fIdx) => (
                                  <li key={fIdx} className="text-[9px] text-brand-muted flex items-center gap-1">
                                    <span className="w-1 h-1 rounded-full bg-brand-purple shrink-0" />
                                    <span>{f}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Applied Credits Section */}
                    {selectedPlan === 'basic' && basicCredits > 0 && (
                      <div className="mt-4 p-4 rounded-2xl border border-brand-purple/35 bg-brand-purple/5 flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <h5 className="text-xs font-bold text-white flex items-center gap-1">
                            <Gift className="w-3.5 h-3.5 text-brand-purple" />
                            <span>Apply Basic Surprise Credit</span>
                          </h5>
                          <p className="text-[10px] text-brand-muted">You have <strong>{basicCredits}</strong> available free basic credits.</p>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={useCreditChecked}
                            onChange={(e) => setUseCreditChecked(e.target.checked)}
                            className="rounded border-brand-border bg-brand-dark/50 text-brand-purple focus:ring-0 w-4 h-4 cursor-pointer"
                          />
                          <span className="text-[10px] font-semibold text-white">Use Credit</span>
                        </label>
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 3: RECIPIENT DETAILS */}
                {currentStep === 3 && (
                  <div className="space-y-4 text-left">
                    <div>
                      <h3 className="font-heading font-extrabold text-white text-base">Tell us about them ❤️</h3>
                      <p className="text-[11px] text-brand-muted font-normal">Add relationship details to configure emotional vibes.</p>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-white">Relationship</label>
                        <select 
                          value={relationship}
                          onChange={(e) => setRelationship(e.target.value)}
                          className="w-full text-xs p-3 glass-input"
                        >
                          <option>Best Friend</option>
                          <option>Partner</option>
                          <option>Crush</option>
                          <option>Family</option>
                          <option>Other</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                          <span>What makes them special?</span>
                          <span className="text-[10px] text-brand-muted font-normal">(Optional)</span>
                        </label>
                        <OptimizedTextarea 
                          rows={3}
                          value={specialDetails}
                          onValueChange={setSpecialDetails}
                          placeholder="e.g. They make the best hot cocoa, their laugh lights up the room..."
                          className="w-full text-xs p-3 glass-input"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: MEMORIES UPLOAD */}
                {currentStep === 4 && (
                  <div className="space-y-4 text-left">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      multiple
                      style={{ display: 'none' }}
                    />
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-heading font-extrabold text-white text-base">Add beautiful memories ✨</h3>
                        <p className="text-[11px] text-brand-muted">Drop images of your best moments.</p>
                      </div>
                      <span className="text-[10px] font-bold text-brand-purple bg-brand-purple/10 border border-brand-purple/20 px-2.5 py-1 rounded-full">
                        {memories.length} / {PLAN_LIMITS[selectedPlan] || 10} photos
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                      {/* Drag & Drop container */}
                      <div 
                        onClick={handleAddMemory}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={async (e) => {
                          e.preventDefault();
                          setIsDragging(false);
                          const files = e.dataTransfer.files ? Array.from(e.dataTransfer.files) : [];
                          if (files.length > 0) {
                            await uploadImages(files);
                          }
                        }}
                        className={`p-8 rounded-2xl border-2 border-dashed transition-all text-center space-y-3 cursor-pointer group shrink-0 ${
                          isDragging 
                            ? 'border-brand-purple bg-brand-purple/10 scale-[1.02]' 
                            : 'border-brand-border bg-brand-dark/20 hover:bg-brand-purple/5 hover:border-brand-purple/35'
                        }`}
                      >
                        {isUploading ? (
                          <Loader2 className="w-8 h-8 text-brand-purple animate-spin mx-auto" />
                        ) : (
                          <Upload className="w-8 h-8 text-brand-muted group-hover:text-brand-purple group-hover:scale-105 transition-all mx-auto" />
                        )}
                        <div>
                          <p className="text-xs font-bold text-white">
                            {isUploading ? 'Uploading Images...' : 'Click or Drag Photos here'}
                          </p>
                          <p className="text-[9px] text-brand-muted mt-0.5">Supports JPG, PNG, WEBP, HEIC up to 5MB</p>
                        </div>
                      </div>

                      <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                        {/* Parallel Upload Progress Indicators */}
                        {Object.entries(uploadProgress).map(([fileName, progress]) => (
                          <div key={fileName} className="p-2.5 rounded-xl border border-brand-border bg-brand-dark/40 flex flex-col gap-2">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-white truncate max-w-[150px] font-semibold">{fileName}</span>
                              <span className="text-brand-purple font-mono font-bold">{progress}%</span>
                            </div>
                            <div className="w-full bg-brand-border/40 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-brand-purple to-brand-pink h-full transition-all duration-300" 
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        ))}

                        {memories.map((m, idx) => (
                          <div key={m.id} className="p-2.5 rounded-xl border border-brand-border bg-brand-dark/40 flex items-center gap-3 relative">
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-white/5 bg-brand-dark/20 animate-fade-in">
                              <Image 
                                src={m.imageUrl} 
                                alt="thumbnail" 
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center text-left space-y-1">
                              <span className="text-[8px] text-brand-purple/90 font-bold uppercase tracking-wider block select-none">
                                {getStorytellingLabel(idx)}
                              </span>
                              <OptimizedInput 
                                type="text"
                                placeholder="Add a sweet caption..."
                                value={m.caption === 'Click to customize caption...' ? '' : m.caption}
                                onValueChange={(val) => handleUpdateCaption(m.id, val)}
                                className="w-full text-[10px] p-2 glass-input placeholder:text-brand-muted/40 font-medium"
                              />
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button onClick={() => handleReorder(idx, 'up')} disabled={idx === 0} className="p-1 text-brand-muted hover:text-white disabled:opacity-30 cursor-pointer">▲</button>
                              <button onClick={() => handleReorder(idx, 'down')} disabled={idx === memories.length - 1} className="p-1 text-brand-muted hover:text-white disabled:opacity-30 cursor-pointer">▼</button>
                              <button onClick={() => handleDeleteMemory(m.id)} className="p-1 text-brand-muted hover:text-brand-pink cursor-pointer">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <p className="text-[10px] text-brand-pink font-semibold italic text-center animate-pulse pt-2">
                      “{microcopyText}”
                    </p>
                  </div>
                )}

                {/* STEP 5: WRITE LETTER */}
                {currentStep === 5 && (
                  <div className="space-y-4 text-left">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-heading font-extrabold text-white text-base">Write from the heart ❤️</h3>
                        <p className="text-[11px] text-brand-muted">Craft your custom letter message.</p>
                      </div>
                      <button 
                        onClick={() => setAiAssistantOpen(true)}
                        type="button"
                        className="text-[10px] font-bold text-brand-purple bg-brand-purple/10 border border-brand-purple/20 px-2.5 py-1 rounded-lg hover:bg-brand-purple/20 transition-all cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>Need Help Writing?</span>
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-white">Surprise Card Heading</label>
                        <OptimizedInput 
                           type="text" 
                           required
                           value={title}
                           onValueChange={setTitle}
                           placeholder="e.g. Happy Birthday Sophia! ❤️"
                           className="w-full text-xs p-3 glass-input"
                         />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-semibold text-white">Personal Letter Letter</label>
                          <span className={`text-[9px] font-mono ${message.length > (selectedPlan === 'free' ? 300 : 2000) ? 'text-brand-pink font-bold' : 'text-brand-muted'}`}>
                            {message.length} / {selectedPlan === 'free' ? 300 : 2000} characters
                          </span>
                        </div>
                        <OptimizedTextarea 
                           rows={4}
                           required
                           value={message}
                           onValueChange={setMessage}
                           maxChars={selectedPlan === 'free' ? 300 : 2000}
                           placeholder="Type something emotional, silly, or memorable here..."
                           className="w-full text-xs p-3 glass-input leading-relaxed font-sans"
                         />
                      </div>

                      {/* Smart message starters */}
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center gap-1.5 text-[10px] text-brand-purple font-bold">
                          <Sparkles className="w-3 h-3 text-brand-purple animate-pulse" />
                          <span>Smart Starters (Click to write)</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {getMessageStarters().map((starter, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => {
                                setMessage(starter);
                              }}
                              className="text-[10px] text-left px-3 py-1.5 rounded-xl border border-brand-border bg-brand-dark/30 text-white hover:bg-brand-purple/10 hover:border-brand-purple/30 transition-all duration-200 cursor-pointer"
                            >
                              {starter}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 6: CHOOSE MUSIC */}
                {currentStep === 6 && (() => {
                  const allTracks = musicTracks;
                  const filteredTracks = allTracks.filter((track) => {
                    const matchCategory = musicCategory === 'All' || track.category === musicCategory;
                    const matchLanguage = languageFilter === 'All' || track.language === languageFilter;
                    const query = searchQuery.trim().toLowerCase();
                    const matchSearch = !query || 
                      track.name.toLowerCase().includes(query) || 
                      track.category.toLowerCase().includes(query) || 
                      track.language.toLowerCase().includes(query) || 
                      track.artist.toLowerCase().includes(query);
                      
                    return matchCategory && matchLanguage && matchSearch;
                  });

                  const trendingTracks = allTracks.filter(t => t.isTrending && (languageFilter === 'All' || t.language === languageFilter));
                  const emotionalTracks = allTracks.filter(t => t.isMostEmotional && (languageFilter === 'All' || t.language === languageFilter));
                  const usedTracks = allTracks.filter(t => t.isMostUsed && (languageFilter === 'All' || t.language === languageFilter));

                  const showFeatured = musicCategory === 'All' && !searchQuery.trim();

                  return (
                    <div className="space-y-4 text-left">
                      <div>
                        <h3 className="font-heading font-extrabold text-white text-base">Choose the perfect vibe 🎶</h3>
                        <p className="text-[11px] text-brand-muted font-normal">Select background tunes or upload custom audio.</p>
                      </div>

                      {allTracks.length === 0 ? (
                        <div className="glass-panel py-12 px-6 text-center border border-brand-border/40 rounded-3xl select-none my-4">
                          <Music className="w-8 h-8 text-brand-muted/40 mx-auto mb-3" />
                          <h4 className="font-heading font-bold text-white text-xs sm:text-sm">No vibes available</h4>
                          <p className="text-xs text-brand-muted mt-1.5 leading-normal">
                            No songs uploaded yet. Upload your first track from the Music Library.
                          </p>
                        </div>
                      ) : (
                        <>
                          {/* Search Bar */}
                          <div className="relative">
                            <Search className="w-4 h-4 text-brand-muted absolute left-3 top-3" />
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder="Search music..."
                              className="w-full text-xs pl-9 pr-8 py-2.5 rounded-xl border border-brand-border bg-brand-dark/30 text-white placeholder-brand-muted focus:border-brand-purple/50 focus:ring-1 focus:ring-brand-purple/35 transition-all outline-none"
                            />
                            {searchQuery && (
                              <button 
                                type="button" 
                                onClick={() => setSearchQuery('')} 
                                className="absolute right-3 top-3 text-brand-muted hover:text-white cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Filters: Category & Language */}
                          <div className="flex flex-col gap-3 bg-brand-dark/20 p-3 rounded-xl border border-brand-border/40">
                            {/* Category Filter */}
                            <div className="space-y-1.5">
                              <span className="text-[9px] uppercase font-bold text-brand-muted tracking-wider">Vibe Playlist</span>
                              <div className="flex flex-wrap gap-1.5 select-none">
                                {['All', 'Birthday', 'Love', 'Anniversary', 'Proposal', 'Friendship', 'Sorry', 'Congratulations'].map((cat) => {
                                  const active = musicCategory === cat;
                                  return (
                                    <button
                                      key={cat}
                                      type="button"
                                      onClick={() => setMusicCategory(cat)}
                                      className={`px-3 py-1 rounded-full text-[9.5px] font-bold border whitespace-nowrap cursor-pointer transition-all duration-200 ${
                                        active 
                                          ? 'bg-brand-purple/15 border-brand-purple text-brand-purple shadow-[0_0_10px_rgba(168,85,247,0.15)]' 
                                          : 'bg-brand-dark/40 border-brand-border/80 text-brand-muted hover:text-white hover:border-brand-border/60'
                                      }`}
                                    >
                                      {cat === 'All' ? 'All Vibes 💖' : cat}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Language Filter */}
                            <div className="space-y-1.5 border-t border-brand-border/20 pt-2.5">
                              <span className="text-[9px] uppercase font-bold text-brand-muted tracking-wider">Language</span>
                              <div className="flex flex-wrap gap-1.5 select-none">
                                {['All', 'Hindi', 'English'].map((lang) => {
                                  const active = languageFilter === lang;
                                  return (
                                    <button
                                      key={lang}
                                      type="button"
                                      onClick={() => setLanguageFilter(lang)}
                                      className={`px-3 py-1 rounded-full text-[9.5px] font-bold border whitespace-nowrap cursor-pointer transition-all duration-200 ${
                                        active 
                                          ? 'bg-brand-pink/15 border-brand-pink text-brand-pink shadow-[0_0_10px_rgba(244,63,94,0.15)]' 
                                          : 'bg-brand-dark/40 border-brand-border/80 text-brand-muted hover:text-white hover:border-brand-border/60'
                                      }`}
                                    >
                                      {lang}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          {/* Featured Sections (Trending, Emotional, Most Used) */}
                          {showFeatured && (
                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                              {/* Trending Songs */}
                              {trendingTracks.length > 0 && (
                                <div>
                                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-white mb-2 pt-0.5">
                                    <span>🔥 Trending Songs</span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 select-none pb-2">
                                    {trendingTracks.map((track) => {
                                      const selected = musicTrack === track.id;
                                      const isCurrentPlaying = isPlayingAudio && musicTrack === track.id;
                                      return (
                                        <div
                                          key={track.id}
                                          onClick={() => setMusicTrack(track.id)}
                                          className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition-all duration-300 relative ${
                                            selected
                                              ? 'border-brand-purple bg-brand-purple/5 shadow-[0_0_15px_rgba(168,85,247,0.15)] text-white'
                                              : 'border-brand-border bg-brand-dark/40 text-brand-muted hover:text-white hover:border-brand-border/60'
                                          }`}
                                        >
                                          <div className="space-y-1">
                                            <div className="flex items-center justify-between gap-1">
                                              <span className="text-[7.5px] px-1 py-0.2 rounded font-extrabold uppercase bg-brand-purple/10 text-brand-purple shrink-0 truncate max-w-[65px]">
                                                {track.category}
                                              </span>
                                              <span className="text-[7.5px] px-1 py-0.2 rounded font-extrabold uppercase bg-brand-pink/10 text-brand-pink shrink-0 truncate max-w-[65px]">
                                                {track.language}
                                              </span>
                                            </div>
                                            <h4 className="text-[10px] font-bold text-white leading-tight truncate mt-1.5" title={track.name}>
                                              {track.name}
                                            </h4>
                                            <p className="text-[8px] text-brand-muted truncate leading-normal">
                                              {track.artist}
                                            </p>
                                          </div>
                                          
                                          <div className="flex items-center justify-between mt-3 pt-1.5 border-t border-brand-border/20">
                                            <span className="text-[8.5px] text-brand-muted flex items-center gap-0.5 font-medium shrink-0">
                                              <Clock className="w-2.5 h-2.5" />
                                              {track.duration}
                                            </span>
                                            
                                            <div className="flex items-center gap-1">
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (musicTrack === track.id) {
                                                    setIsPlayingAudio(!isPlayingAudio);
                                                  } else {
                                                    setMusicTrack(track.id);
                                                    setIsPlayingAudio(true);
                                                  }
                                                }}
                                                className="w-7 h-7 rounded-full bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center text-brand-purple shrink-0 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                              >
                                                {isCurrentPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                                              </button>
                                              
                                              {selected && (
                                                <div className="w-4.5 h-4.5 rounded-full bg-brand-purple flex items-center justify-center text-white shadow-[0_0_8px_rgba(168,85,247,0.4)] shrink-0">
                                                  <Check className="w-2.5 h-2.5" />
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Most Emotional */}
                              {emotionalTracks.length > 0 && (
                                <div>
                                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-white mb-2 pt-0.5">
                                    <span>❤️ Most Emotional</span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 select-none pb-2">
                                    {emotionalTracks.map((track) => {
                                      const selected = musicTrack === track.id;
                                      const isCurrentPlaying = isPlayingAudio && musicTrack === track.id;
                                      return (
                                        <div
                                          key={track.id}
                                          onClick={() => setMusicTrack(track.id)}
                                          className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition-all duration-300 relative ${
                                            selected
                                              ? 'border-brand-purple bg-brand-purple/5 shadow-[0_0_15px_rgba(168,85,247,0.15)] text-white'
                                              : 'border-brand-border bg-brand-dark/40 text-brand-muted hover:text-white hover:border-brand-border/60'
                                          }`}
                                        >
                                          <div className="space-y-1">
                                            <div className="flex items-center justify-between gap-1">
                                              <span className="text-[7.5px] px-1 py-0.2 rounded font-extrabold uppercase bg-brand-purple/10 text-brand-purple shrink-0 truncate max-w-[65px]">
                                                {track.category}
                                              </span>
                                              <span className="text-[7.5px] px-1 py-0.2 rounded font-extrabold uppercase bg-brand-pink/10 text-brand-pink shrink-0 truncate max-w-[65px]">
                                                {track.language}
                                              </span>
                                            </div>
                                            <h4 className="text-[10px] font-bold text-white leading-tight truncate mt-1.5" title={track.name}>
                                              {track.name}
                                            </h4>
                                            <p className="text-[8px] text-brand-muted truncate leading-normal">
                                              {track.artist}
                                            </p>
                                          </div>
                                          
                                          <div className="flex items-center justify-between mt-3 pt-1.5 border-t border-brand-border/20">
                                            <span className="text-[8.5px] text-brand-muted flex items-center gap-0.5 font-medium shrink-0">
                                              <Clock className="w-2.5 h-2.5" />
                                              {track.duration}
                                            </span>
                                            
                                            <div className="flex items-center gap-1">
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (musicTrack === track.id) {
                                                    setIsPlayingAudio(!isPlayingAudio);
                                                  } else {
                                                    setMusicTrack(track.id);
                                                    setIsPlayingAudio(true);
                                                  }
                                                }}
                                                className="w-7 h-7 rounded-full bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center text-brand-purple shrink-0 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                              >
                                                {isCurrentPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                                              </button>
                                              
                                              {selected && (
                                                <div className="w-4.5 h-4.5 rounded-full bg-brand-purple flex items-center justify-center text-white shadow-[0_0_8px_rgba(168,85,247,0.4)] shrink-0">
                                                  <Check className="w-2.5 h-2.5" />
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Most Used By Heartly Users */}
                              {usedTracks.length > 0 && (
                                <div>
                                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-white mb-2 pt-0.5">
                                    <span>📈 Most Used By Heartly Users</span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 select-none pb-2">
                                    {usedTracks.map((track) => {
                                      const selected = musicTrack === track.id;
                                      const isCurrentPlaying = isPlayingAudio && musicTrack === track.id;
                                      return (
                                        <div
                                          key={track.id}
                                          onClick={() => setMusicTrack(track.id)}
                                          className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition-all duration-300 relative ${
                                            selected
                                              ? 'border-brand-purple bg-brand-purple/5 shadow-[0_0_15px_rgba(168,85,247,0.15)] text-white'
                                              : 'border-brand-border bg-brand-dark/40 text-brand-muted hover:text-white hover:border-brand-border/60'
                                          }`}
                                        >
                                          <div className="space-y-1">
                                            <div className="flex items-center justify-between gap-1">
                                              <span className="text-[7.5px] px-1 py-0.2 rounded font-extrabold uppercase bg-brand-purple/10 text-brand-purple shrink-0 truncate max-w-[65px]">
                                                {track.category}
                                              </span>
                                              <span className="text-[7.5px] px-1 py-0.2 rounded font-extrabold uppercase bg-brand-pink/10 text-brand-pink shrink-0 truncate max-w-[65px]">
                                                {track.language}
                                              </span>
                                            </div>
                                            <h4 className="text-[10px] font-bold text-white leading-tight truncate mt-1.5" title={track.name}>
                                              {track.name}
                                            </h4>
                                            <p className="text-[8px] text-brand-muted truncate leading-normal">
                                              {track.artist}
                                            </p>
                                          </div>
                                          
                                          <div className="flex items-center justify-between mt-3 pt-1.5 border-t border-brand-border/20">
                                            <span className="text-[8.5px] text-brand-muted flex items-center gap-0.5 font-medium shrink-0">
                                              <Clock className="w-2.5 h-2.5" />
                                              {track.duration}
                                            </span>
                                            
                                            <div className="flex items-center gap-1">
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (musicTrack === track.id) {
                                                    setIsPlayingAudio(!isPlayingAudio);
                                                  } else {
                                                    setMusicTrack(track.id);
                                                    setIsPlayingAudio(true);
                                                  }
                                                }}
                                                className="w-7 h-7 rounded-full bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center text-brand-purple shrink-0 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                              >
                                                {isCurrentPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                                              </button>
                                              
                                              {selected && (
                                                <div className="w-4.5 h-4.5 rounded-full bg-brand-purple flex items-center justify-center text-white shadow-[0_0_8px_rgba(168,85,247,0.4)] shrink-0">
                                                  <Check className="w-2.5 h-2.5" />
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Main Scrollable Filtered Tracks Grid */}
                          <div className="space-y-2">
                            <span className="text-[10px] uppercase font-bold text-brand-muted tracking-wider">
                              {showFeatured ? 'All Vibes Playlist' : 'Search Results'}
                            </span>
                            
                            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 scrollbar-thin">
                              {filteredTracks.map((track) => {
                                const selected = musicTrack === track.id;
                                const isCurrentPlaying = isPlayingAudio && musicTrack === track.id;
                                return (
                                  <div 
                                    key={track.id}
                                    onClick={() => setMusicTrack(track.id)}
                                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all duration-300 ${
                                      selected
                                        ? 'border-brand-purple bg-brand-purple/5 shadow-[0_0_15px_rgba(168,85,247,0.15)] text-white'
                                        : 'border-brand-border bg-brand-dark/40 text-brand-muted hover:text-white hover:border-brand-border/60'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (musicTrack === track.id) {
                                            setIsPlayingAudio(!isPlayingAudio);
                                          } else {
                                            setMusicTrack(track.id);
                                            setIsPlayingAudio(true);
                                          }
                                        }}
                                        className="w-7 h-7 rounded-full bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center text-brand-purple shrink-0 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                      >
                                        {isCurrentPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                                      </button>
                                      
                                      <div className="min-w-0">
                                        <h4 className="text-xs font-bold text-white truncate leading-snug">{track.name}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                          <span className="text-[7.5px] px-1 py-0.2 rounded font-extrabold uppercase bg-brand-purple/10 text-brand-purple">
                                            {track.category}
                                          </span>
                                          <span className="text-[7.5px] px-1 py-0.2 rounded font-extrabold uppercase bg-brand-pink/10 text-brand-pink">
                                            {track.language}
                                          </span>
                                          <span className="text-[8.5px] text-brand-muted flex items-center gap-0.5 ml-1">
                                            <Clock className="w-2.5 h-2.5 shrink-0" />
                                            {track.duration}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2.5 shrink-0 pl-2">
                                      {selected ? (
                                        <div className="w-5 h-5 rounded-full bg-brand-purple flex items-center justify-center text-white shadow-[0_0_8px_rgba(168,85,247,0.35)]">
                                          <Check className="w-3 h-3" />
                                        </div>
                                      ) : (
                                        <span className="text-[9px] uppercase font-bold text-brand-purple hover:underline transition-all">Select</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}

                              {filteredTracks.length === 0 && (
                                <div className="p-8 text-center bg-brand-dark/20 rounded-xl border border-brand-border">
                                  <p className="text-xs text-brand-muted">No songs matched your search criteria 💔</p>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSearchQuery('');
                                      setMusicCategory('All');
                                      setLanguageFilter('All');
                                    }}
                                    className="mt-2 text-[10px] font-bold text-brand-purple hover:underline cursor-pointer"
                                  >
                                    Reset filters
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}

                      {/* Custom Music Upload */}
                      <div className="p-4 rounded-xl border border-brand-border bg-brand-dark/40 flex items-center justify-between text-xs text-brand-muted">
                        <input
                          type="file"
                          ref={musicInputRef}
                          onChange={handleMusicUpload}
                          accept="audio/mp3,audio/wav,audio/m4a,audio/x-m4a"
                          style={{ display: 'none' }}
                        />
                        <span className="flex items-center gap-1.5">
                          <span>
                            {musicTrack.startsWith('http') 
                              ? `Custom Song Uploaded 🎵` 
                              : 'Have your own song? (.mp3, .wav, .m4a)'}
                          </span>
                          {selectedPlan === 'free' && <Lock className="w-3.5 h-3.5 text-brand-muted" />}
                        </span>
                        {selectedPlan === 'free' ? (
                          <button 
                            type="button"
                            onClick={() => setCurrentStep(2)}
                            className="text-[10px] font-bold text-brand-purple hover:underline cursor-pointer flex items-center gap-1 bg-brand-purple/5 px-2.5 py-1 rounded-full border border-brand-purple/20 hover:bg-brand-purple/15 transition-all"
                          >
                            <Sparkles className="w-3 h-3 text-brand-purple animate-pulse" />
                            <span>Want custom music? Upgrade for ₹39 ✨</span>
                          </button>
                        ) : (
                          <button 
                            type="button"
                            onClick={triggerMusicInput}
                            disabled={isUploading}
                            className="text-[10px] font-bold text-brand-purple hover:underline cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
                          >
                            {isUploading ? 'Uploading...' : (
                              <>
                                {musicTrack.startsWith('http') ? 'Change File' : 'Upload Custom File'}
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {musicTrack.startsWith('http') && (
                        <div className="p-4 rounded-2xl border border-brand-purple/30 bg-brand-purple/5 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <button 
                              type="button"
                              onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                              className="w-10 h-10 rounded-full bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center text-brand-purple shrink-0 cursor-pointer animate-pulse"
                            >
                              {isPlayingAudio ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                            </button>
                            <div>
                              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                                <span>Custom Audio Track</span>
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                              </h4>
                              <p className="text-[9px] text-brand-muted mt-0.5">Uploaded memory music</p>
                            </div>
                          </div>
                          
                          {isPlayingAudio && (
                            <div className="flex items-center gap-0.5 h-3 shrink-0">
                              {[1, 2, 3, 4, 5].map((i) => (
                                <div 
                                  key={i} 
                                  className="w-0.5 bg-brand-purple rounded-full animate-bounce" 
                                  style={{ 
                                    height: '100%', 
                                    animationDelay: `${i * 0.1}s`,
                                    animationDuration: `${0.5 + Math.random() * 0.5}s`
                                  }} 
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* STEP 7: CHOOSE THEME */}
                {currentStep === 7 && (
                  <div className="space-y-4 text-left">
                    <div>
                      <h3 className="font-heading font-extrabold text-white text-base">Pick a vibe for your surprise ✨</h3>
                      <p className="text-[11px] text-brand-muted">Select layout theme skins.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'dreamy', name: 'Premium Dark', desc: 'Matte blacks and glowing purples', locked: false },
                        { id: 'midnight', name: 'Midnight Glow', desc: 'Cosmic deep indigos', locked: selectedPlan === 'free' },
                        { id: 'sunset', name: 'Sunset Warmth', desc: 'Romantic oranges and red fades', locked: selectedPlan === 'free' },
                        { id: 'nordic', name: 'Minimal Emotional', desc: 'Clean, simple and cold tones', locked: selectedPlan === 'free' },
                      ].map((thm) => {
                        const active = vibeTheme === thm.id;
                        return (
                          <div 
                            key={thm.id}
                            onClick={() => {
                              if (thm.locked) {
                                setCurrentStep(2);
                                return;
                              }
                              setVibeTheme(thm.id as any);
                            }}
                            className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between text-left min-h-[90px] relative ${
                              active ? 'border-brand-purple bg-brand-purple/5' : 'border-brand-border bg-brand-dark/30'
                            }`}
                          >
                            {active && (
                              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-brand-purple rounded-full animate-ping" />
                            )}
                            <div className="flex justify-between items-start">
                              <h4 className="text-xs font-bold text-white">{thm.name}</h4>
                              {thm.locked && <Lock className="w-3.5 h-3.5 text-brand-muted shrink-0" />}
                            </div>
                            <p className="text-[10px] text-brand-muted mt-2">{thm.desc}</p>
                            {thm.locked && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentStep(2);
                                }}
                                className="text-[9px] font-bold text-brand-purple hover:underline mt-1 block text-left flex items-center gap-1"
                              >
                                <Sparkles className="w-2.5 h-2.5 text-brand-purple animate-pulse" />
                                <span>Want premium themes? Upgrade for ₹39 ✨</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                                     {/* STEP 8: SPECIAL EFFECTS */}
                {currentStep === 8 && (
                  <div className="space-y-4 text-left max-h-[380px] overflow-y-auto pr-1 text-xs font-sans">
                    <div>
                      <h3 className="font-heading font-extrabold text-white text-base">Add a little magic ✨</h3>
                      <p className="text-[11px] text-brand-muted font-normal">Include locks, counts, or customized integrations.</p>
                    </div>

                    <div className="space-y-3">
                      {/* Password lock */}
                      <div className="p-3.5 rounded-xl border border-brand-border bg-brand-dark/40 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>Password protection lock</span>
                            {(selectedPlan === 'free' || selectedPlan === 'basic') && <Lock className="w-3.5 h-3.5 text-brand-muted" />}
                          </h4>
                          <p className="text-[10px] text-brand-muted font-normal">Require passcode keys to open surprise link.</p>
                          {(selectedPlan === 'free' || selectedPlan === 'basic') && (
                            <p className="text-[9px] text-brand-purple font-semibold">Want passcode protection? Upgrade to Premium for ₹79 ✨</p>
                          )}
                        </div>
                        {(selectedPlan === 'free' || selectedPlan === 'basic') ? (
                          <button
                            type="button"
                            onClick={() => setCurrentStep(2)}
                            className="px-2.5 py-1 rounded bg-brand-purple/10 border border-brand-purple/20 text-[9px] font-bold text-brand-purple hover:bg-brand-purple/20 transition-all cursor-pointer flex items-center gap-1 shrink-0"
                          >
                            <Sparkles className="w-2.5 h-2.5 text-brand-purple animate-pulse" />
                            <span>Upgrade for ₹79 ✨</span>
                          </button>
                        ) : (
                          <input 
                            type="checkbox" 
                            checked={isPasswordEnabled}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setIsPasswordEnabled(checked);
                              if (checked && !passwordLock) {
                                setPasswordLock('1234');
                              }
                            }}
                            className="rounded border-brand-border bg-brand-dark/50 text-brand-purple focus:ring-0 cursor-pointer"
                          />
                        )}
                      </div>
                      
                      {isPasswordEnabled && (
                        <div className="space-y-1.5 animate-fade-in">
                          <label className="text-[10px] text-brand-muted font-semibold block">Password Lock Passcode</label>
                          <div className="relative">
                            <OptimizedInput 
                              type={showPassword ? "text" : "password"} 
                              value={passwordLock}
                              onValueChange={setPasswordLock}
                              placeholder="Enter password"
                              className="w-full text-xs p-3 pr-10 glass-input font-mono tracking-widest"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-white transition-colors cursor-pointer"
                            >
                              {showPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Countdown release */}
                      <div className="p-3.5 rounded-xl border border-brand-border bg-brand-dark/40 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>Countdown Release clock</span>
                            {(selectedPlan === 'free' || selectedPlan === 'basic') && <Lock className="w-3.5 h-3.5 text-brand-muted" />}
                          </h4>
                          <p className="text-[10px] text-brand-muted font-normal">Show a live counter timer screen before opening.</p>
                          {(selectedPlan === 'free' || selectedPlan === 'basic') && (
                            <p className="text-[9px] text-brand-purple font-semibold">Want a countdown timer? Upgrade to Premium for ₹79 ✨</p>
                          )}
                        </div>
                        {(selectedPlan === 'free' || selectedPlan === 'basic') ? (
                          <button
                            type="button"
                            onClick={() => setCurrentStep(2)}
                            className="px-2.5 py-1 rounded bg-brand-purple/10 border border-brand-purple/20 text-[9px] font-bold text-brand-purple hover:bg-brand-purple/20 transition-all cursor-pointer flex items-center gap-1 shrink-0"
                          >
                            <Sparkles className="w-2.5 h-2.5 text-brand-purple animate-pulse" />
                            <span>Upgrade for ₹79 ✨</span>
                          </button>
                        ) : (
                          <input 
                            type="checkbox" 
                            checked={countdownEnabled}
                            onChange={(e) => setCountdownEnabled(e.target.checked)}
                            className="rounded border-brand-border bg-brand-dark/50 text-brand-purple focus:ring-0 cursor-pointer"
                          />
                        )}
                      </div>

                      {countdownEnabled && (
                        <div className="p-3.5 rounded-xl border border-brand-border/40 bg-brand-dark/30 space-y-3 text-left">
                          <label className="text-[10px] uppercase font-bold text-brand-muted tracking-wider block">
                            Countdown Duration
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { label: '30 seconds', value: 30 },
                              { label: '1 minute', value: 60 },
                              { label: '2 minutes', value: 120 },
                              { label: '5 minutes', value: 300 },
                              { label: '10 minutes', value: 600 }
                            ].map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => setCountdownDuration(opt.value)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold border transition-all cursor-pointer ${
                                  countdownDuration === opt.value
                                    ? 'bg-brand-purple/20 border-brand-purple text-white shadow-[0_0_10px_rgba(168,85,247,0.15)]'
                                    : 'bg-brand-dark/50 border-brand-border/80 text-brand-muted hover:text-white'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                const presets = [30, 60, 120, 300, 600];
                                if (presets.includes(countdownDuration)) {
                                  setCountdownDuration(180); // Default custom to 3m
                                }
                              }}
                              className={`px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold border transition-all cursor-pointer ${
                                ![30, 60, 120, 300, 600].includes(countdownDuration)
                                  ? 'bg-brand-purple/20 border-brand-purple text-white shadow-[0_0_10px_rgba(168,85,247,0.15)]'
                                  : 'bg-brand-dark/50 border-brand-border/80 text-brand-muted hover:text-white'
                              }`}
                            >
                              Custom
                            </button>
                          </div>

                          {![30, 60, 120, 300, 600].includes(countdownDuration) && (
                            <div className="space-y-1">
                              <input 
                                type="number" 
                                min={1}
                                value={countdownDuration}
                                onChange={(e) => setCountdownDuration(Math.max(1, parseInt(e.target.value) || 0))}
                                placeholder="Enter custom duration in seconds"
                                className="w-full text-xs p-3 glass-input"
                              />
                              <p className="text-[9px] text-brand-muted">Specify the countdown duration in seconds.</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Cute runaway button */}
                      <div className="p-3.5 rounded-xl border border-brand-border bg-brand-dark/40 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>Interactive Cute No Button</span>
                            {(selectedPlan === 'free' || selectedPlan === 'basic') && <Lock className="w-3.5 h-3.5 text-brand-muted" />}
                          </h4>
                          <p className="text-[10px] text-brand-muted font-normal">Make the No button runaway and play funny responses.</p>
                          {(selectedPlan === 'free' || selectedPlan === 'basic') && (
                            <p className="text-[9px] text-brand-purple font-semibold">Want a cute runaway No button? Upgrade to Premium for ₹79 ✨</p>
                          )}
                        </div>
                        {(selectedPlan === 'free' || selectedPlan === 'basic') ? (
                          <button
                            type="button"
                            onClick={() => setCurrentStep(2)}
                            className="px-2.5 py-1 rounded bg-brand-purple/10 border border-brand-purple/20 text-[9px] font-bold text-brand-purple hover:bg-brand-purple/20 transition-all cursor-pointer flex items-center gap-1 shrink-0"
                          >
                            <Sparkles className="w-2.5 h-2.5 text-brand-purple animate-pulse" />
                            <span>Upgrade for ₹79 ✨</span>
                          </button>
                        ) : (
                          <input 
                            type="checkbox" 
                            checked={noRunawayInteraction}
                            onChange={(e) => setNoRunawayInteraction(e.target.checked)}
                            className="rounded border-brand-border bg-brand-dark/50 text-brand-purple focus:ring-0 cursor-pointer"
                          />
                        )}
                      </div>

                      {/* Midnight Unlock */}
                      <div className="p-3.5 rounded-xl border border-brand-border bg-brand-dark/40 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>Midnight Unlock</span>
                            {selectedPlan !== 'luxury' && <Lock className="w-3.5 h-3.5 text-brand-muted" />}
                          </h4>
                          <p className="text-[10px] text-brand-muted font-normal">Automatically unlocks page at midnight on the release date.</p>
                          {selectedPlan !== 'luxury' && (
                            <p className="text-[9px] text-brand-purple font-semibold">Want midnight release? Upgrade to Luxury for ₹149 ✨</p>
                          )}
                        </div>
                        {selectedPlan !== 'luxury' ? (
                          <button
                            type="button"
                            onClick={() => setCurrentStep(2)}
                            className="px-2.5 py-1 rounded bg-brand-purple/10 border border-brand-purple/20 text-[9px] font-bold text-brand-purple hover:bg-brand-purple/20 transition-all cursor-pointer flex items-center gap-1 shrink-0"
                          >
                            <Sparkles className="w-2.5 h-2.5 text-brand-purple animate-pulse" />
                            <span>Upgrade for ₹149 ✨</span>
                          </button>
                        ) : (
                          <input 
                            type="checkbox" 
                            checked={midnightUnlock}
                            onChange={(e) => setMidnightUnlock(e.target.checked)}
                            className="rounded border-brand-border bg-brand-dark/50 text-brand-purple focus:ring-0 cursor-pointer"
                          />
                        )}
                      </div>

                      {/* Custom URL Slug */}
                      <div className="p-3.5 rounded-xl border border-brand-border bg-brand-dark/40 flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <div className="space-y-0.5">
                            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span>Custom URL Slug</span>
                              {selectedPlan !== 'luxury' && <Lock className="w-3.5 h-3.5 text-brand-muted" />}
                            </h4>
                            <p className="text-[10px] text-brand-muted font-normal">Choose your own unique URL slug link.</p>
                            {selectedPlan !== 'luxury' && (
                              <p className="text-[9px] text-brand-purple font-semibold">Want a custom URL slug? Upgrade to Luxury for ₹149 ✨</p>
                            )}
                          </div>
                          {selectedPlan !== 'luxury' && (
                            <button
                              type="button"
                              onClick={() => setCurrentStep(2)}
                              className="px-2.5 py-1 rounded bg-brand-purple/10 border border-brand-purple/20 text-[9px] font-bold text-brand-purple hover:bg-brand-purple/20 transition-all cursor-pointer flex items-center gap-1 shrink-0"
                            >
                              <Sparkles className="w-2.5 h-2.5 text-brand-purple animate-pulse" />
                              <span>Upgrade for ₹149 ✨</span>
                            </button>
                          )}
                        </div>
                        {selectedPlan === 'luxury' && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-brand-muted font-mono">{typeof window !== 'undefined' ? window.location.origin : 'heartly.in'}/s/</span>
                            <OptimizedInput
                              type="text"
                              value={customUrl}
                              onValueChange={(val) => {
                                const clean = val.toLowerCase().replace(/[^a-z0-9-]/g, '');
                                setCustomUrl(clean);
                              }}
                              placeholder="e.g. emma-and-kabir"
                              className="flex-1 text-xs p-2.5 glass-input font-mono"
                            />
                          </div>
                        )}
                      </div>



                      {/* One Last Surprise (₹149 Luxury Flagship Feature) */}
                      <div className="p-4 rounded-xl border border-brand-border bg-brand-dark/40 flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                          <div className="space-y-0.5">
                            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-brand-pink" />
                              <span>One Last Surprise</span>
                              {selectedPlan !== 'luxury' && <Lock className="w-3.5 h-3.5 text-brand-muted" />}
                            </h4>
                            <p className="text-[10px] text-brand-muted font-normal">Receiver completes surprise, sees "The End", fades to black, and then experiences a bespoke emotional reveal.</p>
                            {selectedPlan !== 'luxury' && (
                              <p className="text-[9px] text-brand-purple font-semibold">Flagship luxury feature. Upgrade to Luxury for ₹149 ✨</p>
                            )}
                          </div>
                          {selectedPlan !== 'luxury' ? (
                            <button
                              type="button"
                              onClick={() => setCurrentStep(2)}
                              className="px-2.5 py-1 rounded bg-brand-purple/10 border border-brand-purple/20 text-[9px] font-bold text-brand-purple hover:bg-brand-purple/20 transition-all cursor-pointer flex items-center gap-1 shrink-0"
                            >
                              <Sparkles className="w-2.5 h-2.5 text-brand-purple animate-pulse" />
                              <span>Upgrade for ₹149 ✨</span>
                            </button>
                          ) : (
                            <label className="relative inline-flex items-center cursor-pointer select-none">
                              <input 
                                type="checkbox" 
                                checked={olsEnabled} 
                                onChange={(e) => setOlsEnabled(e.target.checked)} 
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-brand-dark border border-brand-border rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-brand-muted after:border-brand-border after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-brand-purple peer-checked:after:bg-white peer-checked:after:border-brand-purple" />
                            </label>
                          )}
                        </div>

                        {selectedPlan === 'luxury' && olsEnabled && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="space-y-4 pt-2 border-t border-brand-border/60"
                          >
                            {/* 1. Final Message */}
                            <div className="space-y-2 text-left">
                              <label className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">1. Final Message</label>
                              <OptimizedInput 
                                type="text"
                                value={olsMessage}
                                onValueChange={setOlsMessage}
                                placeholder="e.g. I Love You Forever ❤️"
                                className="w-full text-xs"
                                maxLength={80}
                              />
                              {/* Quick Select Preset Chips */}
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {[
                                  'Happy Birthday Again 🎂',
                                  'I Love You Forever ❤️',
                                  'Will You Marry Me? 💍',
                                  'Thank You For Everything ✨',
                                  'Please Forgive Me 🥺',
                                  'Still My Favorite Person 🥂'
                                ].map((preset) => (
                                  <button
                                    key={preset}
                                    type="button"
                                    onClick={() => setOlsMessage(preset)}
                                    className="px-2 py-1 rounded bg-brand-dark/60 border border-brand-border text-[9px] text-brand-muted hover:text-white transition-all cursor-pointer"
                                  >
                                    {preset}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* 2. Reveal Style */}
                            <div className="space-y-2 text-left">
                              <label className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">2. Reveal Style</label>
                              <div className="grid grid-cols-2 gap-1.5">
                                {[
                                  { id: 'auto', label: '✨ Auto (Occasion Based)' },
                                  { id: 'hearts', label: '❤️ Hearts Build Text' },
                                  { id: 'sparkles', label: '💫 Sparkles Write Text' },
                                  { id: 'fireworks', label: '🎉 Fireworks Reveal' },
                                  { id: 'balloons', label: '🎈 Balloon Reveal' },
                                  { id: 'ring', label: '💍 Ring Reveal' },
                                  { id: 'timeline', label: '📅 Timeline Reveal' },
                                  { id: 'typewriter', label: '🎬 Typewriter Cinematic' }
                                ].map((styleOption) => (
                                  <button
                                    key={styleOption.id}
                                    type="button"
                                    onClick={() => setOlsStyle(styleOption.id)}
                                    className={`px-2.5 py-2 rounded-lg border text-left text-[10px] font-semibold transition-all cursor-pointer ${
                                      olsStyle === styleOption.id 
                                        ? 'border-brand-purple bg-brand-purple/5 text-white' 
                                        : 'border-brand-border bg-brand-dark/20 text-brand-muted hover:text-white'
                                    }`}
                                  >
                                    {styleOption.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* 3. Final Background Music */}
                            <div className="space-y-2 text-left">
                              <label className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">3. Final Background Music (Optional)</label>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => setOlsMusicUrl('')}
                                  className={`flex-1 py-2 rounded-lg border text-center text-[10px] font-semibold transition-all cursor-pointer ${
                                    !olsMusicUrl 
                                      ? 'border-brand-purple bg-brand-purple/5 text-white' 
                                      : 'border-brand-border bg-brand-dark/20 text-brand-muted hover:text-white'
                                  }`}
                                >
                                  Use main surprise music
                                </button>
                                <button
                                  type="button"
                                  onClick={() => olsMusicInputRef.current?.click()}
                                  className={`flex-1 py-2 rounded-lg border text-center text-[10px] font-semibold transition-all cursor-pointer ${
                                    olsMusicUrl 
                                      ? 'border-brand-purple bg-brand-purple/5 text-white' 
                                      : 'border-brand-border bg-brand-dark/20 text-brand-muted hover:text-white'
                                  }`}
                                >
                                  {olsMusicUrl ? 'Custom Music Active 🎵' : 'Upload custom music'}
                                </button>
                              </div>
                              <input 
                                type="file"
                                ref={olsMusicInputRef}
                                accept="audio/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) uploadOlsMusic(file);
                                }}
                                className="hidden"
                              />
                              {olsMusicUrl && (
                                <div className="text-[9px] text-brand-purple flex items-center justify-between bg-brand-purple/5 border border-brand-purple/10 px-2 py-1.5 rounded">
                                  <span className="truncate">Active: {olsMusicUrl.split('/').pop()}</span>
                                  <button type="button" onClick={() => setOlsMusicUrl('')} className="text-brand-pink font-bold hover:underline shrink-0">Remove</button>
                                </div>
                              )}
                            </div>

                            {/* 4. Final Voice Note */}
                            <div className="space-y-2 text-left">
                              <label className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">4. Final Voice Note (Optional)</label>
                              <input 
                                type="file"
                                ref={olsVoiceInputRef}
                                accept="audio/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) uploadOlsVoiceNote(file);
                                }}
                                className="hidden"
                              />
                              {!olsVoiceNoteUrl ? (
                                <button
                                  type="button"
                                  onClick={() => olsVoiceInputRef.current?.click()}
                                  className="w-full py-2 rounded-lg border border-dashed border-brand-border bg-brand-dark/20 text-center text-[10px] text-brand-muted hover:text-white transition-all cursor-pointer"
                                >
                                  🎤 Upload Final Voice Note
                                </button>
                              ) : (
                                <div className="p-2.5 rounded-xl border border-brand-border bg-brand-dark/40 flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Volume2 className="w-4 h-4 text-brand-purple animate-pulse" />
                                    <div className="min-w-0 text-left">
                                      <p className="text-[10px] font-bold text-white truncate">Final Voice Note Active 🎤</p>
                                      <p className="text-[8px] text-brand-muted truncate mt-0.5">{olsVoiceNoteUrl.split('/').pop()}</p>
                                    </div>
                                  </div>
                                  <button 
                                    type="button"
                                    onClick={() => setOlsVoiceNoteUrl('')}
                                    className="p-1 rounded bg-brand-pink/10 border border-brand-pink/20 text-brand-pink hover:bg-brand-pink/20 transition-all cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* 5. Final Photo/Video */}
                            <div className="space-y-2 text-left">
                              <label className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">5. Final Photo/Video (Optional)</label>
                              <input 
                                type="file"
                                ref={hiddenEndingInputRef}
                                accept="image/*,video/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) uploadHiddenEnding(file);
                                }}
                                className="hidden"
                              />
                              
                              {!hiddenEndingUrl ? (
                                <button
                                  type="button"
                                  onClick={() => hiddenEndingInputRef.current?.click()}
                                  className="w-full py-2 rounded-lg border border-dashed border-brand-border bg-brand-dark/20 text-center text-[10px] text-brand-muted hover:text-white transition-all cursor-pointer"
                                >
                                  🖼️ Upload Final Photo or Video
                                </button>
                              ) : (
                                <div className="p-2.5 rounded-xl border border-brand-border bg-brand-dark/40 flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="relative w-8 h-8 rounded overflow-hidden shrink-0 border border-white/5 bg-brand-dark/20">
                                      {hiddenEndingUrl.match(/\.(mp4|webm|ogg)/i) ? (
                                        <div className="w-full h-full bg-brand-purple/10 flex items-center justify-center text-brand-purple">
                                          <Play className="w-3 h-3 fill-brand-purple/20" />
                                        </div>
                                      ) : (
                                        <Image 
                                          src={hiddenEndingUrl} 
                                          alt="ending preview" 
                                          fill
                                          sizes="32px"
                                          className="object-cover"
                                        />
                                      )}
                                    </div>
                                    <div className="min-w-0 text-left">
                                      <p className="text-[10px] font-bold text-white truncate">Final Media Loaded 🤫</p>
                                      <p className="text-[8px] text-brand-muted truncate mt-0.5">{hiddenEndingUrl.split('/').pop()}</p>
                                    </div>
                                  </div>
                                  <button 
                                    type="button"
                                    onClick={() => setHiddenEndingUrl('')}
                                    className="p-1 rounded bg-brand-pink/10 border border-brand-pink/20 text-brand-pink hover:bg-brand-pink/20 transition-all cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>

                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 8: LIVE PREVIEW INFO */}
                {/* STEP 9: FINAL CONFIRMATION */}
                {currentStep === 9 && (
                  <div className="space-y-6 text-left font-sans">
                    <div>
                      <h3 className="font-heading font-extrabold text-white text-base">Almost Ready! ❤️</h3>
                      <p className="text-[11px] text-brand-muted">Double check your surprise details before creating the link.</p>
                    </div>

                    <div className="glass-panel p-5 rounded-2xl border border-brand-border/60 space-y-4 bg-brand-dark/25">
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-[9px] text-brand-muted block uppercase font-bold tracking-wider mb-0.5">For recipient</span>
                          <span className="text-white font-semibold">{recipientName || 'Someone Special'} ❤️</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-brand-muted block uppercase font-bold tracking-wider mb-0.5">Occasion preset</span>
                          <span className="text-white font-semibold">{occasion} Preset</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-brand-muted block uppercase font-bold tracking-wider mb-0.5">Selected plan</span>
                          <span className="text-brand-purple font-extrabold uppercase tracking-wider">{selectedPlan}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-brand-muted block uppercase font-bold tracking-wider mb-0.5">Photos Uploaded</span>
                          <span className="text-white font-semibold">{memories.length} / {PLAN_LIMITS[selectedPlan]} images</span>
                        </div>
                      </div>

                      <hr className="border-brand-border/40" />

                      <div className="space-y-2 text-xs">
                        <span className="text-[9px] text-brand-muted block uppercase font-bold tracking-wider mb-1">Features & Effects</span>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div className="flex items-center gap-1.5 text-brand-muted">
                            <span className={`w-1.5 h-1.5 rounded-full ${musicTrack ? 'bg-emerald-400' : 'bg-brand-border'}`} />
                            <span>Music: {musicTrack ? 'Selected' : 'None'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-brand-muted">
                            <span className={`w-1.5 h-1.5 rounded-full ${passwordLock ? 'bg-emerald-400' : 'bg-brand-border'}`} />
                            <span>Password Lock: {passwordLock ? 'Enabled' : 'Disabled'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-brand-muted">
                            <span className={`w-1.5 h-1.5 rounded-full ${countdownEnabled ? 'bg-emerald-400' : 'bg-brand-border'}`} />
                            <span>Countdown: {countdownEnabled ? 'Enabled' : 'Disabled'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-brand-muted">
                            <span className={`w-1.5 h-1.5 rounded-full ${noRunawayInteraction ? 'bg-emerald-400' : 'bg-brand-border'}`} />
                            <span>Cute No Button: {noRunawayInteraction ? 'Enabled' : 'Disabled'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-brand-muted">
                            <span className={`w-1.5 h-1.5 rounded-full ${midnightUnlock ? 'bg-emerald-400' : 'bg-brand-border'}`} />
                            <span>Midnight Unlock: {midnightUnlock ? 'Enabled' : 'Disabled'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-brand-muted">
                            <span className={`w-1.5 h-1.5 rounded-full ${olsVoiceNoteUrl ? 'bg-emerald-400' : 'bg-brand-border'}`} />
                            <span>Ending Voice Note: {olsVoiceNoteUrl ? 'Uploaded' : 'None'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>

          {/* Stepper Buttons controls */}
          <div className="flex justify-between items-center pt-6 border-t border-brand-border/40 select-none">
            <button
              onClick={handlePrevStep}
              disabled={currentStep === 1}
              className="px-4 py-2.5 rounded-lg border border-brand-border bg-brand-dark text-xs text-brand-muted hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer inline-flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            {currentStep === 9 ? (
              <CustomButton variant="glow" size="md" icon={Heart} onClick={handleGenerateSurprise} disabled={isPublishing} className="shrink-0">
                {isPublishing ? 'Generating...' : 'Generate My Surprise ❤️'}
              </CustomButton>
            ) : (
              <CustomButton variant="primary" size="md" icon={ChevronRight} iconPosition="right" onClick={handleNextStep} className="shrink-0">
                Continue
              </CustomButton>
            )}
          </div>

        </div>

        {/* RIGHT PANEL: PHONE MOCKUP VIEWPORT WITH GLARE */}
        <div className="lg:col-span-5 flex justify-center sticky top-24 z-10 select-none">
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-purple/20 via-transparent to-brand-pink/20 blur-2xl rounded-full pointer-events-none" />
          
          <div className="relative w-[290px] h-[550px] border-[6px] border-brand-border bg-brand-black rounded-[42px] shadow-[0_25px_50px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col p-4">
            {/* Speaker bar */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-5 bg-brand-border rounded-b-2xl z-40 flex items-center justify-center">
              <div className="w-12 h-0.5 bg-brand-black rounded-full" />
            </div>

            {/* Screen reflection glare */}
            <div className="absolute inset-0 z-30 pointer-events-none opacity-20 bg-gradient-to-tr from-transparent via-white/5 to-white/10" style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }} />

            {/* Viewport content */}
            <div className={`flex-1 bg-brand-black rounded-[32px] overflow-hidden p-3.5 pt-8 pb-2 flex flex-col justify-between items-center text-center relative border border-white/5 transition-all duration-1000 ${vibeTheme === 'nordic' ? 'theme-light' : ''}`}>
              
              {/* Vibe Gradient Backgrounds mapping theme select */}
              <div className={`absolute inset-0 transition-all duration-1000 ${
                vibeTheme === 'midnight' ? 'bg-gradient-to-tr from-[#02020e] via-[#05051c] to-[#0a0f30]' :
                vibeTheme === 'sunset' ? 'bg-gradient-to-tr from-[#240618] via-[#661625] to-[#c2642a]' :
                vibeTheme === 'nordic' ? 'bg-gradient-to-tr from-[#faf8f6] via-[#fff1f2] to-[#edf3fa]' :
                'bg-gradient-to-tr from-[#0a0a0a] via-[#121214] to-[#0d0d10]'
              }`} />

              {/* Purple neon glow overlay for Premium Dark */}
              {vibeTheme === 'dreamy' && (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.15)_0%,transparent_70%)] pointer-events-none z-10 animate-pulse-slow" />
              )}

              {/* Blue cosmic glow overlay for Midnight Glow */}
              {vibeTheme === 'midnight' && (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.18)_0%,transparent_70%)] pointer-events-none z-10 animate-pulse-slow" />
              )}

              {/* Golden sunset bloom overlay for Sunset Warmth */}
              {vibeTheme === 'sunset' && (
                <div className="absolute inset-0 bg-glow-gold-bloom opacity-30 pointer-events-none z-10 animate-pulse-slow" />
              )}

              {/* Animated Theme Elements Overlay */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none z-10 opacity-30">
                {[...Array(6)].map((_, i) => {
                  const delay = i * 0.8;
                  const left = 10 + i * 16;
                  const duration = 5 + (i % 2) * 2.5;
                  
                  let char = '';
                  if (vibeTheme === 'midnight') {
                    char = ['✨', '⭐', '🌟'][i % 3];
                  } else if (vibeTheme === 'sunset') {
                    char = ['🔥', '🍂', '💛'][i % 3];
                  } else if (vibeTheme === 'nordic') {
                    char = ['🌸', '🤍', '✨'][i % 3];
                  } else {
                    char = ['✨', '💜', '✨'][i % 3];
                  }
                  
                  return (
                    <motion.div
                      key={i}
                      initial={{ y: '500px', opacity: 0.1 }}
                      animate={{ y: '-20px', opacity: [0.1, 0.7, 0.1] }}
                      transition={{
                        duration: duration,
                        repeat: Infinity,
                        delay: delay,
                        ease: 'linear'
                      }}
                      className="absolute text-[10px]"
                      style={{ left: `${left}%` }}
                    >
                      {char}
                    </motion.div>
                  );
                })}
              </div>

              <div className="absolute inset-0 bg-radial-gradient from-brand-purple/5 to-transparent pointer-events-none" />

              <AnimatePresence mode="wait">
                {/* PREVIEW FRAME 1: INTERACTIVE COVER */}
                {previewScreenIdx === 1 && (
                  <motion.div 
                    key="p-frame-1"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    className="flex-grow flex flex-col justify-center items-center p-2 space-y-6 relative z-10 w-full"
                  >
                    <div className="w-12 h-12 rounded-full bg-brand-pink/10 border border-brand-pink/20 flex items-center justify-center text-brand-pink animate-bounce">
                      <Heart className="w-6 h-6 fill-brand-pink/20" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-heading font-extrabold text-white text-xs leading-snug">
                        Someone made something special for you ❤️
                      </h4>
                      <p className="text-[9px] text-brand-muted">Tap Open below to unlock the surprise.</p>
                    </div>
                    <button 
                      onClick={() => setPreviewScreenIdx(2)}
                      className="w-full py-2 bg-gradient-to-r from-brand-purple to-brand-pink text-white rounded-lg text-[10px] font-bold shadow-md cursor-pointer"
                    >
                      Open Surprise
                    </button>
                  </motion.div>
                )}

                {/* PREVIEW FRAME 2: CUTE RUNAWAY BUTTON INTERACTION */}
                {previewScreenIdx === 2 && (
                  <motion.div 
                    key="p-frame-2"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="flex-grow flex flex-col justify-center items-center space-y-8 relative z-10 w-full"
                  >
                    <h3 className="font-heading font-extrabold text-white text-xs px-2">
                      Promise you will smile today? 🥺
                    </h3>
                    
                    {previewNoCount > 0 && (
                      <span className="text-[9px] text-brand-pink font-semibold bg-brand-pink/10 border border-brand-pink/20 px-2.5 py-0.5 rounded-full">
                        {FUNNY_PHRASES[(previewNoCount - 1) % FUNNY_PHRASES.length]}
                      </span>
                    )}

                    <div className="flex items-center gap-4 relative w-full justify-center min-h-[50px]">
                      <button 
                        onClick={() => setPreviewScreenIdx(3)}
                        className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-brand-purple to-brand-pink text-[10px] font-bold text-white shadow-md cursor-pointer"
                      >
                        Yes ❤️
                      </button>
                      
                      <motion.div
                        animate={{ 
                          x: noRunawayInteraction ? previewNoPosition.x : 0, 
                          y: noRunawayInteraction ? previewNoPosition.y : 0 
                        }}
                        transition={{ type: 'spring', stiffness: 350, damping: 18 }}
                      >
                        <button
                          onMouseEnter={handlePreviewNoInteract}
                          onClick={handlePreviewNoInteract}
                          className="px-4 py-1.5 rounded-lg border border-brand-border bg-brand-dark text-[10px] text-brand-muted hover:text-white cursor-pointer"
                        >
                          No 🙄
                        </button>
                      </motion.div>
                    </div>
                  </motion.div>
                )}

                {/* PREVIEW FRAME 3: NAME REVEAL */}
                {previewScreenIdx === 3 && (
                  <motion.div 
                    key="p-frame-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-grow flex flex-col justify-center items-center space-y-5 relative z-10 w-full"
                  >
                    <div className="space-y-2">
                      <p className="text-[8px] tracking-widest text-brand-purple uppercase font-mono font-bold">Atmosphere Playing</p>
                      <h4 className="text-[10px] text-brand-muted mt-2">This was made specially for...</h4>
                      <h2 className="font-heading font-extrabold text-base text-transparent bg-clip-text bg-gradient-to-r from-brand-purple via-brand-pink to-brand-blue text-glow-purple">
                        {recipientName || 'Someone Special'} ✨
                      </h2>
                    </div>
                    <button 
                      onClick={() => setPreviewScreenIdx(4)}
                      className="px-4 py-1.5 rounded-lg border border-brand-border bg-brand-dark text-[9px] font-bold text-brand-muted hover:text-white cursor-pointer"
                    >
                      Next
                    </button>
                  </motion.div>
                )}

                {/* PREVIEW FRAME 4: COLLAGE SLIDES */}
                {previewScreenIdx === 4 && (
                  <motion.div 
                    key="p-frame-4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex-grow flex flex-col justify-center space-y-3 relative z-10 w-full p-1"
                  >
                    <span className="text-[8px] font-mono text-brand-muted text-left uppercase">Scrapbook Slide</span>
                    
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden border border-white/5 bg-brand-dark/40 shadow-md">
                      <Image 
                        src={memories[0]?.imageUrl || 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400&auto=format&fit=crop&q=80'} 
                        alt="romantic mockup" 
                        fill
                        sizes="320px"
                        className="object-cover filter brightness-90"
                      />
                    </div>
                    
                    <div className="glass-panel p-2 rounded-lg border border-white/5 text-[9px] text-brand-muted text-left italic">
                      “{memories[0]?.caption || 'Click Caption in Step 3 to customize...'}”
                    </div>

                    <button 
                      onClick={() => setPreviewScreenIdx(5)}
                      className="w-full py-1.5 rounded-lg bg-gradient-to-r from-brand-purple to-brand-pink text-[10px] font-bold text-white shadow-md cursor-pointer mt-2"
                    >
                      Read Letter
                    </button>
                  </motion.div>
                )}

                {/* PREVIEW FRAME 5: LETTER CELEBRATION */}
                {previewScreenIdx === 5 && (
                  <motion.div 
                    key="p-frame-5"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-grow flex flex-col justify-center items-center space-y-5 relative z-10 w-full"
                  >
                    <div className="w-12 h-12 rounded-full bg-brand-pink/10 border border-brand-pink/20 flex items-center justify-center text-brand-pink">
                      <Gift className="w-6 h-6 fill-brand-pink/20" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-heading font-extrabold text-white text-sm">
                        {title || `${occasion} Story`} 🎉
                      </h3>
                      <p className="text-[9px] text-brand-muted px-2 line-clamp-3 leading-relaxed">
                        {message || 'Type message in Step 4 to preview...'}
                      </p>
                    </div>
                    <button 
                      onClick={() => {
                        setPreviewScreenIdx(1);
                        setPreviewNoCount(0);
                        setPreviewNoPosition({ x: 0, y: 0 });
                      }}
                      className="text-[9px] font-semibold text-brand-purple hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Replay preview</span>
                    </button>
                  </motion.div>
                )}

              </AnimatePresence>

              {/* URL slug details */}
              <div className="text-[8px] text-brand-muted font-mono tracking-wider pt-2 mt-auto relative z-10">
                heartly.me/s/preview-link
              </div>
            </div>
          </div>
        </div>

      {/* Sandbox Payment Modal */}
      <AnimatePresence>
        {showSandboxPaymentModal && sandboxPaymentData && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleSimulatePaymentCancel}
              className="absolute inset-0 bg-brand-black/90 backdrop-blur-md"
            />
            
            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.35 }}
              className="w-full max-w-sm glass-panel p-6 sm:p-8 rounded-3xl border border-brand-border/60 shadow-2xl relative z-10 space-y-6 text-center"
            >
              <div className="w-14 h-14 rounded-full bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center text-brand-purple mx-auto animate-pulse">
                <CreditCard className="w-7 h-7" />
              </div>

              <div className="space-y-2.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-sky-500/20 bg-sky-500/10 text-[10px] font-bold text-sky-400 select-none uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
                  <span>Sandbox Mode Fallback</span>
                </div>
                <h3 className="font-heading font-extrabold text-white text-base">Initialize Sandbox Checkout</h3>
                <p className="text-[11px] text-brand-muted px-2 leading-relaxed">
                  No active Razorpay credentials found. Simulate a test purchase to activate your surprise page.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-brand-border/40 bg-brand-dark/20 text-xs text-left space-y-2 font-medium">
                <div className="flex justify-between">
                  <span className="text-brand-muted">Selected Plan:</span>
                  <span className="text-white font-bold capitalize">{sandboxPaymentData.planName}</span>
                </div>
                <div className="flex justify-between border-t border-brand-border/20 pt-2 mt-2">
                  <span className="text-brand-muted">Amount Due:</span>
                  <span className="text-brand-purple font-extrabold">₹{sandboxPaymentData.amount}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 pt-2">
                <button
                  onClick={handleSimulatePaymentSuccess}
                  disabled={isPublishing}
                  type="button"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-purple to-brand-pink text-xs font-bold text-white transition-all cursor-pointer hover:opacity-95 active:scale-98 disabled:opacity-50"
                >
                  {isPublishing ? 'Verifying Sandbox Payment...' : 'Simulate Success ⚡'}
                </button>
                <button
                  onClick={handleSimulatePaymentCancel}
                  type="button"
                  className="w-full py-3 rounded-xl border border-brand-border bg-brand-dark/40 hover:bg-white/5 text-xs font-semibold text-white transition-all cursor-pointer active:scale-98"
                >
                  Cancel & Save Draft
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-5 right-5 z-[100] px-4 py-3 rounded-xl border border-brand-border bg-brand-dark/70 backdrop-blur-md shadow-2xl flex items-center gap-2.5 max-w-sm"
          >
            <div className={`w-2 h-2 rounded-full ${
              toast.type === 'success' ? 'bg-emerald-500' :
              toast.type === 'error' ? 'bg-rose-500' : 'bg-brand-purple'
            }`} />
            <p className="text-xs font-semibold text-white tracking-wide">{toast.message}</p>
            <button
              onClick={() => setToast(null)}
              className="text-brand-muted hover:text-white transition-colors ml-auto"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      </div>
    </div>
  );
}

import { Suspense } from 'react';

export default function CreateSurpriseBuilder() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 text-center">
        <Loader2 className="w-6 h-6 text-brand-purple animate-spin" />
        <p className="text-xs text-brand-muted font-semibold">Loading Builder Workspace...</p>
      </div>
    }>
      <CreateSurpriseBuilderContent />
    </Suspense>
  );
}
