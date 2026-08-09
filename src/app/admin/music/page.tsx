'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, ArrowUp, ArrowDown, Plus, Edit, Trash2, Eye, EyeOff, 
  Upload, Music, Image as ImageIcon, Save, X, Loader2, Sparkles, 
  TrendingUp, Check, ShieldAlert, AlertCircle, RefreshCw, Star, Info, Search,
  Play, Pause, Volume2, VolumeX
} from 'lucide-react';
import CustomButton from '@/components/ui/CustomButton';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/utils/supabase/client';

interface Song {
  id: string;
  title: string;
  artist: string;
  category: string;
  language: string;
  duration: string;
  audio_url: string;
  cover_url?: string | null;
  is_hidden: boolean;
  sort_order: number;
  is_premium: boolean;
  is_featured: boolean;
  is_trending: boolean;
  is_ai_generated: boolean;
}

const CATEGORIES = ['Birthday', 'Love', 'Anniversary', 'Proposal', 'Friendship', 'Sorry', 'Congratulations'];
const LANGUAGES = ['Hindi', 'English'];

export default function MusicLibraryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Admin Auth States
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Database States
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [migrationMissing, setMigrationMissing] = useState(false);

  // Form Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields State
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [category, setCategory] = useState('Birthday');
  const [language, setLanguage] = useState('Hindi');
  const [duration, setDuration] = useState('');
  const [isHidden, setIsHidden] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isTrending, setIsTrending] = useState(false);
  const [isAiGenerated, setIsAiGenerated] = useState(false);

  // Upload States
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [currentAudioUrl, setCurrentAudioUrl] = useState('');
  const [currentCoverUrl, setCurrentCoverUrl] = useState('');

  // Audio Playback Preview
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const [playbackState, setPlaybackState] = useState<'idle' | 'loading' | 'playing' | 'paused'>('idle');
  const [currentTime, setCurrentTime] = useState(0);
  const [previewDuration, setPreviewDuration] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [languageFilter, setLanguageFilter] = useState('All');

  // Verify Admin Access
  useEffect(() => {
    const checkAccess = async () => {
      setCheckingAuth(true);
      try {
        const res = await fetch('/api/admin/verify-session');
        const data = await res.json();
        if (data.authenticated) {
          setIsAdmin(true);
          return;
        }

        // Fallback to Supabase User Email Check
        const supabase = createClient();
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();
        
        const authorizedEmails = [
          'pal929956@gmail.com',
          'founder@heartly.in',
          'admin@heartly.in',
          'lalit@heartly.in',
          'lalit.gemini@gmail.com'
        ];

        if (supabaseUser && supabaseUser.email && authorizedEmails.includes(supabaseUser.email.toLowerCase())) {
          setIsAdmin(true);
          return;
        }

        setIsAdmin(false);
      } catch (err) {
        console.error('Verify admin session failed:', err);
        setIsAdmin(false);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAccess();
  }, []);

  // Fetch Music Library from Supabase
  const fetchSongs = async () => {
    if (isAdmin !== true) return;
    setLoading(true);
    setError(null);
    setMigrationMissing(false);
    const supabase = createClient();
    try {
      const { data, error: dbErr } = await supabase
        .from('music_library')
        .select('*')
        .order('sort_order', { ascending: true });

      if (dbErr) {
        // Check if table missing error code
        if (dbErr.code === 'PGRST205' || dbErr.message?.includes('does not exist')) {
          setMigrationMissing(true);
        } else {
          setError(dbErr.message);
        }
      } else {
        setSongs(data || []);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin === true) {
      fetchSongs();
    }
  }, [isAdmin]);

  // Clean up audio object
  useEffect(() => {
    return () => {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        audioPreviewRef.current = null;
      }
    };
  }, []);

  // Format seconds into minutes:seconds
  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Seek time in preview audio
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && audioPreviewRef.current) {
      audioPreviewRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  // Adjust volume
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (audioPreviewRef.current) {
      audioPreviewRef.current.volume = val;
      audioPreviewRef.current.muted = val === 0;
    }
  };

  // Toggle Mute state
  const handleToggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (audioPreviewRef.current) {
      audioPreviewRef.current.muted = newMuted;
    }
  };

  // Stop playing preview completely
  const handleStopPreview = () => {
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      audioPreviewRef.current = null;
    }
    setPlayingTrackId(null);
    setPlaybackState('idle');
    setCurrentTime(0);
    setPreviewDuration(0);
  };

  // Handle Play/Pause Preview
  const handleTogglePlayPreview = (song: Song) => {
    if (playingTrackId === song.id) {
      if (playbackState === 'playing') {
        audioPreviewRef.current?.pause();
      } else {
        audioPreviewRef.current?.play()
          .catch(err => console.error('Audio preview play failed:', err));
      }
    } else {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
      }

      setPlayingTrackId(song.id);
      setPlaybackState('loading');
      setCurrentTime(0);
      setPreviewDuration(0);

      const audio = new Audio(song.audio_url);
      audio.volume = isMuted ? 0 : volume;
      audio.muted = isMuted;
      audioPreviewRef.current = audio;

      audio.addEventListener('loadstart', () => {
        setPlaybackState('loading');
      });
      audio.addEventListener('waiting', () => {
        setPlaybackState('loading');
      });
      audio.addEventListener('playing', () => {
        setPlaybackState('playing');
      });
      audio.addEventListener('pause', () => {
        setPlaybackState('paused');
      });
      audio.addEventListener('ended', () => {
        setPlayingTrackId(null);
        setPlaybackState('idle');
        setCurrentTime(0);
      });
      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime);
      });
      audio.addEventListener('loadedmetadata', () => {
        setPreviewDuration(audio.duration || 0);
      });

      audio.play()
        .catch(err => {
          console.error('Audio preview play failed:', err);
          setPlaybackState('idle');
          setPlayingTrackId(null);
        });
    }
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingSong(null);
    setTitle('');
    setArtist('');
    setCategory('Birthday');
    setLanguage('Hindi');
    setDuration('');
    setIsHidden(false);
    setIsPremium(false);
    setIsFeatured(false);
    setIsTrending(false);
    setIsAiGenerated(false);
    setAudioFile(null);
    setCoverFile(null);
    setCurrentAudioUrl('');
    setCurrentCoverUrl('');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (song: Song) => {
    setEditingSong(song);
    setTitle(song.title);
    setArtist(song.artist);
    setCategory(song.category);
    setLanguage(song.language);
    setDuration(song.duration);
    setIsHidden(song.is_hidden);
    setIsPremium(song.is_premium);
    setIsFeatured(song.is_featured);
    setIsTrending(song.is_trending);
    setIsAiGenerated(song.is_ai_generated);
    setAudioFile(null);
    setCoverFile(null);
    setCurrentAudioUrl(song.audio_url);
    setCurrentCoverUrl(song.cover_url || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Auto calculate duration on selecting audio file
  const handleAudioFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAudioFile(file);
    setFormError(null);

    // Calculate duration
    try {
      const objectUrl = URL.createObjectURL(file);
      const audio = new Audio(objectUrl);
      audio.addEventListener('loadedmetadata', () => {
        const mins = Math.floor(audio.duration / 60);
        const secs = Math.floor(audio.duration % 60);
        setDuration(`${mins}:${secs.toString().padStart(2, '0')}`);
        URL.revokeObjectURL(objectUrl);
      });
      audio.addEventListener('error', () => {
        URL.revokeObjectURL(objectUrl);
      });
    } catch (err) {
      console.warn('Could not auto-calculate audio duration:', err);
    }
  };

  // Handle Save (Create / Update)
  const handleSaveSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !artist.trim()) {
      setFormError('Title and Artist are required.');
      return;
    }

    if (!editingSong && !audioFile) {
      setFormError('An audio file is required for new songs.');
      return;
    }

    setFormLoading(true);
    setFormError(null);
    setUploadStatus('Connecting to database...');
    const supabase = createClient();

    try {
      let finalAudioUrl = currentAudioUrl;
      let finalCoverUrl = currentCoverUrl || null;

      // 1. Upload Audio File if modified
      if (audioFile) {
        setUploadStatus('Uploading audio file to Supabase Storage...');
        const fileExt = audioFile.name.split('.').pop();
        const fileName = `${Date.now()}_audio.${fileExt}`;
        const filePath = `music/${fileName}`;

        const { error: uploadErr } = await supabase.storage
          .from('heartly-music')
          .upload(filePath, audioFile, { upsert: true });

        if (uploadErr) throw new Error(`Audio upload failed: ${uploadErr.message}`);

        const { data: { publicUrl } } = supabase.storage
          .from('heartly-music')
          .getPublicUrl(filePath);

        finalAudioUrl = publicUrl;
      }

      // 2. Upload Cover Image File if modified
      if (coverFile) {
        setUploadStatus('Uploading cover image to Supabase Storage...');
        const fileExt = coverFile.name.split('.').pop();
        const fileName = `${Date.now()}_cover.${fileExt}`;
        const filePath = `covers/${fileName}`;

        const { error: uploadErr } = await supabase.storage
          .from('heartly-music')
          .upload(filePath, coverFile, { upsert: true });

        if (uploadErr) throw new Error(`Cover upload failed: ${uploadErr.message}`);

        const { data: { publicUrl } } = supabase.storage
          .from('heartly-music')
          .getPublicUrl(filePath);

        finalCoverUrl = publicUrl;
      }

      // 3. Save to database
      setUploadStatus(editingSong ? 'Updating track details in database...' : 'Saving new track to database...');
      if (editingSong) {
        const { error: dbErr } = await supabase
          .from('music_library')
          .update({
            title: title.trim(),
            artist: artist.trim(),
            category,
            language,
            duration,
            audio_url: finalAudioUrl,
            cover_url: finalCoverUrl,
            is_hidden: isHidden,
            is_premium: isPremium,
            is_featured: isFeatured,
            is_trending: isTrending,
            is_ai_generated: isAiGenerated,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingSong.id);

        if (dbErr) throw dbErr;
      } else {
        // Calculate next sort order
        const maxSortOrder = songs.reduce((max, s) => s.sort_order > max ? s.sort_order : max, 0);
        const newId = `song-${Date.now()}`;

        const { error: dbErr } = await supabase
          .from('music_library')
          .insert({
            id: newId,
            title: title.trim(),
            artist: artist.trim(),
            category,
            language,
            duration,
            audio_url: finalAudioUrl,
            cover_url: finalCoverUrl,
            is_hidden: isHidden,
            is_premium: isPremium,
            is_featured: isFeatured,
            is_trending: isTrending,
            is_ai_generated: isAiGenerated,
            sort_order: maxSortOrder + 1
          });

        if (dbErr) throw dbErr;
      }

      setIsModalOpen(false);
      fetchSongs();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save song configuration.');
    } finally {
      setFormLoading(false);
      setUploadStatus(null);
    }
  };

  // Toggle quick visibility
  const handleToggleVisibility = async (song: Song) => {
    const supabase = createClient();
    try {
      const { error: dbErr } = await supabase
        .from('music_library')
        .update({ is_hidden: !song.is_hidden })
        .eq('id', song.id);

      if (dbErr) {
        setError(dbErr.message);
      } else {
        setSongs(songs.map(s => s.id === song.id ? { ...s, is_hidden: !s.is_hidden } : s));
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Move song order (Reordering)
  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= songs.length) return;

    const currentSong = songs[index];
    const targetSong = songs[targetIndex];

    const currentOrder = currentSong.sort_order;
    const targetOrder = targetSong.sort_order;

    const supabase = createClient();
    try {
      // Swap order value
      const { error: err1 } = await supabase
        .from('music_library')
        .update({ sort_order: targetOrder })
        .eq('id', currentSong.id);

      const { error: err2 } = await supabase
        .from('music_library')
        .update({ sort_order: currentOrder })
        .eq('id', targetSong.id);

      if (err1 || err2) {
        setError(err1?.message || err2?.message || 'Failed to update order in database.');
        return;
      }

      // Re-fetch lists
      fetchSongs();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Delete Song
  const handleDeleteSong = async (song: Song) => {
    if (!window.confirm(`Are you sure you want to delete "${song.title}"? This cannot be undone.`)) return;

    const supabase = createClient();
    try {
      // Delete database record first
      const { error: dbErr } = await supabase
        .from('music_library')
        .delete()
        .eq('id', song.id);

      if (dbErr) throw dbErr;

      // Clean up audio file from Supabase storage if it was hosted there
      if (song.audio_url.includes('/heartly-music/')) {
        const audioPath = song.audio_url.split('/heartly-music/').pop()?.split('?')[0];
        if (audioPath) {
          await supabase.storage.from('heartly-music').remove([audioPath]);
        }
      }

      // Clean up cover image file if it was hosted there
      if (song.cover_url && song.cover_url.includes('/heartly-music/')) {
        const coverPath = song.cover_url.split('/heartly-music/').pop()?.split('?')[0];
        if (coverPath) {
          await supabase.storage.from('heartly-music').remove([coverPath]);
        }
      }

      fetchSongs();
    } catch (err: any) {
      setError(err.message || 'Failed to delete song.');
    }
  };

  // Filtered lists
  const filteredSongs = songs.filter(song => {
    const matchesSearch = 
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      song.artist.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'All' || song.category === categoryFilter;
    const matchesLanguage = languageFilter === 'All' || song.language === languageFilter;

    return matchesSearch && matchesCategory && matchesLanguage;
  });

  // Render Auth Loading State
  if (authLoading || checkingAuth) {
    return (
      <div className="min-h-screen bg-[#070708] flex flex-col items-center justify-center text-brand-muted text-xs gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-brand-purple" />
        <span>Loading Founder Session...</span>
      </div>
    );
  }

  // Render Redirect if not authorized
  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-[#070708] flex items-center justify-center p-4">
        <div className="w-full max-w-sm glass-panel p-8 rounded-3xl border border-brand-border/60 text-center space-y-5">
          <div className="w-12 h-12 rounded-full bg-brand-pink/10 border border-brand-pink/20 flex items-center justify-center text-brand-pink mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-heading font-bold text-white text-lg">Unauthorized Portal</h3>
            <p className="text-xs text-brand-muted">You do not have administrative permissions to view the founder dashboard.</p>
          </div>
          <CustomButton onClick={() => router.push('/dashboard')} variant="glass" size="sm" className="w-full">
            Back to Dashboard
          </CustomButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070709] text-white flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-brand-border bg-brand-dark/25 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20 select-none">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-brand-muted hover:text-white p-1 rounded-lg border border-brand-border bg-brand-dark/40 shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2 font-heading font-bold text-sm sm:text-base text-white">
            <Music className="w-4.5 h-4.5 text-brand-pink fill-brand-pink/20" />
            <span>Founder Music Library CMS</span>
          </div>
          <span className="hidden sm:inline-block text-[9px] font-bold tracking-wider uppercase bg-brand-purple/10 border border-brand-purple/20 text-brand-purple px-2 py-0.5 rounded-full select-none">
            Active Bucket: heartly-music 🎵
          </span>
        </div>

        <button 
          onClick={handleOpenAddModal}
          className="flex items-center gap-1 bg-brand-purple border border-brand-purple/35 text-xs font-bold text-white px-3 py-1.5 rounded-full hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:scale-105 active:scale-95 transition-all cursor-pointer select-none"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Song</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Error notification banner */}
        {error && (
          <div className="p-4 rounded-xl border border-brand-pink/35 bg-brand-pink/5 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-brand-pink shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white">Database Synchronization Error</h4>
              <p className="text-[11px] text-brand-muted">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="ml-auto text-brand-muted hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Database Migration Missing Instruction */}
        {migrationMissing && (
          <div className="p-5 rounded-2xl border border-brand-purple/40 bg-brand-purple/5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-brand-purple/10 border border-brand-purple/25 text-brand-purple shrink-0">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">Database Schema Setup Required</h4>
                <p className="text-xs text-brand-muted">
                  The music library table does not exist in your Supabase schema cache yet. To enable the CMS, please run the migration SQL script in your Supabase SQL Editor.
                </p>
              </div>
            </div>

            <div className="bg-[#0b0b0c] p-4 rounded-xl border border-brand-border/60 text-left relative group">
              <span className="text-[9px] uppercase font-bold text-brand-muted absolute right-3 top-3">SQL MIGRATION</span>
              <pre className="text-[10px] text-brand-muted font-mono overflow-x-auto max-h-[150px] scrollbar-thin select-all">
{`-- Create music_library table schema
CREATE TABLE IF NOT EXISTS public.music_library (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    category TEXT NOT NULL,
    language TEXT NOT NULL,
    duration TEXT NOT NULL,
    audio_url TEXT NOT NULL,
    cover_url TEXT,
    is_hidden BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_premium BOOLEAN NOT NULL DEFAULT false,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_trending BOOLEAN NOT NULL DEFAULT false,
    is_ai_generated BOOLEAN NOT NULL DEFAULT false,
    recommendations JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Disable Row Level Security
ALTER TABLE public.music_library DISABLE ROW LEVEL SECURITY;

-- Apply Storage Bucket Setup in dashboard migration file`}
              </pre>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <CustomButton onClick={fetchSongs} variant="glow" size="sm">
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                <span>Verify Schema Again</span>
              </CustomButton>
              <Link href="/admin">
                <CustomButton variant="glass" size="sm">Back to Admin</CustomButton>
              </Link>
            </div>
          </div>
        )}

        {!migrationMissing && (
          <>
            {/* Filter Panel */}
            <div className="glass-panel p-4 rounded-2xl border border-brand-border/60 flex flex-col md:flex-row gap-4 items-center justify-between select-none">
              <div className="w-full md:max-w-xs relative">
                <Search className="w-4 h-4 text-brand-muted absolute left-3.5 top-3.5" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search song title or artist..."
                  className="w-full pl-9 pr-4 py-2.5 bg-brand-dark/40 border border-brand-border/60 rounded-xl text-xs text-white placeholder-brand-muted focus:border-brand-purple/70 focus:outline-none transition-all"
                />
              </div>

              <div className="w-full md:w-auto flex flex-wrap gap-2.5 items-center justify-end">
                {/* Category Filter */}
                <div className="flex items-center gap-1.5 bg-brand-dark/30 border border-brand-border/60 px-3 py-1 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-brand-muted">Vibe:</span>
                  <select 
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
                  >
                    <option value="All">All Vibes</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat} className="bg-brand-black">{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Language Filter */}
                <div className="flex items-center gap-1.5 bg-brand-dark/30 border border-brand-border/60 px-3 py-1 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-brand-muted">Lang:</span>
                  <select 
                    value={languageFilter}
                    onChange={(e) => setLanguageFilter(e.target.value)}
                    className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
                  >
                    <option value="All">All Languages</option>
                    {LANGUAGES.map(lang => (
                      <option key={lang} value={lang} className="bg-brand-black">{lang}</option>
                    ))}
                  </select>
                </div>

                <button 
                  onClick={fetchSongs}
                  className="p-2.5 rounded-xl border border-brand-border bg-brand-dark/30 text-brand-muted hover:text-white hover:border-brand-border/60 transition-all cursor-pointer"
                  title="Reload list"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* List Table / Card Grid */}
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-brand-muted select-none">
                <Loader2 className="w-6 h-6 animate-spin text-brand-purple" />
                <span className="text-xs">Fetching library tracks...</span>
              </div>
            ) : filteredSongs.length === 0 ? (
              <div className="glass-panel py-16 text-center border border-brand-border/40 rounded-3xl select-none">
                <Music className="w-10 h-10 text-brand-muted/40 mx-auto mb-3" />
                <h4 className="font-heading font-bold text-white text-sm">No songs match your criteria</h4>
                <p className="text-xs text-brand-muted mt-1">Try resetting your search query or categories, or add a new track.</p>
                <button 
                  onClick={handleOpenAddModal}
                  className="mt-4 bg-brand-purple/20 border border-brand-purple/40 text-xs font-bold text-white px-4 py-2 rounded-full hover:bg-brand-purple/35 transition-all cursor-pointer"
                >
                  Create New Song Entry
                </button>
              </div>
            ) : (
              <div className="glass-panel border border-brand-border/60 rounded-3xl overflow-hidden select-none">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-brand-border bg-brand-dark/15 text-brand-muted uppercase font-bold tracking-wider text-[9px]">
                        <th className="py-3 px-4 w-12 text-center">Order</th>
                        <th className="py-3 px-4 w-16">Preview</th>
                        <th className="py-3 px-4">Song Details</th>
                        <th className="py-3 px-4">Vibe / Lang</th>
                        <th className="py-3 px-4 text-center">Tags</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-center w-24">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSongs.map((song, index) => {
                        const isPlaying = playingTrackId === song.id;
                        return (
                          <tr 
                            key={song.id} 
                            className={`border-b border-brand-border hover:bg-brand-dark/20 transition-all ${
                              song.is_hidden ? 'opacity-50 hover:opacity-85' : ''
                            }`}
                          >
                            {/* Sort Ordering buttons */}
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <button 
                                  onClick={() => handleMoveOrder(index, 'up')}
                                  disabled={index === 0}
                                  className="p-0.5 text-brand-muted hover:text-white disabled:opacity-20 cursor-pointer"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <span className="font-mono text-[10px] font-bold text-brand-purple">
                                  {song.sort_order}
                                </span>
                                <button 
                                  onClick={() => handleMoveOrder(index, 'down')}
                                  disabled={index === songs.length - 1}
                                  className="p-0.5 text-brand-muted hover:text-white disabled:opacity-20 cursor-pointer"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>

                            {/* Play Preview button */}
                            <td className="py-3.5 px-4 text-center">
                              <button
                                onClick={() => handleTogglePlayPreview(song)}
                                className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                                  isPlaying 
                                    ? 'bg-brand-pink border-brand-pink text-white shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                                    : 'bg-brand-purple/15 border-brand-purple/35 text-brand-purple hover:bg-brand-purple hover:text-white'
                                }`}
                                title={isPlaying && playbackState === 'playing' ? 'Pause Preview' : 'Play Preview'}
                              >
                                {isPlaying ? (
                                  playbackState === 'loading' ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : playbackState === 'playing' ? (
                                    <Pause className="w-3.5 h-3.5 fill-current" />
                                  ) : (
                                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                                  )
                                ) : (
                                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                                )}
                              </button>
                            </td>

                            {/* Song details */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                {song.cover_url ? (
                                  <img 
                                    src={song.cover_url} 
                                    alt={song.title} 
                                    className="w-8 h-8 rounded-lg object-cover border border-brand-border/60 shrink-0" 
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-lg bg-brand-dark/60 border border-brand-border flex items-center justify-center text-brand-muted shrink-0">
                                    <ImageIcon className="w-3.5 h-3.5" />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <h4 className="font-bold text-white text-[13px] truncate max-w-[200px]" title={song.title}>
                                    {song.title}
                                  </h4>
                                  <p className="text-[10px] text-brand-muted truncate max-w-[180px]">
                                    {song.artist}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Vibe and Language tags */}
                            <td className="py-3.5 px-4 space-y-1">
                              <span className="inline-block text-[8.5px] px-1.5 py-0.5 rounded font-extrabold uppercase bg-brand-purple/10 text-brand-purple leading-none">
                                {song.category}
                              </span>
                              <div className="text-[9.5px] text-brand-muted font-medium flex items-center gap-1.5">
                                <span>{song.language}</span>
                                <span className="text-brand-border/50">•</span>
                                {isPlaying && playbackState !== 'idle' ? (
                                  <span className="text-brand-pink font-bold animate-pulse">
                                    {formatTime(currentTime)} / {song.duration}
                                  </span>
                                ) : (
                                  <span>{song.duration}</span>
                                )}
                              </div>
                            </td>

                            {/* Custom metadata tags */}
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex flex-wrap gap-1 justify-center max-w-[150px] mx-auto">
                                {song.is_trending && (
                                  <span className="text-[8px] px-1.5 py-0.5 rounded font-bold uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                    Trending
                                  </span>
                                )}
                                {song.is_featured && (
                                  <span className="text-[8px] px-1.5 py-0.5 rounded font-bold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                    Featured
                                  </span>
                                )}
                                {song.is_premium && (
                                  <span className="text-[8px] px-1.5 py-0.5 rounded font-bold uppercase bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                    Premium
                                  </span>
                                )}
                                {song.is_ai_generated && (
                                  <span className="text-[8px] px-1.5 py-0.5 rounded font-bold uppercase bg-sky-500/10 text-sky-500 border border-sky-500/20">
                                    AI
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Visibility status */}
                            <td className="py-3.5 px-4 text-center">
                              <button 
                                onClick={() => handleToggleVisibility(song)}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 cursor-pointer transition-all ${
                                  song.is_hidden 
                                    ? 'bg-brand-muted/10 text-brand-muted border border-brand-border/50' 
                                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                }`}
                              >
                                {song.is_hidden ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
                                <span>{song.is_hidden ? 'Hidden' : 'Live'}</span>
                              </button>
                            </td>

                            {/* Edit / Delete action buttons */}
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center gap-1.5 justify-center">
                                <button 
                                  onClick={() => handleOpenEditModal(song)}
                                  className="p-1.5 rounded-lg border border-brand-border bg-brand-dark/40 text-brand-muted hover:text-white hover:border-brand-border/60 transition-all cursor-pointer"
                                  title="Edit Song"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteSong(song)}
                                  className="p-1.5 rounded-lg border border-brand-pink/20 bg-brand-dark/40 text-brand-pink/80 hover:text-brand-pink hover:bg-brand-pink/5 hover:border-brand-pink/40 transition-all cursor-pointer"
                                  title="Delete Song"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Add / Edit Song Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg glass-panel border border-brand-border/80 rounded-3xl p-6 sm:p-8 space-y-5 my-8 max-h-[90vh] overflow-y-auto scrollbar-thin"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center text-brand-purple">
                    <Music className="w-4 h-4" />
                  </div>
                  <h3 className="font-heading font-bold text-white text-base sm:text-lg">
                    {editingSong ? 'Edit Track Profile' : 'Upload New Track'}
                  </h3>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg border border-brand-border text-brand-muted hover:text-white bg-brand-dark/30 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Error Banner */}
              {formError && (
                <div className="p-3.5 rounded-xl border border-brand-pink/35 bg-brand-pink/5 flex items-start gap-2.5 text-[11px] text-brand-pink">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Form Body */}
              <form onSubmit={handleSaveSong} className="space-y-4">
                {/* Title & Artist */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-brand-muted tracking-wider">Song Title</label>
                    <input 
                      type="text" 
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Perfect Promise"
                      className="w-full p-2.5 bg-brand-dark/40 border border-brand-border/60 rounded-xl text-xs text-white placeholder-brand-muted focus:border-brand-purple/70 focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-brand-muted tracking-wider">Artist Name</label>
                    <input 
                      type="text" 
                      required
                      value={artist}
                      onChange={(e) => setArtist(e.target.value)}
                      placeholder="e.g. Soft Strings Cover"
                      className="w-full p-2.5 bg-brand-dark/40 border border-brand-border/60 rounded-xl text-xs text-white placeholder-brand-muted focus:border-brand-purple/70 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Vibe Category & Language Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-brand-muted tracking-wider">Vibe Category</label>
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full p-2.5 bg-brand-dark/40 border border-brand-border/60 rounded-xl text-xs text-white focus:outline-none cursor-pointer"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat} className="bg-brand-black">{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-brand-muted tracking-wider">Language</label>
                    <select 
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full p-2.5 bg-brand-dark/40 border border-brand-border/60 rounded-xl text-xs text-white focus:outline-none cursor-pointer"
                    >
                      {LANGUAGES.map(lang => (
                        <option key={lang} value={lang} className="bg-brand-black">{lang}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Duration */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-brand-muted tracking-wider flex items-center justify-between">
                    <span>Duration</span>
                    <span className="text-[8px] font-medium text-brand-muted normal-case italic">Auto-populates from file</span>
                  </label>
                  <input 
                    type="text" 
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 2:40"
                    className="w-full p-2.5 bg-brand-dark/40 border border-brand-border/60 rounded-xl text-xs text-white placeholder-brand-muted focus:border-brand-purple/70 focus:outline-none transition-all"
                  />
                </div>

                {/* Audio Upload File Selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-brand-muted tracking-wider">Audio File</label>
                  <div className="relative border border-dashed border-brand-border hover:border-brand-purple/60 rounded-xl p-4 bg-brand-dark/20 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-brand-dark/30 group">
                    <input 
                      type="file" 
                      accept="audio/mp3,audio/mpeg,audio/wav,audio/m4a,audio/x-m4a"
                      onChange={handleAudioFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                    />
                    <Upload className="w-5 h-5 text-brand-muted group-hover:text-brand-purple transition-all mb-1.5" />
                    <span className="text-xs font-bold text-white">
                      {audioFile ? audioFile.name : 'Select Audio File'}
                    </span>
                    <span className="text-[9px] text-brand-muted mt-0.5">
                      MP3, WAV, M4A up to 50MB
                    </span>
                  </div>
                  {editingSong && !audioFile && (
                    <p className="text-[9px] text-brand-muted flex items-center gap-1">
                      <Info className="w-3 h-3 text-brand-purple" />
                      <span>Existing audio hosted at: <a href={currentAudioUrl} target="_blank" className="underline hover:text-white truncate max-w-[250px] inline-block align-middle">{currentAudioUrl}</a></span>
                    </p>
                  )}
                </div>

                {/* Cover Image Upload (Optional) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-brand-muted tracking-wider">Cover Image (Optional)</label>
                  <div className="relative border border-dashed border-brand-border hover:border-brand-purple/60 rounded-xl p-4 bg-brand-dark/20 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-brand-dark/30 group">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                    />
                    <ImageIcon className="w-5 h-5 text-brand-muted group-hover:text-brand-purple transition-all mb-1.5" />
                    <span className="text-xs font-bold text-white">
                      {coverFile ? coverFile.name : 'Select Cover Image'}
                    </span>
                    <span className="text-[9px] text-brand-muted mt-0.5">
                      PNG, JPEG, WebP, GIF
                    </span>
                  </div>
                  {editingSong && !coverFile && currentCoverUrl && (
                    <p className="text-[9px] text-brand-muted flex items-center gap-1">
                      <Info className="w-3 h-3 text-brand-purple" />
                      <span>Existing cover hosted at: <a href={currentCoverUrl} target="_blank" className="underline hover:text-white truncate max-w-[250px] inline-block align-middle">{currentCoverUrl}</a></span>
                    </p>
                  )}
                </div>

                {/* Switch Swaps */}
                <div className="grid grid-cols-2 gap-3 pt-2 select-none">
                  {/* Quick hide toggle */}
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-brand-dark/30 border border-brand-border/60 hover:bg-brand-dark/45 cursor-pointer transition-all">
                    <input 
                      type="checkbox" 
                      checked={isHidden}
                      onChange={(e) => setIsHidden(e.target.checked)}
                      className="rounded accent-brand-purple cursor-pointer"
                    />
                    <div className="min-w-0">
                      <p className="text-[10px] font-extrabold text-white leading-none">Hide Song</p>
                      <p className="text-[8px] text-brand-muted leading-none mt-0.5">Hides from client list</p>
                    </div>
                  </label>

                  {/* Premium Switch */}
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-brand-dark/30 border border-brand-border/60 hover:bg-brand-dark/45 cursor-pointer transition-all">
                    <input 
                      type="checkbox" 
                      checked={isPremium}
                      onChange={(e) => setIsPremium(e.target.checked)}
                      className="rounded accent-brand-purple cursor-pointer"
                    />
                    <div className="min-w-0">
                      <p className="text-[10px] font-extrabold text-white leading-none">Premium</p>
                      <p className="text-[8px] text-brand-muted leading-none mt-0.5">Subscribers only</p>
                    </div>
                  </label>

                  {/* Featured Switch */}
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-brand-dark/30 border border-brand-border/60 hover:bg-brand-dark/45 cursor-pointer transition-all">
                    <input 
                      type="checkbox" 
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="rounded accent-brand-purple cursor-pointer"
                    />
                    <div className="min-w-0">
                      <p className="text-[10px] font-extrabold text-white leading-none">Featured</p>
                      <p className="text-[8px] text-brand-muted leading-none mt-0.5">Promoted list row</p>
                    </div>
                  </label>

                  {/* Trending Switch */}
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-brand-dark/30 border border-brand-border/60 hover:bg-brand-dark/45 cursor-pointer transition-all">
                    <input 
                      type="checkbox" 
                      checked={isTrending}
                      onChange={(e) => setIsTrending(e.target.checked)}
                      className="rounded accent-brand-purple cursor-pointer"
                    />
                    <div className="min-w-0">
                      <p className="text-[10px] font-extrabold text-white leading-none">Trending</p>
                      <p className="text-[8px] text-brand-muted leading-none mt-0.5">Shows trending tag</p>
                    </div>
                  </label>
                </div>

                {/* Submit Action Buttons */}
                <div className="flex items-center gap-3 pt-4 border-t border-brand-border/20">
                  <CustomButton 
                    type="submit" 
                    disabled={formLoading}
                    variant="glow"
                    className="flex-1"
                  >
                    {formLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                        <span>{uploadStatus || 'Saving Track...'}</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5 mr-1.5" />
                        <span>{editingSong ? 'Update Track' : 'Publish Track'}</span>
                      </>
                    )}
                  </CustomButton>
                  
                  <CustomButton 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    variant="glass"
                    disabled={formLoading}
                  >
                    Cancel
                  </CustomButton>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Persistent Bottom Preview Player */}
      <AnimatePresence>
        {playingTrackId && (() => {
          const playingSong = songs.find(s => s.id === playingTrackId);
          if (!playingSong) return null;

          return (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-brand-black/95 backdrop-blur-xl border border-brand-purple/40 rounded-2xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(168,85,247,0.2)] z-40 select-none flex flex-col gap-2.5"
            >
              {/* Header Info */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  {playingSong.cover_url ? (
                    <img 
                      src={playingSong.cover_url} 
                      alt={playingSong.title} 
                      className="w-10 h-10 rounded-lg object-cover border border-brand-border/60 shrink-0" 
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-brand-dark/60 border border-brand-border flex items-center justify-center text-brand-muted shrink-0">
                      <Music className="w-4 h-4" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h4 className="font-bold text-white text-xs truncate" title={playingSong.title}>
                      {playingSong.title}
                    </h4>
                    <p className="text-[10px] text-brand-muted truncate">
                      {playingSong.artist}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[8px] uppercase font-bold px-1.5 py-0.5 rounded bg-brand-purple/10 text-brand-purple border border-brand-purple/20">
                    {playbackState === 'loading' ? 'Buffering' : playbackState === 'playing' ? 'Playing' : 'Paused'}
                  </span>
                  <button 
                    onClick={handleStopPreview}
                    className="p-1 rounded-lg border border-brand-border hover:text-white hover:border-brand-border/60 text-brand-muted transition-all cursor-pointer bg-brand-dark/30"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress Slider */}
              <div className="flex items-center gap-2 text-[10px] text-brand-muted font-mono">
                <span className="w-8 text-right shrink-0">{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min={0}
                  max={previewDuration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="flex-1 h-1 bg-brand-border rounded-lg appearance-none cursor-pointer accent-brand-pink focus:outline-none"
                />
                <span className="w-8 shrink-0">{formatTime(previewDuration)}</span>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between border-t border-brand-border/30 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleTogglePlayPreview(playingSong)}
                    className="w-8 h-8 rounded-full bg-brand-pink flex items-center justify-center text-white shadow-[0_0_10px_rgba(244,63,94,0.4)] hover:scale-105 active:scale-95 transition-all cursor-pointer flex-shrink-0"
                  >
                    {playbackState === 'loading' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : playbackState === 'playing' ? (
                      <Pause className="w-3.5 h-3.5 fill-current" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    )}
                  </button>
                </div>

                {/* Volume slider */}
                <div className="flex items-center gap-2 shrink-0">
                  <button 
                    type="button"
                    onClick={handleToggleMute}
                    className="text-brand-muted hover:text-white transition-all cursor-pointer"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-brand-pink" /> : <Volume2 className="w-4 h-4 text-brand-purple" />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-16 h-1 bg-brand-border rounded-lg appearance-none cursor-pointer accent-brand-purple focus:outline-none"
                  />
                </div>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
