'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FolderHeart, Eye, Trash2, ExternalLink, 
  Clock, Heart, Plus, Share2, Edit3, Loader2, BarChart3, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomButton from '@/components/ui/CustomButton';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/utils/supabase/client';

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

export default function MySurprises() {
  const { user } = useAuth();
  const [surprises, setSurprises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    if (!user) return;

    const fetchSurprises = async () => {
      const supabase = createClient();
      try {
        let data: any = null;
        let error: any = null;

        const res = await supabase
          .from('surprises')
          .select(`
            id,
            recipient_name,
            relationship_type,
            occasion,
            status,
            plan_type,
            selected_theme,
            surprise_slug,
            created_at,
            photos(image_url, sort_order),
            opens:surprise_analytics(count)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (res.error) {
          if (res.error.code === 'PGRST200' || res.error.code === 'PGRST205' || res.error.message.includes('surprise_analytics')) {
            console.warn('surprise_analytics relationship not found, falling back to surprise_views...');
            const fallbackRes = await supabase
              .from('surprises')
              .select(`
                id,
                recipient_name,
                relationship_type,
                occasion,
                status,
                plan_type,
                selected_theme,
                surprise_slug,
                created_at,
                photos(image_url, sort_order),
                opens:surprise_views(count)
              `)
              .eq('user_id', user.id)
              .order('created_at', { ascending: false });
            
            data = fallbackRes.data;
            error = fallbackRes.error;
          } else {
            error = res.error;
          }
        } else {
          data = res.data;
        }

        if (error) throw error;

        const mapped = (data || []).map((s: any) => ({
          id: s.id,
          slug: s.surprise_slug,
          title: `${s.occasion} surprise for ${s.recipient_name} ❤️`,
          recipientName: s.recipient_name,
          relationship: s.relationship_type || 'Special Someone',
          occasion: s.occasion,
          views: s.opens?.[0]?.count ?? 0,
          status: s.status,
          plan: s.plan_type ? s.plan_type.toLowerCase() : 'free',
          theme: s.selected_theme || 'dreamy',
          thumbnail: s.photos?.sort((a: any, b: any) => a.sort_order - b.sort_order)?.[0]?.image_url || 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400&auto=format&fit=crop&q=80',
          createdAt: s.created_at
        }));

        setSurprises(mapped);
      } catch (err) {
        console.error('Error fetching surprises:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSurprises();

    // Subscribe to realtime views updates
    const supabaseClient = createClient();
    const channel = supabaseClient
      .channel('surprises-list-realtime-views')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'surprise_analytics'
        },
        () => {
          fetchSurprises();
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [user]);

  const handleCopyLink = (slug: string) => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/s/${slug}`;
      navigator.clipboard.writeText(url);
      showToast('Surprise URL link copied to clipboard! Share it with your loved one. ❤️', 'success');
    }
  };

  const handleDeleteSurprise = async (id: string) => {
    if (!confirm('Delete this surprise permanently? This action cannot be undone.')) return;
    const supabase = createClient();
    try {
      // 1. Fetch surprise detail to get all custom assets
      const { data: surprise } = await supabase
        .from('surprises')
        .select(`
          voice_note_url,
          hidden_ending_url,
          photos(image_url),
          music_uploads(music_url)
        `)
        .eq('id', id)
        .maybeSingle();

      const pathsToDelete: string[] = [];
      if (surprise) {
        if (Array.isArray(surprise.photos)) {
          surprise.photos.forEach((p: any) => {
            if (p.image_url) {
              const path = getStoragePathFromUrl(p.image_url);
              if (path) pathsToDelete.push(path);
            }
          });
        }
        if (Array.isArray(surprise.music_uploads)) {
          surprise.music_uploads.forEach((m: any) => {
            if (m.music_url) {
              const path = getStoragePathFromUrl(m.music_url);
              if (path) pathsToDelete.push(path);
            }
          });
        }
        if (surprise.voice_note_url) {
          const path = getStoragePathFromUrl(surprise.voice_note_url);
          if (path) pathsToDelete.push(path);
        }
        if (surprise.hidden_ending_url) {
          const path = getStoragePathFromUrl(surprise.hidden_ending_url);
          if (path) pathsToDelete.push(path);
        }
      }

      // 2. Remove storage assets
      if (pathsToDelete.length > 0) {
        const { error: storageErr } = await supabase.storage
          .from('heartly-storage')
          .remove(pathsToDelete);
        if (storageErr) {
          console.warn("Storage cleanup warning:", storageErr.message);
        }
      }

      // 3. Delete DB record (cascades database tables automatically)
      const { error } = await supabase.from('surprises').delete().eq('id', id);
      if (error) throw error;

      setSurprises((prev) => prev.filter((s) => s.id !== id));
      showToast('Surprise deleted successfully.', 'success');
    } catch (err: any) {
      showToast('Failed to delete surprise: ' + err.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 text-center">
        <Loader2 className="w-6 h-6 text-brand-purple animate-spin" />
        <p className="text-xs text-brand-muted font-semibold">Loading creations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-left select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-white">My Surprises</h1>
          <p className="text-xs text-brand-muted mt-1">Manage and track your active emotional storytelling pages.</p>
        </div>
        <Link href="/dashboard/create">
          <CustomButton variant="glow" size="sm" icon={Plus}>
            Create New
          </CustomButton>
        </Link>
      </div>

      {surprises.length === 0 ? (
        <div className="glass-panel p-16 rounded-3xl border border-brand-border text-center space-y-6">
          <div className="w-12 h-12 rounded-full bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center text-brand-purple mx-auto">
            <Heart className="w-6 h-6 fill-brand-purple/20 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h3 className="font-heading font-bold text-white text-lg">No Surprises Found</h3>
            <p className="text-xs text-brand-muted max-w-sm mx-auto leading-relaxed">
              Start building your first digital surprise story by entering recipient details and memories.
            </p>
          </div>
          <Link href="/dashboard/create">
            <CustomButton variant="primary" size="md">
              Start Wizard Builder
            </CustomButton>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {surprises.map((s) => (
            <div 
              key={s.id} 
              className="glass-card p-5 rounded-3xl border border-brand-border/60 flex flex-col justify-between group"
            >
              <div className="space-y-4">
                {/* Custom Polaroid Frame Thumbnail */}
                <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden border border-white/5 bg-brand-dark/40 shadow-inner">
                  <img 
                    src={s.thumbnail} 
                    alt={s.title} 
                    className="w-full h-full object-cover filter brightness-90 group-hover:scale-102 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3 flex gap-1.5">
                    <span className="text-[8px] font-bold tracking-wider uppercase text-brand-purple px-2 py-0.5 rounded bg-brand-black/55 backdrop-blur-md border border-brand-purple/20">
                      {s.occasion}
                    </span>
                    <span className={`text-[8px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-brand-black/55 backdrop-blur-md border ${
                      s.status === 'active' 
                        ? 'text-emerald-400 border-emerald-500/20' 
                        : 'text-amber-400 border-amber-500/20'
                    }`}>
                      {s.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="font-heading font-bold text-white text-sm leading-snug group-hover:text-brand-purple transition-colors truncate">
                    {s.title}
                  </h3>
                  <p className="text-[10px] text-brand-muted font-semibold">Recipient: {s.recipientName} ({s.relationship})</p>
                </div>

                <div className="flex gap-1.5 pt-1">
                  <span className="text-[8px] font-bold text-brand-muted bg-brand-dark px-2 py-0.5 rounded border border-brand-border capitalize">
                    Theme: {s.theme}
                  </span>
                  <span className="text-[8px] font-bold text-brand-muted bg-brand-dark px-2 py-0.5 rounded border border-brand-border capitalize">
                    {s.plan} tier
                  </span>
                </div>
              </div>

              <div className="pt-5 border-t border-brand-border/40 mt-6 flex items-center justify-between">
                <span className="text-xs text-brand-muted flex items-center gap-1 font-semibold">
                  <Eye className="w-4 h-4 text-brand-blue" />
                  <span>{s.views} views</span>
                </span>

                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => handleCopyLink(s.slug)}
                    className="p-1.5 text-brand-muted hover:text-white rounded-lg border border-brand-border bg-brand-dark/40 cursor-pointer transition-colors"
                    title="Copy Shareable Link"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                  
                  <Link href={`/s/${s.slug}`} target="_blank">
                    <button 
                      className="p-1.5 text-brand-muted hover:text-brand-purple rounded-lg border border-brand-border bg-brand-dark/40 cursor-pointer transition-colors"
                      title="Open Live Surprise"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </Link>

                  <Link href={`/dashboard/create?id=${s.id}`}>
                    <button 
                      className="p-1.5 text-brand-muted hover:text-brand-pink rounded-lg border border-brand-border bg-brand-dark/40 cursor-pointer transition-colors"
                      title="Edit Surprise"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </Link>

                  <Link href={`/dashboard/surprises/${s.id}/insights`}>
                    <button 
                      className="p-1.5 text-brand-muted hover:text-brand-blue rounded-lg border border-brand-border bg-brand-dark/40 cursor-pointer transition-colors"
                      title="View Insights"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                    </button>
                  </Link>

                  <button 
                    onClick={() => handleDeleteSurprise(s.id)}
                    className="p-1.5 text-brand-muted hover:text-brand-pink rounded-lg border border-brand-border bg-brand-dark/40 cursor-pointer transition-colors"
                    title="Delete Surprise"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
  );
}
