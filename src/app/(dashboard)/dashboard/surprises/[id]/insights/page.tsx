'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Eye, Heart, Calendar, ChevronLeft, Monitor, 
  Smartphone, Tablet, Clock, Sparkles, Share2, 
  Copy, ExternalLink, Loader2, Activity, TrendingUp, AlertCircle
} from 'lucide-react';
import CustomButton from '@/components/ui/CustomButton';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/utils/supabase/client';
import { checkAnalyticsSupport, setAnalyticsSupport } from '@/utils/analyticsFallback';

interface AnalyticsEntry {
  id: string;
  opened_at: string;
  completed_at: string | null;
  device_type: string;
  session_id: string;
}

interface SurpriseDetails {
  id: string;
  slug: string;
  recipientName: string;
  occasion: string;
  relationship: string;
  status: 'draft' | 'active' | 'expired';
  plan: string;
  createdAt: string;
}

interface TimelineEvent {
  id: string;
  type: 'open' | 'completion';
  timestamp: string;
  device_type: string;
  session_id: string;
}

export default function SurpriseInsights() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { user } = useAuth();
  
  const [surprise, setSurprise] = useState<SurpriseDetails | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch surprise details and analytics
  const fetchAnalytics = async () => {
    if (!user) return;
    const supabase = createClient();
    try {
      // 1. Fetch surprise details
      const { data: dbSurprise, error: surpriseError } = await supabase
        .from('surprises')
        .select('id, recipient_name, occasion, relationship_type, status, plan_type, surprise_slug, created_at')
        .eq('id', id)
        .single();

      if (surpriseError || !dbSurprise) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setSurprise({
        id: dbSurprise.id,
        slug: dbSurprise.surprise_slug,
        recipientName: dbSurprise.recipient_name,
        occasion: dbSurprise.occasion,
        relationship: dbSurprise.relationship_type || 'Special Someone',
        status: dbSurprise.status as any,
        plan: dbSurprise.plan_type || 'Free',
        createdAt: dbSurprise.created_at
      });

      // 2. Fetch analytics
      let dbAnalytics: any[] = [];
      const useAnalytics = checkAnalyticsSupport();

      if (useAnalytics) {
        const res = await supabase
          .from('surprise_analytics')
          .select('id, opened_at, completed_at, device_type, session_id')
          .eq('surprise_id', id)
          .order('opened_at', { ascending: false });

        if (res.error) {
          if (res.error.code === 'PGRST205' || res.error.code === 'PGRST200' || res.error.message.includes('surprise_analytics')) {
            setAnalyticsSupport(false);
            console.warn('surprise_analytics table not found, falling back to surprise_views...');
            const fallbackRes = await supabase
              .from('surprise_views')
              .select('id, surprise_id, viewed_at, device_type')
              .eq('surprise_id', id)
              .order('viewed_at', { ascending: false });
            
            if (fallbackRes.error) {
              throw fallbackRes.error;
            }
            
            dbAnalytics = (fallbackRes.data || []).map((v: any) => ({
              id: v.id,
              opened_at: v.viewed_at,
              completed_at: null,
              device_type: v.device_type || 'Desktop',
              session_id: v.id
            }));
          } else {
            throw res.error;
          }
        } else {
          dbAnalytics = res.data || [];
        }
      } else {
        const fallbackRes = await supabase
          .from('surprise_views')
          .select('id, surprise_id, viewed_at, device_type')
          .eq('surprise_id', id)
          .order('viewed_at', { ascending: false });
        
        if (fallbackRes.error) {
          throw fallbackRes.error;
        }
        
        dbAnalytics = (fallbackRes.data || []).map((v: any) => ({
          id: v.id,
          opened_at: v.viewed_at,
          completed_at: null,
          device_type: v.device_type || 'Desktop',
          session_id: v.id
        }));
      }

      setAnalytics(dbAnalytics);
      setNotFound(false);
    } catch (err) {
      console.error('Error fetching insights data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    
    fetchAnalytics();

    const supabaseClient = createClient();
    const tableName = checkAnalyticsSupport() ? 'surprise_analytics' : 'surprise_views';
    const channel = supabaseClient
      .channel(`insights-realtime-analytics-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName,
          filter: `surprise_id=eq.${id}`
        },
        () => {
          fetchAnalytics();
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [user, id]);

  const handleCopyLink = () => {
    if (!surprise) return;
    const url = `${window.location.origin}/s/${surprise.slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculations for dashboard panels
  const totalOpens = analytics.length;
  const uniqueOpens = new Set(analytics.map(a => a.session_id)).size;
  const totalCompletions = analytics.filter(a => a.completed_at !== null).length;
  const completionRate = totalOpens > 0 ? `${Math.round((totalCompletions / totalOpens) * 100)}%` : '0%';

  const lastOpenedDate = analytics.length > 0 ? analytics[0].opened_at : null;

  // Device type counts
  const deviceCounts = analytics.reduce((acc, curr) => {
    const dev = curr.device_type ? curr.device_type.toLowerCase() : 'desktop';
    if (dev.includes('mobile')) acc.mobile++;
    else if (dev.includes('tablet')) acc.tablet++;
    else acc.desktop++;
    return acc;
  }, { mobile: 0, desktop: 0, tablet: 0 });

  const mobilePct = totalOpens > 0 ? Math.round((deviceCounts.mobile / totalOpens) * 100) : 0;
  const desktopPct = totalOpens > 0 ? Math.round((deviceCounts.desktop / totalOpens) * 100) : 0;
  const tabletPct = totalOpens > 0 ? Math.round((deviceCounts.tablet / totalOpens) * 100) : 0;

  // Helper to format absolute timestamps
  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Helper to format relative time (e.g., "2 mins ago")
  const formatRelativeTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  // Helper to format timeline dates (e.g. "Opened today at 8:34 PM")
  const formatTimelineDate = (dateStr: string, type: 'open' | 'completion') => {
    const d = new Date(dateStr);
    const now = new Date();
    const timeStr = formatTime(dateStr);
    const action = type === 'open' ? 'Opened' : 'Completed';
    
    const isToday = d.toDateString() === now.toDateString();
    
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();
    
    if (isToday) {
      return `${action} today at ${timeStr}`;
    } else if (isYesterday) {
      return `${action} yesterday at ${timeStr}`;
    } else {
      return `${action} on ${formatDate(dateStr)} at ${timeStr}`;
    }
  };

  // Helper to get device icon
  const getDeviceIcon = (deviceStr: string) => {
    const dev = deviceStr.toLowerCase();
    if (dev.includes('mobile')) return <Smartphone className="w-3.5 h-3.5" />;
    if (dev.includes('tablet')) return <Tablet className="w-3.5 h-3.5" />;
    return <Monitor className="w-3.5 h-3.5" />;
  };

  // Build sorted timeline events list
  const timelineEvents: TimelineEvent[] = [];
  analytics.forEach(a => {
    timelineEvents.push({
      id: `${a.id}-open`,
      type: 'open',
      timestamp: a.opened_at,
      device_type: a.device_type,
      session_id: a.session_id
    });
    if (a.completed_at) {
      timelineEvents.push({
        id: `${a.id}-complete`,
        type: 'completion',
        timestamp: a.completed_at,
        device_type: a.device_type,
        session_id: a.session_id
      });
    }
  });
  timelineEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3 text-center">
        <Loader2 className="w-8 h-8 text-brand-purple animate-spin" />
        <p className="text-sm text-brand-muted font-semibold">Gathering emotional insights...</p>
      </div>
    );
  }

  if (notFound || !surprise) {
    return (
      <div className="glass-panel p-16 rounded-3xl border border-brand-border text-center space-y-6 max-w-md mx-auto mt-12">
        <div className="w-12 h-12 rounded-full bg-brand-pink/10 border border-brand-pink/20 flex items-center justify-center text-brand-pink mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h3 className="font-heading font-bold text-white text-lg">Insights Not Found</h3>
          <p className="text-xs text-brand-muted max-w-sm mx-auto leading-relaxed">
            The surprise page does not exist or you do not have permission to view its analytics.
          </p>
        </div>
        <Link href="/dashboard/surprises">
          <CustomButton variant="primary" size="md">
            Go back to My Surprises
          </CustomButton>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-left select-none max-w-5xl mx-auto">
      
      {/* Back button and Header */}
      <div className="space-y-4">
        <button 
          onClick={() => router.back()} 
          className="text-xs text-brand-muted hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Back to creations</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl border border-brand-purple/20 bg-gradient-to-r from-brand-purple/10 to-brand-pink/5 relative overflow-hidden">
          <div className="absolute top-0 right-1/4 w-[150px] h-[150px] glow-purple opacity-10 pointer-events-none" />
          
          <div className="space-y-2 relative z-10">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-white text-glow">
                {surprise.recipientName}’s Surprise Insights ❤️
              </h1>
              <span className={`text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded ${
                surprise.status === 'active' 
                  ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' 
                  : 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
              }`}>
                {surprise.status}
              </span>
            </div>
            <p className="text-xs text-brand-muted">
              Occasion: <span className="text-white font-semibold">{surprise.occasion}</span> ({surprise.relationship}) • Created on {formatDate(surprise.createdAt)}
            </p>
          </div>

          <div className="flex items-center gap-2 relative z-10">
            <button 
              onClick={handleCopyLink}
              className="px-3.5 py-2 rounded-xl border border-brand-border bg-brand-dark hover:border-white/10 text-xs text-white cursor-pointer transition-all inline-flex items-center gap-1.5 font-semibold"
            >
              <Copy className="w-3.5 h-3.5 text-brand-pink" />
              <span>{copied ? 'Copied! ❤️' : 'Copy Link'}</span>
            </button>

            <Link href={`/s/${surprise.slug}`} target="_blank">
              <CustomButton variant="glow" size="sm" icon={ExternalLink}>
                Open Surprise
              </CustomButton>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid Panels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        
        {/* Total Opens Card */}
        <div className="glass-card p-6 rounded-2xl border border-brand-border/60 flex flex-col justify-between min-h-[130px] relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-brand-muted">Total Opens 👀</span>
            <div className="p-2 rounded-lg border text-brand-purple bg-brand-purple/10 border-brand-purple/20 group-hover:scale-105 transition-transform duration-300">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="pt-2">
            <h3 className="text-3xl font-heading font-extrabold text-white tracking-tight">
              {totalOpens === 0 ? 'No Data Yet' : totalOpens}
            </h3>
            <p className="text-[10px] text-brand-muted mt-1">Total page unlocks & opens</p>
          </div>
        </div>

        {/* Unique Opens Card */}
        <div className="glass-card p-6 rounded-2xl border border-brand-border/60 flex flex-col justify-between min-h-[130px] relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-brand-muted">Unique Opens 💖</span>
            <div className="p-2 rounded-lg border text-brand-pink bg-brand-pink/10 border-brand-pink/20 group-hover:scale-105 transition-transform duration-300">
              <Heart className="w-4 h-4 fill-brand-pink/20" />
            </div>
          </div>
          <div className="pt-2">
            <h3 className="text-3xl font-heading font-extrabold text-white tracking-tight">
              {totalOpens === 0 ? 'No Data Yet' : uniqueOpens}
            </h3>
            <p className="text-[10px] text-brand-muted mt-1">Deduplicated unique visitor sessions</p>
          </div>
        </div>

        {/* Total Completions Card */}
        <div className="glass-card p-6 rounded-2xl border border-brand-border/60 flex flex-col justify-between min-h-[130px] relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-brand-muted">Total Completions ✨</span>
            <div className="p-2 rounded-lg border text-emerald-400 bg-emerald-500/10 border-emerald-500/20 group-hover:scale-105 transition-transform duration-300">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="pt-2">
            <h3 className="text-3xl font-heading font-extrabold text-white tracking-tight">
              {totalOpens === 0 ? 'No Data Yet' : totalCompletions}
            </h3>
            <p className="text-[10px] text-brand-muted mt-1">Completed cinematic slides</p>
          </div>
        </div>

        {/* Completion Rate Card */}
        <div className="glass-card p-6 rounded-2xl border border-brand-border/60 flex flex-col justify-between min-h-[130px] relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-brand-muted">Completion Rate 📈</span>
            <div className="p-2 rounded-lg border text-brand-purple bg-brand-purple/10 border-brand-purple/20 group-hover:scale-105 transition-transform duration-300">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="pt-2">
            <h3 className="text-3xl font-heading font-extrabold text-white tracking-tight">
              {totalOpens === 0 ? 'No Data Yet' : completionRate}
            </h3>
            <p className="text-[10px] text-brand-muted mt-1">Percent of viewers who finished</p>
          </div>
        </div>

        {/* Last Opened Card */}
        <div className="glass-card p-6 rounded-2xl border border-brand-border/60 flex flex-col justify-between min-h-[130px] relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-brand-muted">Last Opened 🕒</span>
            <div className="p-2 rounded-lg border text-brand-blue bg-brand-blue/10 border-brand-blue/20 group-hover:scale-105 transition-transform duration-300">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="pt-2">
            <h4 className="text-sm font-heading font-bold text-white leading-snug">
              {totalOpens === 0 ? 'No Data Yet' : (lastOpenedDate ? formatRelativeTime(lastOpenedDate) : 'Never')}
            </h4>
            <p className="text-[10px] text-brand-muted mt-1">
              {totalOpens === 0 ? 'Waiting for receiver...' : (lastOpenedDate ? `At ${formatTime(lastOpenedDate)}` : 'Waiting for receiver...')}
            </p>
          </div>
        </div>

      </div>

      {/* Subgrids for Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Device Breakdown Box */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="font-heading font-bold text-white text-base">Device Breakdown</h3>
          
          <div className="glass-panel p-6 rounded-2xl border border-brand-border/60 space-y-6">
            
            {/* Visual Progress Bar Ratios */}
            <div className="space-y-4">
              {/* Mobile */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-brand-muted flex items-center gap-1.5 font-medium">
                    <Smartphone className="w-4 h-4 text-brand-pink" />
                    <span>📱 Mobile</span>
                  </span>
                  <span className="text-white font-bold">{mobilePct}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-brand-dark overflow-hidden border border-white/5">
                  <div className="h-full bg-gradient-to-r from-brand-pink to-brand-purple rounded-full" style={{ width: `${mobilePct}%` }} />
                </div>
              </div>

              {/* Desktop */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-brand-muted flex items-center gap-1.5 font-medium">
                    <Monitor className="w-4 h-4 text-brand-purple" />
                    <span>💻 Desktop</span>
                  </span>
                  <span className="text-white font-bold">{desktopPct}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-brand-dark overflow-hidden border border-white/5">
                  <div className="h-full bg-gradient-to-r from-brand-purple to-indigo-500 rounded-full" style={{ width: `${desktopPct}%` }} />
                </div>
              </div>

              {/* Tablet */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-brand-muted flex items-center gap-1.5 font-medium">
                    <Tablet className="w-4 h-4 text-brand-blue" />
                    <span>📲 Tablet</span>
                  </span>
                  <span className="text-white font-bold">{tabletPct}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-brand-dark overflow-hidden border border-white/5">
                  <div className="h-full bg-gradient-to-r from-brand-blue to-teal-500 rounded-full" style={{ width: `${tabletPct}%` }} />
                </div>
              </div>
            </div>

            {/* Counts Breakdown Details */}
            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-brand-border/40 text-center">
              <div>
                <h5 className="text-white font-bold text-base">{deviceCounts.mobile}</h5>
                <p className="text-[9px] text-brand-muted">Mobile Views</p>
              </div>
              <div>
                <h5 className="text-white font-bold text-base">{deviceCounts.desktop}</h5>
                <p className="text-[9px] text-brand-muted">Desktop Views</p>
              </div>
              <div>
                <h5 className="text-white font-bold text-base">{deviceCounts.tablet}</h5>
                <p className="text-[9px] text-brand-muted">Tablet Views</p>
              </div>
            </div>

          </div>

          {/* Quick tips card */}
          <div className="glass-panel p-5 rounded-2xl border border-brand-border/40 bg-brand-dark/20 text-xs text-brand-muted leading-relaxed flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-brand-purple shrink-0 mt-0.5" />
            <p>
              <strong className="text-white">Pro Tip:</strong> Most surprises are opened on mobile devices. Ensure your memories and captions are mobile-friendly! Real-time sync is active, so you can watch views appear here instantly when shared.
            </p>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-white text-base">Activity Timeline</h3>
            <span className="text-[9px] font-bold text-brand-muted bg-brand-dark border border-brand-border px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Live tracking active</span>
            </span>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-brand-border/60 max-h-[350px] overflow-y-auto custom-scrollbar relative">
            {timelineEvents.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-10 h-10 rounded-full border border-brand-border flex items-center justify-center text-brand-muted mx-auto">
                  <Activity className="w-5 h-5" />
                </div>
                <p className="text-xs text-brand-muted max-w-xs mx-auto leading-relaxed">
                  No views recorded yet. Share the link with your recipient to begin tracking their emotional reactions!
                </p>
              </div>
            ) : (
              <div className="relative border-l border-brand-border/40 pl-5 ml-2.5 space-y-6">
                {timelineEvents.map((evt) => {
                  const isCompletion = evt.type === 'completion';
                  return (
                    <div key={evt.id} className="relative group text-left">
                      {/* Timeline dot connector */}
                      <span className={`absolute -left-[27.5px] top-0.5 w-4.5 h-4.5 rounded-full border flex items-center justify-center transition-all ${
                        isCompletion 
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 scale-110 shadow-[0_0_8px_rgba(16,185,129,0.3)]' 
                          : 'bg-brand-purple/20 border-brand-purple text-brand-purple scale-110 shadow-[0_0_8px_rgba(168,85,247,0.3)]'
                      }`}>
                        {isCompletion ? <Sparkles className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
                      </span>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold ${isCompletion ? 'text-emerald-400 font-extrabold' : 'text-brand-purple font-extrabold'}`}>
                            {isCompletion ? '✨ Surprise Completed!' : '👀 Surprise Opened'}
                          </span>
                          <span className="text-[8px] font-bold tracking-wider uppercase bg-brand-dark px-1.5 py-0.5 rounded border border-brand-border/40 flex items-center gap-1 text-brand-muted">
                            {getDeviceIcon(evt.device_type)}
                            <span>{evt.device_type}</span>
                          </span>
                        </div>
                        <p className="text-xs text-brand-muted leading-relaxed">
                          {formatTimelineDate(evt.timestamp, evt.type)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
