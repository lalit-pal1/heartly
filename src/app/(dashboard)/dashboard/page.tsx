'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  FolderHeart, Eye, Link2, Sparkles, Clock, 
  ChevronRight, ExternalLink, Share2, Plus, 
  ArrowRight, Heart, ShoppingBag, Edit3, Loader2, BarChart3, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomButton from '@/components/ui/CustomButton';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/utils/supabase/client';

export default function DashboardHome() {
  const { user } = useAuth();
  const [surprises, setSurprises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const totalSurprises = surprises.length;
  const activeLinks = surprises.filter((s) => s.status === 'active').length;
  const totalViews = surprises.reduce((acc, curr) => acc + curr.views, 0);

  const stats = [
    { label: 'Total Surprises', value: totalSurprises, icon: FolderHeart, desc: 'Created stories', color: 'text-brand-purple bg-brand-purple/10 border-brand-purple/20' },
    { label: 'Active Links', value: activeLinks, icon: Link2, desc: 'Live public URLs', color: 'text-brand-pink bg-brand-pink/10 border-brand-pink/20' },
    { label: 'Total Views', value: totalViews, icon: Eye, desc: 'Loved ones who smiled', color: 'text-brand-blue bg-brand-blue/10 border-brand-blue/20' },
  ];

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
          thumbnail: s.photos?.sort((a: any, b: any) => a.sort_order - b.sort_order)?.[0]?.image_url || 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=100&auto=format&fit=crop&q=80',
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
  }, [user]);

  const handleCopyLink = (slug: string) => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/s/${slug}`;
      navigator.clipboard.writeText(url);
      showToast('Surprise URL link copied! Share it with your loved one. ❤️', 'success');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 text-center">
        <Loader2 className="w-6 h-6 text-brand-purple animate-spin" />
        <p className="text-xs text-brand-muted font-semibold">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 text-left select-none">
      
      {/* Welcome Hero Banner with Background Lighting */}
      <div className="relative overflow-hidden border border-brand-purple/20 bg-gradient-to-r from-brand-purple/15 to-brand-pink/5 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="absolute top-0 right-1/4 w-[200px] h-[200px] glow-purple opacity-20 pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[200px] h-[200px] glow-pink opacity-20 pointer-events-none" />
        
        <div className="space-y-2 relative z-10">
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-white text-glow">
            Welcome back, Lalit ❤️
          </h1>
          <p className="text-xs text-brand-muted max-w-sm">
            Ready to make someone smile today? Design another cinematic digital surprise.
          </p>
        </div>
        
        <Link href="/dashboard/create" className="relative z-10 shrink-0">
          <CustomButton variant="glow" size="md" icon={Plus}>
            New Surprise
          </CustomButton>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {stats.map((s) => (
          <div key={s.label} className="glass-card p-6 rounded-2xl border border-brand-border/60 flex flex-col justify-between min-h-[140px] group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-brand-muted">{s.label}</span>
              <div className={`p-2.5 rounded-lg border ${s.color} group-hover:scale-105 transition-transform duration-300`}>
                <s.icon className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="pt-4">
              <h3 className="text-3xl font-heading font-extrabold text-white tracking-tight">{s.value}</h3>
              <p className="text-[10px] text-brand-muted mt-1">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Surprises Table-Card Hybrid list */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-bold text-white text-base">Recent Creations</h3>
          <Link href="/dashboard/surprises" className="text-xs text-brand-purple hover:underline flex items-center gap-1 font-semibold">
            <span>View all surprises</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {surprises.length === 0 ? (
          <div className="glass-panel p-16 rounded-3xl border border-brand-border text-center space-y-6">
            <div className="w-12 h-12 rounded-full bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center text-brand-purple mx-auto">
              <Heart className="w-6 h-6 fill-brand-purple/20" />
            </div>
            <div className="space-y-2">
              <h4 className="font-heading font-bold text-white text-base">No Surprise Pages Found</h4>
              <p className="text-xs text-brand-muted max-w-sm mx-auto leading-relaxed">
                Design custom memory slideshows, write letters, choose music, and schedule unlock timers.
              </p>
            </div>
            <Link href="/dashboard/create">
              <CustomButton variant="primary" size="md">
                Create First Surprise
              </CustomButton>
            </Link>
          </div>
        ) : (
          <div className="glass-panel rounded-2xl border border-brand-border/60 overflow-hidden">
            {/* Desktop Hybrid Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-brand-border text-brand-muted text-[10px] font-bold uppercase tracking-wider bg-brand-dark/20">
              <div className="col-span-4">Recipient / Memory Story</div>
              <div className="col-span-2">Occasion badge</div>
              <div className="col-span-2">Live Views</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-3 text-right">Actions</div>
            </div>

            {/* List Rows */}
            <div className="divide-y divide-brand-border/40">
              {surprises.slice(0, 3).map((s) => (
                <div 
                  key={s.id} 
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-white/[0.02] transition-colors text-xs text-brand-muted text-left"
                >
                  {/* Recipient Polaroid Thumbnail column */}
                  <div className="col-span-12 md:col-span-4 flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-white/5 bg-brand-dark/40 shrink-0">
                      <Image 
                        src={s.thumbnail} 
                        alt="memory thumbnail" 
                        fill
                        sizes="48px"
                        className="object-cover filter brightness-90"
                      />
                    </div>
                    <div>
                      <h4 className="font-heading font-bold text-white text-sm leading-snug truncate max-w-[200px]">{s.title}</h4>
                      <p className="text-[10px] text-brand-muted mt-0.5">To: {s.recipientName} ({s.relationship})</p>
                    </div>
                  </div>

                  {/* Occasion Column */}
                  <div className="col-span-6 md:col-span-2">
                    <span className="text-[9px] font-bold tracking-wider uppercase text-brand-purple px-2.5 py-0.5 rounded bg-brand-purple/10 border border-brand-purple/20">
                      {s.occasion}
                    </span>
                  </div>

                  {/* Views Column */}
                  <div className="col-span-6 md:col-span-2 flex items-center gap-1.5 font-medium text-white">
                    <Eye className="w-4 h-4 text-brand-blue" />
                    <span>{s.views} views</span>
                  </div>

                  {/* Status Column */}
                  <div className="col-span-6 md:col-span-1">
                    <span className={`text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded ${
                      s.status === 'active' 
                        ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' 
                        : 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                    }`}>
                      {s.status}
                    </span>
                  </div>

                  {/* Actions Column */}
                  <div className="col-span-12 md:col-span-3 flex items-center justify-end gap-2">
                    <button 
                      onClick={() => handleCopyLink(s.slug)}
                      className="p-2 text-brand-muted hover:text-white rounded-lg border border-brand-border bg-brand-dark/40 cursor-pointer transition-colors"
                      title="Copy Sharing Link"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    
                    <Link href={`/s/${s.slug}`} target="_blank">
                      <button 
                        className="p-2 text-brand-muted hover:text-brand-purple rounded-lg border border-brand-border bg-brand-dark/40 cursor-pointer transition-colors"
                        title="Open Live Surprise"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </Link>

                    <Link href={`/dashboard/create?id=${s.id}`}>
                      <button 
                        className="p-2 text-brand-muted hover:text-brand-pink rounded-lg border border-brand-border bg-brand-dark/40 cursor-pointer transition-colors"
                        title="Edit Details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </Link>

                    <Link href={`/dashboard/surprises/${s.id}/insights`}>
                      <button 
                        className="p-2 text-brand-muted hover:text-brand-blue rounded-lg border border-brand-border bg-brand-dark/40 cursor-pointer transition-colors"
                        title="View Insights"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                      </button>
                    </Link>
                  </div>

                </div>
              ))}
            </div>

          </div>
        )}
      </div>

      {/* Quick Actions Panel Cards */}
      <div className="space-y-4">
        <h3 className="font-heading font-bold text-white text-base">Quick Shortcuts</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          
          <Link href="/dashboard/create">
            <div className="glass-card p-6 rounded-2xl border border-brand-border/60 flex items-center justify-between cursor-pointer group">
              <div className="space-y-1">
                <h4 className="font-heading font-bold text-white text-sm">Create Surprise</h4>
                <p className="text-[10px] text-brand-muted">Craft a cinematic experience</p>
              </div>
              <div className="p-2 rounded-full border border-brand-border bg-brand-dark group-hover:bg-brand-purple/10 group-hover:border-brand-purple/20 transition-all text-brand-muted group-hover:text-brand-purple">
                <Sparkles className="w-4 h-4 shrink-0" />
              </div>
            </div>
          </Link>

          <Link href="/dashboard/surprises">
            <div className="glass-card p-6 rounded-2xl border border-brand-border/60 flex items-center justify-between cursor-pointer group">
              <div className="space-y-1">
                <h4 className="font-heading font-bold text-white text-sm">My Surprises</h4>
                <p className="text-[10px] text-brand-muted">Check views and links</p>
              </div>
              <div className="p-2 rounded-full border border-brand-border bg-brand-dark group-hover:bg-brand-pink/10 group-hover:border-brand-pink/20 transition-all text-brand-muted group-hover:text-brand-pink">
                <Heart className="w-4 h-4 shrink-0" />
              </div>
            </div>
          </Link>

          <Link href="/dashboard/orders">
            <div className="glass-card p-6 rounded-2xl border border-brand-border/60 flex items-center justify-between cursor-pointer group">
              <div className="space-y-1">
                <h4 className="font-heading font-bold text-white text-sm">Order History</h4>
                <p className="text-[10px] text-brand-muted">Review invoices and plans</p>
              </div>
              <div className="p-2 rounded-full border border-brand-border bg-brand-dark group-hover:bg-brand-blue/10 group-hover:border-brand-blue/20 transition-all text-brand-muted group-hover:text-brand-blue">
                <ShoppingBag className="w-4 h-4 shrink-0" />
              </div>
            </div>
          </Link>

        </div>
      </div>

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
