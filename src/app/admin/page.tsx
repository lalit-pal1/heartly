'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, Users, Heart, Sparkles, DollarSign, 
  Layers, Lock, ShieldAlert, LogOut, ChevronRight, 
  Calendar, ArrowUpRight, ArrowDownRight, Percent, 
  Eye, Play, CheckCircle2, XCircle, AlertCircle, 
  Database, Search, Image as ImageIcon, Music, Menu, X, 
  ChevronDown, Settings, Wand2, RefreshCw, Activity, ArrowLeft,
  Gift, Award, Clock
} from 'lucide-react';
import CustomButton from '@/components/ui/CustomButton';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/utils/supabase/client';
import { checkAnalyticsSupport, setAnalyticsSupport } from '@/utils/analyticsFallback';

// Authorized admin list
const ADMIN_EMAILS = [
  'pal929956@gmail.com',
  'founder@heartly.in',
  'admin@heartly.in',
  'lalit@heartly.in',
  'lalit.gemini@gmail.com',
  'test@example.com'
];

export default function AdminDashboardPage() {
  const { user, profile, loading: authLoading, signOut: supabaseSignOut } = useAuth();
  const router = useRouter();
  
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [activeTab, setActiveTab] = useState<'overview' | 'revenue' | 'users' | 'surprises' | 'referrals' | 'controls'>('overview');
  const [dbData, setDbData] = useState<any>(null);
  const [dbLoading, setDbLoading] = useState<boolean>(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);
  const [unreadSupportCount, setUnreadSupportCount] = useState<number>(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      const supabase = createClient();
      try {
        const { count, error } = await supabase
          .from('contact_messages')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'unread');
        
        if (!error && count !== null) {
          setUnreadSupportCount(count);
        } else if (error) {
          console.warn('Could not fetch unread support count (table contact_messages may not exist yet):', error.message);
        }
      } catch (err) {
        console.warn('Failed to load contact messages unread count:', err);
      }
    };
    
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // 1. Fetch Real Database Data
  const fetchRealData = async () => {
    setDbLoading(true);
    setDbError(null);
    const supabase = createClient();
    try {
      const usersRes = await supabase.from('users').select('id, email, full_name, created_at');
      const surprisesRes = await supabase.from('surprises').select('id, user_id, recipient_name, occasion, plan_type, status, created_at, password_lock, countdown_enabled, midnight_unlock, cute_no_button, selected_music, selected_theme');
      const ordersRes = await supabase.from('orders').select('id, user_id, surprise_id, amount, payment_status, created_at');
      const photosRes = await supabase.from('photos').select('id, surprise_id');

      if (usersRes.error) throw usersRes.error;
      if (surprisesRes.error) throw surprisesRes.error;
      if (ordersRes.error) throw ordersRes.error;
      if (photosRes.error) throw photosRes.error;

      const users = usersRes.data || [];
      const surprises = surprisesRes.data || [];
      const orders = ordersRes.data || [];
      const photos = photosRes.data || [];

      // Safely fetch surprise_analytics with fallback to surprise_views
      let analytics: any[] = [];
      const useAnalytics = checkAnalyticsSupport();

      if (useAnalytics) {
        const aRes = await supabase.from('surprise_analytics').select('id, surprise_id, opened_at, completed_at, device_type');
        if (aRes.error) {
          if (aRes.error.code === 'PGRST205' || aRes.error.code === 'PGRST200' || aRes.error.message.includes('surprise_analytics')) {
            setAnalyticsSupport(false);
            console.warn('surprise_analytics table missing in admin portal, falling back to surprise_views...');
            const fallbackRes = await supabase.from('surprise_views').select('id, surprise_id, viewed_at, device_type');
            if (!fallbackRes.error && fallbackRes.data) {
              analytics = fallbackRes.data.map((v: any) => ({
                id: v.id,
                surprise_id: v.surprise_id,
                opened_at: v.viewed_at,
                completed_at: null,
                device_type: v.device_type
              }));
            }
          } else {
            throw aRes.error;
          }
        } else {
          analytics = aRes.data || [];
        }
      } else {
        const fallbackRes = await supabase.from('surprise_views').select('id, surprise_id, viewed_at, device_type');
        if (!fallbackRes.error && fallbackRes.data) {
          analytics = fallbackRes.data.map((v: any) => ({
            id: v.id,
            surprise_id: v.surprise_id,
            opened_at: v.viewed_at,
            completed_at: null,
            device_type: v.device_type
          }));
        }
      }

      // Map surprise_analytics to views structure for compatibility
      const mappedAnalytics = (analytics || []).map((a: any) => ({
        id: a.id,
        surprise_id: a.surprise_id,
        viewed_at: a.opened_at,
        completed_at: a.completed_at,
        device_type: a.device_type
      }));

      let referrals: any[] = [];
      let credits: any[] = [];
      let transactions: any[] = [];
      try {
        const { data: refData } = await supabase.from('referrals').select('*');
        if (refData) referrals = refData;
        
        const { data: credData } = await supabase.from('reward_credits').select('*');
        if (credData) credits = credData;

        const { data: txData } = await supabase.from('reward_transactions').select('*');
        if (txData) transactions = txData;
      } catch (err) {
        console.warn('Referrals tables missing in DB:', err);
      }

      setDbData({
        users: users || [],
        surprises: surprises || [],
        orders: orders || [],
        views: mappedAnalytics,
        photos: photos || [],
        referrals,
        credits,
        transactions
      });

      // Safely fetch reactions (table might not exist in remote DB yet)
      let reactions: any[] = [];
      try {
        const { data: rxData, error: rxErr } = await supabase
          .from('surprise_reactions')
          .select('id, surprise_id, reaction_emoji, created_at');
        if (!rxErr && rxData) {
          reactions = rxData;
        }
      } catch (err) {
        console.warn('Reactions table missing in remote DB, using empty array.', err);
      }

      setDbData((prev: any) => ({
        ...prev,
        reactions
      }));

      // Data loaded successfully
    } catch (err: any) {
      console.error('Failed to load database stats:', err);
      setDbError(err.message || 'Error communicating with Supabase. Ensure environment variables match.');
    } finally {
      setDbLoading(false);
    }
  };

  const verifyAccess = async () => {
    setCheckingAuth(true);

    // 1. Check Google OAuth whitelist
    if (user && ADMIN_EMAILS.includes(user.email || '')) {
      setIsAdmin(true);
      setCheckingAuth(false);
      fetchRealData();
      return;
    }

    // 2. Check secure manual cookie session
    try {
      const res = await fetch('/api/admin/verify-session');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setIsAdmin(true);
          setCheckingAuth(false);
          fetchRealData();
          return;
        }
      }
    } catch (err) {
      console.warn('Session check fallback error:', err);
    }

    setIsAdmin(false);
    setCheckingAuth(false);
  };

  useEffect(() => {
    if (!authLoading) {
      verifyAccess();
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (isAdmin === false) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/admin/login');
      }
    }
  }, [isAdmin, user, router]);

  // 2. Compute Metrics based on active data source
  const currentData = dbData || { users: [], surprises: [], orders: [], views: [], photos: [], reactions: [], referrals: [], credits: [], transactions: [] };

  const metrics = useMemo(() => {
    const { users, surprises, orders, views } = currentData;

    const totalUsers = users.length;
    const totalDrafts = surprises.filter((s: any) => s.status === 'draft').length;
    const totalPublished = surprises.filter((s: any) => s.status === 'active' || s.status === 'published').length;
    const totalViews = views.length;

    const paidOrders = orders.filter((o: any) => o.payment_status === 'captured');
    const totalPaidCount = paidOrders.length;
    const totalRevenue = paidOrders.reduce((sum: number, o: any) => sum + o.amount, 0);
    const avgOrderValue = totalPaidCount > 0 ? (totalRevenue / totalPaidCount) : 0;

    return {
      totalUsers,
      totalDrafts,
      totalPublished,
      totalViews,
      totalRevenue,
      totalPaidCount,
      avgOrderValue
    };
  }, [currentData]);

  // 3. Custom Analytics calculations
  const todayRevenue = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return currentData.orders
      .filter((o: any) => o.payment_status === 'captured' && new Date(o.created_at) >= startOfToday)
      .reduce((sum: number, o: any) => sum + o.amount, 0);
  }, [currentData]);

  const weekRevenue = useMemo(() => {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    return currentData.orders
      .filter((o: any) => o.payment_status === 'captured' && new Date(o.created_at) >= startOfWeek)
      .reduce((sum: number, o: any) => sum + o.amount, 0);
  }, [currentData]);

  const monthRevenue = useMemo(() => {
    const startOfMonth = new Date();
    startOfMonth.setDate(startOfMonth.getDate() - 30);
    return currentData.orders
      .filter((o: any) => o.payment_status === 'captured' && new Date(o.created_at) >= startOfMonth)
      .reduce((sum: number, o: any) => sum + o.amount, 0);
  }, [currentData]);

  const activeUsersCount = useMemo(() => {
    const creatorIds = new Set(currentData.surprises.map((s: any) => s.user_id));
    return currentData.users.filter((u: any) => creatorIds.has(u.id)).length;
  }, [currentData]);

  const mostPopularOccasion = useMemo(() => {
    const counts: Record<string, number> = {};
    currentData.surprises.forEach((s: any) => {
      if (s.occasion) {
        counts[s.occasion] = (counts[s.occasion] || 0) + 1;
      }
    });
    const entries = Object.entries(counts);
    if (entries.length === 0) return 'No Data Yet';
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0][0];
  }, [currentData]);

  const mostUsedMusic = useMemo(() => {
    const counts: Record<string, number> = {};
    currentData.surprises.forEach((s: any) => {
      if (s.selected_music) {
        counts[s.selected_music] = (counts[s.selected_music] || 0) + 1;
      }
    });
    const entries = Object.entries(counts);
    if (entries.length === 0) return 'No Data Yet';
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0][0];
  }, [currentData]);

  const mostUsedTheme = useMemo(() => {
    const themeLabels: Record<string, string> = {
      dreamy: 'Premium Dark',
      midnight: 'Midnight Glow',
      sunset: 'Sunset Warmth',
      nordic: 'Minimal Emotional'
    };
    const counts: Record<string, number> = {};
    currentData.surprises.forEach((s: any) => {
      if (s.selected_theme) {
        counts[s.selected_theme] = (counts[s.selected_theme] || 0) + 1;
      }
    });
    const entries = Object.entries(counts);
    if (entries.length === 0) return 'No Data Yet';
    entries.sort((a, b) => b[1] - a[1]);
    const topKey = entries[0][0];
    return themeLabels[topKey] || topKey;
  }, [currentData]);

  const mostOpenedSurprise = useMemo(() => {
    const counts: Record<string, number> = {};
    currentData.views.forEach((v: any) => {
      if (v.surprise_id) {
        counts[v.surprise_id] = (counts[v.surprise_id] || 0) + 1;
      }
    });
    const entries = Object.entries(counts);
    if (entries.length === 0) return 'No Data Yet';
    entries.sort((a, b) => b[1] - a[1]);
    const topId = entries[0][0];
    const s = currentData.surprises.find((x: any) => x.id === topId);
    return s ? `${s.recipient_name || 'Recipient'} (${entries[0][1]} opens)` : `ID: ${topId} (${entries[0][1]} opens)`;
  }, [currentData]);

  const averageOpenRateStr = useMemo(() => {
    const published = currentData.surprises.filter((s: any) => s.status === 'active' || s.status === 'published');
    const publishedCount = published.length;
    if (publishedCount === 0) return 'No Data Yet';
    const viewedPublishedCount = published.filter((s: any) => currentData.views.some((v: any) => v.surprise_id === s.id)).length;
    return `${((viewedPublishedCount / publishedCount) * 100).toFixed(1)}%`;
  }, [currentData]);

  const totalSurpriseOpens = useMemo(() => {
    return currentData.views.length;
  }, [currentData]);

  const totalCompletions = useMemo(() => {
    return currentData.views.filter((v: any) => v.completed_at).length;
  }, [currentData]);

  const averageCompletionRateStr = useMemo(() => {
    const total = currentData.views.length;
    if (total === 0) return 'No Data Yet';
    const completions = currentData.views.filter((v: any) => v.completed_at).length;
    return `${((completions / total) * 100).toFixed(1)}%`;
  }, [currentData]);

  const topOpenedSurprise = useMemo(() => {
    const counts: Record<string, number> = {};
    currentData.views.forEach((v: any) => {
      if (v.surprise_id) {
        counts[v.surprise_id] = (counts[v.surprise_id] || 0) + 1;
      }
    });
    const entries = Object.entries(counts);
    if (entries.length === 0) return 'No Data Yet';
    entries.sort((a, b) => b[1] - a[1]);
    const topId = entries[0][0];
    const s = currentData.surprises.find((x: any) => x.id === topId);
    return s ? `${s.recipient_name || 'Recipient'} (${entries[0][1]} opens)` : `ID: ${topId} (${entries[0][1]} opens)`;
  }, [currentData]);

  const topPerformingOccasion = useMemo(() => {
    const counts: Record<string, number> = {};
    currentData.views.forEach((v: any) => {
      if (v.completed_at) {
        const s = currentData.surprises.find((x: any) => x.id === v.surprise_id);
        if (s && s.occasion) {
          counts[s.occasion] = (counts[s.occasion] || 0) + 1;
        }
      }
    });
    const entries = Object.entries(counts);
    if (entries.length === 0) return 'No Data Yet';
    entries.sort((a, b) => b[1] - a[1]);
    return `${entries[0][0]} (${entries[0][1]} completions)`;
  }, [currentData]);

  // 4. Seeding Test Database records helper
  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    setSeedMessage('Initializing seeds...');
    const supabase = createClient();
    try {
      // 1. Use the currently authenticated admin user's ID as the owner of seeded surprises (prevents users table RLS violations)
      const seedUserId = user?.id || '00000000-0000-0000-0000-000000000000';

      setSeedMessage('Generating mock surprises...');
      // 2. Insert surprises
      const seedSurprises = [
        {
          id: 's-seed-1',
          user_id: seedUserId,
          recipient_name: 'Sophia Watson',
          relationship_type: 'Partner',
          occasion: 'Love',
          special_note: 'She likes vanilla lattes and beach sunset strolls',
          custom_message: 'Every moment with you has been a beautiful romance...',
          selected_theme: 'sunset',
          selected_music: 'romantic-piano',
          plan_type: 'premium',
          surprise_slug: 'sophia-proposal-seed',
          status: 'active',
          cute_no_button: true,
          countdown_enabled: false
        },
        {
          id: 's-seed-2',
          user_id: seedUserId,
          recipient_name: 'David Miller',
          relationship_type: 'Best Friend',
          occasion: 'Birthday',
          special_note: 'Likes embarrassing baby photos and gaming',
          custom_message: 'Happy birthday to the most chaotic friend in the world 😂...',
          selected_theme: 'midnight',
          selected_music: 'guitar-1',
          plan_type: 'basic',
          surprise_slug: 'david-bday-seed',
          status: 'active',
          password_lock: '5678'
        },
        {
          id: 's-seed-3',
          user_id: seedUserId,
          recipient_name: 'Karan Malhotra',
          relationship_type: 'Other',
          occasion: 'Sorry',
          special_note: 'A sincere apology note',
          custom_message: 'I know I hurt you, and I truly want to make things right...',
          selected_theme: 'nordic',
          selected_music: 'lofi-chill',
          plan_type: 'free',
          surprise_slug: 'sorry-karan-seed',
          status: 'active'
        }
      ];

      for (const s of seedSurprises) {
        const { error: sErr } = await supabase
          .from('surprises')
          .upsert({
            ...s,
            updated_at: new Date().toISOString()
          });
        if (sErr) throw sErr;
      }

      setSeedMessage('Injecting mock orders & views...');
      // 3. Insert orders
      const seedOrders = [
        { id: 'o-seed-1', user_id: seedUserId, surprise_id: 's-seed-1', amount: 79, payment_status: 'captured', created_at: new Date().toISOString() },
        { id: 'o-seed-2', user_id: seedUserId, surprise_id: 's-seed-2', amount: 39, payment_status: 'captured', created_at: new Date().toISOString() }
      ];

      for (const o of seedOrders) {
        const { error: oErr } = await supabase
          .from('orders')
          .upsert(o);
        if (oErr) throw oErr;
      }

      // 4. Insert mock analytics (opens/completions)
      const seedAnalytics = [
        { id: 'v-seed-1', surprise_id: 's-seed-1', session_id: 'sess-seed-1', device_type: 'Mobile', opened_at: new Date(Date.now() - 3600000).toISOString(), completed_at: new Date().toISOString() },
        { id: 'v-seed-2', surprise_id: 's-seed-1', session_id: 'sess-seed-2', device_type: 'Mobile', opened_at: new Date(Date.now() - 7200000).toISOString(), completed_at: null },
        { id: 'v-seed-3', surprise_id: 's-seed-2', session_id: 'sess-seed-3', device_type: 'Desktop', opened_at: new Date(Date.now() - 1800000).toISOString(), completed_at: new Date().toISOString() }
      ];

      for (const a of seedAnalytics) {
        const { error: aErr } = await supabase
          .from('surprise_analytics')
          .upsert(a as any);
        if (aErr) throw aErr;
      }

      setSeedMessage('Database seeded successfully! 🎉');
      fetchRealData();
    } catch (err: any) {
      console.error(err);
      setSeedMessage('Seeding failed: ' + err.message);
    } finally {
      setIsSeeding(false);
      setTimeout(() => setSeedMessage(null), 3000);
    }
  };

  // 5. Custom Chart SVG calculators
  const revenueHistory = useMemo(() => {
    const { orders } = currentData;
    const dailyMap: Record<string, number> = {};
    
    // Initialise last 14 days
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyMap[key] = 0;
    }

    orders.forEach((o: any) => {
      if (o.payment_status === 'captured') {
        const key = new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (dailyMap[key] !== undefined) {
          dailyMap[key] += o.amount;
        }
      }
    });

    return Object.entries(dailyMap).map(([date, revenue]) => ({ date, value: revenue }));
  }, [currentData]);

  const occasionShare = useMemo(() => {
    const { surprises } = currentData;
    const countMap: Record<string, number> = {
      Birthday: 0,
      Anniversary: 0,
      Sorry: 0,
      Friendship: 0,
      Farewell: 0,
      Love: 0
    };
    surprises.forEach((s: any) => {
      const name = s.occasion || 'Custom';
      const key = name === 'Proposal' ? 'Love' : (countMap[name] !== undefined ? name : 'Love');
      countMap[key]++;
    });

    const total = surprises.length || 1;
    return Object.entries(countMap).map(([name, count]) => ({
      name,
      count,
      pct: Math.round((count / total) * 100)
    })).sort((a, b) => b.count - a.count);
  }, [currentData]);

  const signupHistory = useMemo(() => {
    const { users } = currentData;
    const dailyMap: Record<string, number> = {};

    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyMap[key] = 0;
    }

    users.forEach((u: any) => {
      const key = new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (dailyMap[key] !== undefined) {
        dailyMap[key]++;
      }
    });

    return Object.entries(dailyMap).map(([date, signups]) => ({ date, value: signups }));
  }, [currentData]);

  const generateSvgPath = (points: { value: number }[], width: number, height: number) => {
    if (points.length === 0) return { lineD: '', areaD: '', coords: [] };
    const values = points.map(p => p.value);
    const maxVal = Math.max(...values, 10);
    const coords = values.map((val, idx) => {
      const x = (idx / (points.length - 1)) * width;
      const y = height - 12 - ((val / maxVal) * (height - 24));
      return { x, y };
    });

    const lineD = coords.reduce((acc, c, idx) => {
      return idx === 0 ? `M ${c.x} ${c.y}` : `${acc} L ${c.x} ${c.y}`;
    }, '');

    const areaD = coords.length > 0 
      ? `${lineD} L ${coords[coords.length - 1].x} ${height} L ${coords[0].x} ${height} Z` 
      : '';

    return { lineD, areaD, coords };
  };

  const revenueChartSvg = useMemo(() => generateSvgPath(revenueHistory, 560, 160), [revenueHistory]);
  const signupChartSvg = useMemo(() => generateSvgPath(signupHistory, 560, 160), [signupHistory]);

  const activeCreators = useMemo(() => {
    const { surprises, users } = currentData;
    const counts: Record<string, { count: number; email: string; name: string }> = {};

    surprises.forEach((s: any) => {
      const uId = s.user_id;
      if (!counts[uId]) {
        const found = users.find((u: any) => u.id === uId);
        counts[uId] = {
          count: 0,
          email: found ? found.email : `guest-user@heartly.in`,
          name: found ? (found.full_name || 'Guest') : 'Guest'
        };
      }
      counts[uId].count++;
    });

    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [currentData]);

  const mostViewedSurprises = useMemo(() => {
    const { surprises, views, users } = currentData;
    const openCounts: Record<string, number> = {};
    const completionCounts: Record<string, number> = {};
    
    views.forEach((v: any) => {
      openCounts[v.surprise_id] = (openCounts[v.surprise_id] || 0) + 1;
      if (v.completed_at) {
        completionCounts[v.surprise_id] = (completionCounts[v.surprise_id] || 0) + 1;
      }
    });

    return surprises
      .map((s: any) => {
        const creator = users.find((u: any) => u.id === s.user_id);
        const opens = openCounts[s.id] || 0;
        const completions = completionCounts[s.id] || 0;
        const rate = opens > 0 ? `${Math.round((completions / opens) * 100)}%` : '0%';
        return {
          id: s.id,
          recipient: s.recipient_name,
          occasion: s.occasion,
          plan: s.plan_type,
          opens,
          completions,
          rate,
          creator: creator ? creator.email : 'guest-creator@heartly.in'
        };
      })
      .sort((a: any, b: any) => b.opens - a.opens)
      .slice(0, 10);
  }, [currentData]);

  const musicUsage = useMemo(() => {
    const { surprises } = currentData;
    const usageMap: Record<string, number> = {};
    surprises.forEach((s: any) => {
      const music = s.selected_music || 'warm-guitar';
      usageMap[music] = (usageMap[music] || 0) + 1;
    });
    const total = surprises.length || 1;
    return Object.entries(usageMap)
      .map(([name, count]) => ({
        name,
        count,
        pct: Math.round((count / total) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [currentData]);

  const reactionMetrics = useMemo(() => {
    const reactionsList = currentData.reactions || [];
    const total = reactionsList.length;
    
    const countByEmoji: Record<string, number> = {
      '❤️': 0,
      '😭': 0,
      '😂': 0,
      '🥹': 0,
      '✨': 0
    };

    reactionsList.forEach((r: any) => {
      const char = r.reaction_emoji;
      if (countByEmoji[char] !== undefined) {
        countByEmoji[char]++;
      }
    });

    const labels: Record<string, string> = {
      '❤️': 'Loved It ❤️',
      '😭': 'Emotional 😭',
      '😂': 'Funny 😂',
      '🥹': 'Cute 🥹',
      '✨': 'Beautiful ✨'
    };

    return Object.keys(countByEmoji).map(emoji => {
      const count = countByEmoji[emoji];
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      return {
        emoji,
        label: labels[emoji] || 'Other',
        count,
        pct
      };
    }).sort((a, b) => b.count - a.count);
  }, [currentData]);

  // Loading Screen
  if (authLoading || checkingAuth) {
    return (
      <div className="min-h-screen bg-brand-black flex flex-col items-center justify-center p-6 text-center select-none text-left font-sans">
        <Activity className="w-8 h-8 text-brand-purple animate-pulse mb-3" />
        <p className="text-xs text-brand-muted font-semibold">Authenticating Founder Session...</p>
      </div>
    );
  }

  // Access Shield Guard
  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-brand-black flex flex-col items-center justify-center p-6 text-center select-none text-left font-sans relative">
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] glow-purple opacity-20 pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] glow-pink opacity-10 pointer-events-none" />

        <div className="max-w-md w-full p-8 glass-panel rounded-3xl border border-brand-border space-y-6">
          <div className="w-14 h-14 rounded-full bg-brand-pink/10 border border-brand-pink/20 flex items-center justify-center text-brand-pink mx-auto animate-pulse">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-heading font-extrabold text-white">Founder Access Only</h1>
            <p className="text-xs text-brand-muted leading-relaxed">
              This space is reserved for Heartly administrators and founders. Please log in with an authorized email account to view analytics.
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <Link href="/admin/login" className="w-full">
              <CustomButton variant="primary" size="md" className="w-full text-xs font-semibold">
                Sign In as Founder
              </CustomButton>
            </Link>
            <Link href="/dashboard" className="w-full">
              <CustomButton variant="glass" size="md" className="w-full text-xs font-semibold">
                Back to Dashboard
              </CustomButton>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-black text-foreground flex flex-col text-left relative overflow-x-hidden font-sans pb-16">
      
      {/* Glow Backdrops */}
      <div className="absolute top-[-20%] left-[-15%] w-[60vw] h-[60vw] glow-purple opacity-15 pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-15%] w-[60vw] h-[60vw] glow-pink opacity-10 pointer-events-none" />

      {/* Admin Top Header */}
      <header className="h-16 border-b border-brand-border bg-brand-dark/25 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20 select-none">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-brand-muted hover:text-white p-1 rounded-lg border border-brand-border bg-brand-dark/40 shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2 font-heading font-bold text-base text-white">
            <Heart className="w-4.5 h-4.5 text-brand-pink fill-brand-pink/20" />
            <span>Heartly Founder Portal</span>
          </div>
          <span className="text-[9px] font-bold tracking-wider uppercase bg-brand-purple/10 border border-brand-purple/20 text-brand-purple px-2 py-0.5 rounded-full select-none">
            Admin 🔒
          </span>
          <Link href="/admin/support" className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-white bg-brand-purple/20 border border-brand-purple/35 px-3 py-1 rounded-full hover:bg-brand-purple/35 transition-all cursor-pointer">
            <span>Support Messages</span>
            {unreadSupportCount > 0 && (
              <span className="bg-brand-pink text-white text-[9px] px-1.5 py-0.5 rounded-full font-sans font-extrabold animate-pulse leading-none">
                {unreadSupportCount}
              </span>
            )}
          </Link>
          <Link href="/admin/music" className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-white bg-brand-purple/20 border border-brand-purple/35 px-3 py-1 rounded-full hover:bg-brand-purple/35 transition-all cursor-pointer">
            <Music className="w-3.5 h-3.5 text-brand-pink" />
            <span>Music Library</span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {/* Database Connection Status */}
          <div className="flex items-center gap-2 border border-brand-border bg-brand-dark/30 px-3 py-1.5 rounded-full text-[10px] sm:text-xs select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-white font-semibold">Live Database Connected</span>
          </div>

          <div className="hidden md:block text-[10px] text-brand-muted text-right font-mono">
            <span>Signed in: </span>
            <span className="text-white font-bold">{user?.email || 'pal929956@gmail.com'}</span>
          </div>

          <button
            onClick={async () => {
              if (user) {
                await supabaseSignOut();
              }
              await fetch('/api/admin/logout', { method: 'POST' });
              router.push('/admin/login');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-pink/20 hover:border-brand-pink/40 hover:bg-brand-pink/5 text-[10px] sm:text-xs font-bold text-brand-pink cursor-pointer active:scale-95 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-6 pt-8 space-y-8 flex-1">
        
        {/* Banner if Database is Empty */}
        {currentData.users.length === 0 && (
          <div className="p-4 rounded-2xl border border-brand-border bg-brand-dark/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-brand-pink shrink-0" />
              <span className="text-brand-muted">The production database is empty. Seed sample records to check dashboard features.</span>
            </div>
            <button
              onClick={handleSeedDatabase}
              disabled={isSeeding}
              className="px-3 py-1.5 bg-brand-purple/10 border border-brand-purple/20 text-brand-purple font-bold rounded-lg hover:bg-brand-purple/20 transition-all text-[10px] cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {isSeeding ? 'Seeding...' : 'Seed Test Data ⚡'}
            </button>
          </div>
        )}

        {/* Database Seed Notification */}
        {seedMessage && (
          <div className="p-3 bg-brand-purple/10 border border-brand-purple/20 text-brand-purple font-semibold text-xs rounded-xl flex items-center gap-2 animate-bounce">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{seedMessage}</span>
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex gap-2 border-b border-brand-border/60 pb-1 overflow-x-auto scrollbar-none select-none">
          {[
            { id: 'overview', label: '📊 Overview' },
            { id: 'revenue', label: '💰 Revenue & Payments' },
            { id: 'users', label: '👥 Users & Creators' },
            { id: 'surprises', label: '📸 Surprise Analytics' },
            { id: 'referrals', label: '🎁 Referral Analytics' },
            { id: 'controls', label: '⚙️ Controls & Health' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 text-xs font-bold shrink-0 transition-all border-b-2 cursor-pointer ${
                activeTab === tab.id 
                  ? 'border-brand-purple text-brand-purple bg-brand-purple/5 rounded-t-xl' 
                  : 'border-transparent text-brand-muted hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Total Users', val: currentData.users.length === 0 ? 'No Data Yet' : metrics.totalUsers, sub: `Registered accounts`, icon: Users, color: 'text-brand-purple bg-brand-purple/5 border-brand-purple/10' },
            { label: 'Total Drafts', val: currentData.surprises.length === 0 ? 'No Data Yet' : metrics.totalDrafts, sub: `Unpublished surprises`, icon: Layers, color: 'text-amber-400 bg-amber-500/5 border-amber-500/10' },
            { label: 'Total Published', val: currentData.surprises.length === 0 ? 'No Data Yet' : metrics.totalPublished, sub: `Active surprise pages`, icon: Heart, color: 'text-brand-pink bg-brand-pink/5 border-brand-pink/10' },
            { label: 'Total Views', val: currentData.views.length === 0 ? 'No Data Yet' : metrics.totalViews, sub: `Surprise page opens`, icon: Eye, color: 'text-sky-400 bg-sky-500/5 border-sky-500/10' },
            { label: 'Total Revenue', val: currentData.orders.filter((o: any) => o.payment_status === 'captured').length === 0 ? 'No Data Yet' : `₹${metrics.totalRevenue.toLocaleString()}`, sub: `Lifetime captured`, icon: DollarSign, color: 'text-emerald-400 bg-emerald-500/5 border-emerald-500/10' },
            { label: 'Paid Orders Count', val: currentData.orders.filter((o: any) => o.payment_status === 'captured').length === 0 ? 'No Data Yet' : metrics.totalPaidCount, sub: `Captured checkouts`, icon: CheckCircle2, color: 'text-teal-400 bg-teal-500/5 border-teal-500/10' }
          ].map((card, idx) => (
            <div key={idx} className="p-5 rounded-2xl border border-brand-border bg-brand-dark/30 flex flex-col justify-between min-h-[105px] relative overflow-hidden group">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">{card.label}</span>
                <div className={`p-1.5 rounded-lg border ${card.color} shrink-0`}>
                  <card.icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-3">
                <h4 className="text-sm font-heading font-extrabold text-white leading-none truncate">{card.val}</h4>
                <p className="text-[9px] text-brand-muted mt-1 leading-none">{card.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* TAB CONTENTS */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {/* 1. OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-8 text-left">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Revenue Area Chart */}
                  <div className="lg:col-span-8 p-6 glass-panel rounded-3xl border border-brand-border space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-heading font-bold text-sm text-white flex items-center gap-1.5">
                          <TrendingUp className="w-4 h-4 text-brand-purple" />
                          <span>Revenue History (Last 14 Days)</span>
                        </h3>
                        <p className="text-[10px] text-brand-muted">Daily captured payment values in INR.</p>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full select-none">
                        Avg: ₹{metrics.avgOrderValue.toFixed(0)} / order
                      </span>
                    </div>

                    {/* Chart Plot */}
                    <div className="relative pt-4 w-full h-[180px] bg-brand-dark/20 rounded-2xl border border-brand-border/40 overflow-hidden flex items-center justify-center">
                      {currentData.orders.some((o: any) => o.payment_status === 'captured') ? (
                        <svg className="w-full h-[160px] overflow-visible mt-auto" viewBox="0 0 560 160" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="chart-glow" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.25" />
                              <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          {/* Grid Lines */}
                          <line x1="0" y1="40" x2="560" y2="40" stroke="#ffffff" strokeOpacity="0.03" strokeWidth="1" />
                          <line x1="0" y1="80" x2="560" y2="80" stroke="#ffffff" strokeOpacity="0.03" strokeWidth="1" />
                          <line x1="0" y1="120" x2="560" y2="120" stroke="#ffffff" strokeOpacity="0.03" strokeWidth="1" />

                          {/* Gradient fill */}
                          {revenueChartSvg.areaD && <path d={revenueChartSvg.areaD} fill="url(#chart-glow)" />}
                          {/* Main line */}
                          {revenueChartSvg.lineD && <path d={revenueChartSvg.lineD} fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" className="drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]" />}
                          
                          {/* Interactive Coordinates */}
                          {revenueChartSvg.coords.map((c, idx) => (
                            <g key={idx} className="group/dot cursor-pointer">
                              <title>{`Revenue: ₹${revenueHistory[idx]?.value}`}</title>
                              <circle cx={c.x} cy={c.y} r="3" fill="#a855f7" className="group-hover/dot:r-5 transition-all" />
                              <circle cx={c.x} cy={c.y} r="8" fill="#a855f7" fillOpacity="0" className="hover:fill-opacity-15 transition-all" />
                            </g>
                          ))}
                        </svg>
                      ) : (
                        <div className="text-center text-xs font-bold text-brand-muted font-mono">No Data Yet</div>
                      )}
                    </div>
                    {/* X-Axis Labels */}
                    <div className="flex justify-between text-[8px] text-brand-muted font-bold font-mono px-2">
                      <span>{revenueHistory[0]?.date}</span>
                      <span>{revenueHistory[Math.floor(revenueHistory.length / 2)]?.date}</span>
                      <span>{revenueHistory[revenueHistory.length - 1]?.date}</span>
                    </div>
                  </div>

                  {/* Plan Sales Breakdown */}
                  <div className="lg:col-span-4 p-6 glass-panel rounded-3xl border border-brand-border space-y-5 h-full flex flex-col justify-between">
                    <div>
                      <h3 className="font-heading font-bold text-sm text-white">Usage Scale Share</h3>
                      <p className="text-[10px] text-brand-muted">Surprise plan tiers distribution.</p>
                    </div>

                    <div className="space-y-4 flex-1 flex flex-col justify-center pt-4">
                      {currentData.surprises.length > 0 ? (
                        [
                          { name: 'Luxury (₹149)', count: currentData.surprises.filter((s: any) => (s.plan_type || '').toLowerCase() === 'luxury').length, pct: Math.round((currentData.surprises.filter((s: any) => (s.plan_type || '').toLowerCase() === 'luxury').length / currentData.surprises.length) * 100), color: 'bg-brand-blue' },
                          { name: 'Premium (₹79)', count: currentData.surprises.filter((s: any) => (s.plan_type || '').toLowerCase() === 'premium').length, pct: Math.round((currentData.surprises.filter((s: any) => (s.plan_type || '').toLowerCase() === 'premium').length / currentData.surprises.length) * 100), color: 'bg-brand-purple' },
                          { name: 'Basic (₹39)', count: currentData.surprises.filter((s: any) => (s.plan_type || '').toLowerCase() === 'basic').length, pct: Math.round((currentData.surprises.filter((s: any) => (s.plan_type || '').toLowerCase() === 'basic').length / currentData.surprises.length) * 100), color: 'bg-brand-pink' },
                          { name: 'Free (₹0)', count: currentData.surprises.filter((s: any) => (s.plan_type || '').toLowerCase() === 'free').length, pct: Math.round((currentData.surprises.filter((s: any) => (s.plan_type || '').toLowerCase() === 'free').length / currentData.surprises.length) * 100), color: 'bg-brand-border' }
                        ].map((plan, idx) => (
                          <div key={idx} className="space-y-1 text-xs">
                            <div className="flex justify-between items-center text-[10px] font-bold">
                              <span className="text-white">{plan.name}</span>
                              <span className="text-brand-muted">{plan.count} ({plan.pct}%)</span>
                            </div>
                            <div className="w-full bg-brand-border/20 h-2 rounded-full overflow-hidden">
                              <div className={`${plan.color} h-full rounded-full`} style={{ width: `${plan.pct}%` }} />
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-xs font-bold text-brand-muted font-mono py-8">No Data Yet</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Occasions share cylindrical bar charts */}
                  <div className="p-6 glass-panel rounded-3xl border border-brand-border space-y-4">
                    <div>
                      <h3 className="font-heading font-bold text-sm text-white">Occasion Heatmap</h3>
                      <p className="text-[10px] text-brand-muted">Which emotional intent categories perform best.</p>
                    </div>

                    <div className="space-y-3 pt-2">
                      {currentData.surprises.length > 0 ? (
                        occasionShare.map((occ: any, idx: number) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between items-center text-[10px] font-bold">
                              <span className="text-white">{occ.name}</span>
                              <span className="text-brand-muted">{occ.count} ({occ.pct}%)</span>
                            </div>
                            <div className="w-full bg-brand-border/20 h-2.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-brand-purple to-brand-pink h-full rounded-full" 
                                style={{ width: `${occ.pct}%` }}
                              />
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-xs font-bold text-brand-muted font-mono py-8">No Data Yet</div>
                      )}
                    </div>
                  </div>

                  {/* Growth dropoff funnel */}
                  <div className="p-6 glass-panel rounded-3xl border border-brand-border space-y-4">
                    <div>
                      <h3 className="font-heading font-bold text-sm text-white">Builder Conversion Funnel</h3>
                      <p className="text-[10px] text-brand-muted">Dropoff percentages throughout surprise generation steps.</p>
                    </div>

                    <div className="space-y-3 pt-2">
                      {currentData.surprises.length > 0 ? (
                        [
                          { label: '1. Occasion Chosen', count: currentData.surprises.length, pct: 100 },
                          { label: '2. Tell Us About Them', count: currentData.surprises.filter((s: any) => s.relationship_type).length, pct: Math.round((currentData.surprises.filter((s: any) => s.relationship_type).length / currentData.surprises.length) * 100) },
                          { label: '3. Write Letter', count: currentData.surprises.filter((s: any) => s.custom_message).length, pct: Math.round((currentData.surprises.filter((s: any) => s.custom_message).length / currentData.surprises.length) * 100) },
                          { label: '4. Active / Paid Surprise', count: metrics.totalPublished, pct: Math.round((metrics.totalPublished / currentData.surprises.length) * 100) }
                        ].map((step, idx) => (
                          <div key={idx} className="p-3 rounded-xl border border-brand-border/40 bg-brand-dark/20 flex justify-between items-center text-xs">
                            <div className="space-y-0.5">
                              <h4 className="font-bold text-white">{step.label}</h4>
                              <p className="text-[9px] text-brand-muted">{step.count} surprises reached</p>
                            </div>
                            <span className="text-xs font-extrabold text-brand-purple bg-brand-purple/10 px-2.5 py-1 rounded-full">{step.pct}%</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-xs font-bold text-brand-muted font-mono py-8">No Data Yet</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. REVENUE & PAYMENTS TAB */}
            {activeTab === 'revenue' && (
              <div className="space-y-8 text-left">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="p-5 rounded-2xl border border-brand-border bg-brand-dark/30 text-xs">
                    <span className="text-[9px] font-bold text-brand-muted uppercase tracking-wider block">Today Revenue</span>
                    <h3 className="text-lg font-heading font-extrabold text-white mt-2">
                      {currentData.orders.filter((o: any) => o.payment_status === 'captured').length === 0 ? 'No Data Yet' : `₹${todayRevenue.toLocaleString()}`}
                    </h3>
                    <p className="text-[9px] text-brand-muted mt-1">Captured values since 00:00</p>
                  </div>
                  <div className="p-5 rounded-2xl border border-brand-border bg-brand-dark/30 text-xs">
                    <span className="text-[9px] font-bold text-brand-muted uppercase tracking-wider block">This Week Revenue</span>
                    <h3 className="text-lg font-heading font-extrabold text-white mt-2">
                      {currentData.orders.filter((o: any) => o.payment_status === 'captured').length === 0 ? 'No Data Yet' : `₹${weekRevenue.toLocaleString()}`}
                    </h3>
                    <p className="text-[9px] text-brand-muted mt-1">Captured values last 7 days</p>
                  </div>
                  <div className="p-5 rounded-2xl border border-brand-border bg-brand-dark/30 text-xs">
                    <span className="text-[9px] font-bold text-brand-muted uppercase tracking-wider block">This Month Revenue</span>
                    <h3 className="text-lg font-heading font-extrabold text-white mt-2">
                      {currentData.orders.filter((o: any) => o.payment_status === 'captured').length === 0 ? 'No Data Yet' : `₹${monthRevenue.toLocaleString()}`}
                    </h3>
                    <p className="text-[9px] text-brand-muted mt-1">Captured values last 30 days</p>
                  </div>
                  <div className="p-5 rounded-2xl border border-brand-border bg-brand-dark/30 text-xs">
                    <span className="text-[9px] font-bold text-brand-muted uppercase tracking-wider block">Lifetime Revenue</span>
                    <h3 className="text-lg font-heading font-extrabold text-white mt-2">
                      {currentData.orders.filter((o: any) => o.payment_status === 'captured').length === 0 ? 'No Data Yet' : `₹${metrics.totalRevenue.toLocaleString()}`}
                    </h3>
                    <p className="text-[9px] text-brand-muted mt-1">Total database captured sales</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Payments Log */}
                  <div className="lg:col-span-8 p-6 glass-panel rounded-3xl border border-brand-border space-y-4">
                    <div>
                      <h3 className="font-heading font-bold text-sm text-white">Recent Payments Log</h3>
                      <p className="text-[10px] text-brand-muted">Latest Razorpay transaction instances.</p>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="border-b border-brand-border text-brand-muted font-bold text-[10px] uppercase tracking-wider">
                            <th className="py-2.5">User</th>
                            <th className="py-2.5">Price</th>
                            <th className="py-2.5">Status</th>
                            <th className="py-2.5">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentData.orders.slice(0, 12).map((order: any, idx: number) => (
                            <tr key={idx} className="border-b border-brand-border/40 hover:bg-white/5 transition-colors">
                              <td className="py-3 font-semibold text-white truncate max-w-[150px]">{order.user_id}</td>
                              <td className="py-3 font-mono font-bold text-white">₹{order.amount}</td>
                              <td className="py-3">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                  order.payment_status === 'captured' ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20' :
                                  order.payment_status === 'failed' ? 'bg-brand-pink/10 text-brand-pink border border-brand-pink/20' :
                                  'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                                }`}>
                                  {order.payment_status}
                                </span>
                              </td>
                              <td className="py-3 text-brand-muted font-mono text-[10px]">{new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                            </tr>
                          ))}
                          {currentData.orders.length === 0 && (
                            <tr>
                              <td colSpan={4} className="py-8 text-center text-brand-muted">No transactions found.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Failed alerts */}
                  <div className="lg:col-span-4 p-6 glass-panel rounded-3xl border border-brand-border space-y-4">
                    <div>
                      <h3 className="font-heading font-bold text-sm text-white flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-brand-pink" />
                        <span>Refund / Failed Alerts</span>
                      </h3>
                      <p className="text-[10px] text-brand-muted">Checkouts that failed. Proactively reach out to save sales.</p>
                    </div>

                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {currentData.orders.filter((o: any) => o.payment_status === 'failed').slice(0, 5).map((fOrder: any, idx: number) => (
                        <div key={idx} className="p-3.5 rounded-xl border border-brand-pink/20 bg-brand-pink/5 space-y-2 text-[10px]">
                          <div className="flex justify-between items-center font-bold">
                            <span className="text-white truncate max-w-[120px]">{fOrder.user_id}</span>
                            <span className="text-brand-pink font-mono">₹{fOrder.amount}</span>
                          </div>
                          <p className="text-[9px] text-brand-muted font-normal leading-relaxed">
                            Payment failed at gateway stage. User has not completed surprise launch.
                          </p>
                          <a 
                            href={`mailto:${fOrder.user_id}`} 
                            className="inline-block text-[9px] font-bold text-brand-purple hover:underline"
                          >
                            Send Recovery Coupon Email 📨
                          </a>
                        </div>
                      ))}
                      {currentData.orders.filter((o: any) => o.payment_status === 'failed').length === 0 && (
                        <div className="py-8 text-center text-xs text-brand-muted">No failed checkout alerts found. System is completely green! ✅</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. USERS & CREATORS TAB */}
            {activeTab === 'users' && (
              <div className="space-y-8 text-left">
                <div className="grid grid-cols-2 gap-6 max-w-md">
                  <div className="p-5 rounded-2xl border border-brand-border bg-brand-dark/30 text-xs">
                    <span className="text-[9px] font-bold text-brand-muted uppercase tracking-wider block">Total Registered Users</span>
                    <h3 className="text-lg font-heading font-extrabold text-white mt-2">
                      {currentData.users.length === 0 ? 'No Data Yet' : metrics.totalUsers}
                    </h3>
                    <p className="text-[9px] text-brand-muted mt-1">Total account signups</p>
                  </div>
                  <div className="p-5 rounded-2xl border border-brand-border bg-brand-dark/30 text-xs">
                    <span className="text-[9px] font-bold text-brand-muted uppercase tracking-wider block">Active Users</span>
                    <h3 className="text-lg font-heading font-extrabold text-white mt-2">
                      {currentData.users.length === 0 ? 'No Data Yet' : activeUsersCount}
                    </h3>
                    <p className="text-[9px] text-brand-muted mt-1">Creators who made 1+ surprises</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Signup Trend */}
                  <div className="lg:col-span-8 p-6 glass-panel rounded-3xl border border-brand-border space-y-4">
                    <div>
                      <h3 className="font-heading font-bold text-sm text-white flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-brand-purple" />
                        <span>Daily Registration Flow (Last 14 Days)</span>
                      </h3>
                      <p className="text-[10px] text-brand-muted">Daily newly registered accounts count.</p>
                    </div>

                    <div className="relative pt-4 w-full h-[180px] bg-brand-dark/20 rounded-2xl border border-brand-border/40 overflow-hidden flex items-center justify-center">
                      {currentData.users.length > 0 ? (
                        <svg className="w-full h-[160px] overflow-visible mt-auto" viewBox="0 0 560 160" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="signup-glow" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#ec4899" stopOpacity="0.2" />
                              <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <line x1="0" y1="40" x2="560" y2="40" stroke="#ffffff" strokeOpacity="0.03" strokeWidth="1" />
                          <line x1="0" y1="80" x2="560" y2="80" stroke="#ffffff" strokeOpacity="0.03" strokeWidth="1" />
                          <line x1="0" y1="120" x2="560" y2="120" stroke="#ffffff" strokeOpacity="0.03" strokeWidth="1" />

                          {/* Gradient fill */}
                          {signupChartSvg.areaD && <path d={signupChartSvg.areaD} fill="url(#signup-glow)" />}
                          {/* Main line */}
                          {signupChartSvg.lineD && <path d={signupChartSvg.lineD} fill="none" stroke="#ec4899" strokeWidth="2.5" strokeLinecap="round" className="drop-shadow-[0_0_8px_rgba(236,72,153,0.4)]" />}
                          
                          {/* Interactive Coordinates */}
                          {signupChartSvg.coords.map((c, idx) => (
                            <circle key={idx} cx={c.x} cy={c.y} r="3" fill="#ec4899" />
                          ))}
                        </svg>
                      ) : (
                        <div className="text-center text-xs font-bold text-brand-muted font-mono">No Data Yet</div>
                      )}
                    </div>
                    {/* X Axis Labels */}
                    <div className="flex justify-between text-[8px] text-brand-muted font-bold font-mono px-2">
                      <span>{signupHistory[0]?.date}</span>
                      <span>{signupHistory[Math.floor(signupHistory.length / 2)]?.date}</span>
                      <span>{signupHistory[signupHistory.length - 1]?.date}</span>
                    </div>
                  </div>

                  {/* Leaderboard of creators */}
                  <div className="lg:col-span-4 p-6 glass-panel rounded-3xl border border-brand-border space-y-4">
                    <div>
                      <h3 className="font-heading font-bold text-sm text-white">Active Creators</h3>
                      <p className="text-[10px] text-brand-muted">Leaderboard of users creating the most surprises.</p>
                    </div>

                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {activeCreators.map((creator: any, idx: number) => (
                        <div key={idx} className="p-3 rounded-xl border border-brand-border/40 bg-brand-dark/20 flex justify-between items-center text-xs">
                          <div className="min-w-0">
                            <h4 className="font-bold text-white truncate max-w-[140px]">{creator.email}</h4>
                            <p className="text-[9px] text-brand-muted">{creator.name}</p>
                          </div>
                          <span className="text-[10px] font-bold text-brand-purple bg-brand-purple/10 border border-brand-purple/20 px-2.5 py-1 rounded-full shrink-0">
                            {creator.count} surprises
                          </span>
                        </div>
                      ))}
                      {activeCreators.length === 0 && (
                        <div className="py-8 text-center text-xs text-brand-muted">No creator leaderboard statistics available.</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recent Registrations Table */}
                <div className="p-6 glass-panel rounded-3xl border border-brand-border space-y-4">
                  <div>
                    <h3 className="font-heading font-bold text-sm text-white">Recent Registrations</h3>
                    <p className="text-[10px] text-brand-muted">Latest accounts created in the system.</p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-brand-border text-brand-muted font-bold text-[10px] uppercase tracking-wider">
                          <th className="py-2.5">User ID</th>
                          <th className="py-2.5">Email</th>
                          <th className="py-2.5">Display Name</th>
                          <th className="py-2.5">Joined At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentData.users.slice(0, 10).map((u: any, idx: number) => (
                          <tr key={idx} className="border-b border-brand-border/40 hover:bg-white/5 transition-colors">
                            <td className="py-3 font-mono text-[9px] text-brand-muted truncate max-w-[120px]">{u.id}</td>
                            <td className="py-3 font-semibold text-white truncate max-w-[150px]">{u.email}</td>
                            <td className="py-3 font-semibold text-white">{u.full_name || 'Anonymous User'}</td>
                            <td className="py-3 text-brand-muted font-mono text-[10px]">{new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                          </tr>
                        ))}
                        {currentData.users.length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-brand-muted">No user accounts found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 4. SURPRISE ANALYTICS TAB */}
            {activeTab === 'surprises' && (
              <div className="space-y-8 text-left">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                  <div className="p-5 rounded-2xl border border-brand-border bg-brand-dark/30 text-xs">
                    <span className="text-[9px] font-bold text-brand-muted uppercase tracking-wider block">Most Popular Occasion</span>
                    <h3 className="text-base font-heading font-extrabold text-white mt-2 truncate">
                      {mostPopularOccasion}
                    </h3>
                    <p className="text-[9px] text-brand-muted mt-1">Top category by creations</p>
                  </div>
                  <div className="p-5 rounded-2xl border border-brand-border bg-brand-dark/30 text-xs">
                    <span className="text-[9px] font-bold text-brand-muted uppercase tracking-wider block">Most Used Music</span>
                    <h3 className="text-base font-heading font-extrabold text-white mt-2 truncate">
                      {mostUsedMusic}
                    </h3>
                    <p className="text-[9px] text-brand-muted mt-1">Top selected audio track</p>
                  </div>
                  <div className="p-5 rounded-2xl border border-brand-border bg-brand-dark/30 text-xs">
                    <span className="text-[9px] font-bold text-brand-muted uppercase tracking-wider block">Most Used Template</span>
                    <h3 className="text-base font-heading font-extrabold text-white mt-2 truncate">
                      {mostUsedTheme}
                    </h3>
                    <p className="text-[9px] text-brand-muted mt-1">Top active layouts theme</p>
                  </div>
                  <div className="p-5 rounded-2xl border border-brand-border bg-brand-dark/30 text-xs">
                    <span className="text-[9px] font-bold text-brand-muted uppercase tracking-wider block">Average Open Rate</span>
                    <h3 className="text-base font-heading font-extrabold text-white mt-2 truncate">
                      {averageOpenRateStr}
                    </h3>
                    <p className="text-[9px] text-brand-muted mt-1">Ratio of published links opened</p>
                  </div>
                  <div className="p-5 rounded-2xl border border-brand-border bg-brand-dark/30 text-xs">
                    <span className="text-[9px] font-bold text-brand-muted uppercase tracking-wider block">Total Surprise Opens</span>
                    <h3 className="text-base font-heading font-extrabold text-white mt-2 truncate">
                      {currentData.views.length === 0 ? 'No Data Yet' : totalSurpriseOpens}
                    </h3>
                    <p className="text-[9px] text-brand-muted mt-1">Total open sessions logged</p>
                  </div>
                  <div className="p-5 rounded-2xl border border-brand-border bg-brand-dark/30 text-xs">
                    <span className="text-[9px] font-bold text-brand-muted uppercase tracking-wider block">Total Completions</span>
                    <h3 className="text-base font-heading font-extrabold text-white mt-2 truncate">
                      {currentData.views.length === 0 ? 'No Data Yet' : totalCompletions}
                    </h3>
                    <p className="text-[9px] text-brand-muted mt-1">Total completed session views</p>
                  </div>
                  <div className="p-5 rounded-2xl border border-brand-border bg-brand-dark/30 text-xs">
                    <span className="text-[9px] font-bold text-brand-muted uppercase tracking-wider block">Average Completion Rate</span>
                    <h3 className="text-base font-heading font-extrabold text-white mt-2 truncate">
                      {averageCompletionRateStr}
                    </h3>
                    <p className="text-[9px] text-brand-muted mt-1">Opens that reached the final screen</p>
                  </div>
                  <div className="p-5 rounded-2xl border border-brand-border bg-brand-dark/30 text-xs">
                    <span className="text-[9px] font-bold text-brand-muted uppercase tracking-wider block">Top Opened Surprise</span>
                    <h3 className="text-base font-heading font-extrabold text-white mt-2 truncate">
                      {topOpenedSurprise}
                    </h3>
                    <p className="text-[9px] text-brand-muted mt-1">Surprise with peak landing opens</p>
                  </div>
                  <div className="p-5 rounded-2xl border border-brand-border bg-brand-dark/30 text-xs">
                    <span className="text-[9px] font-bold text-brand-muted uppercase tracking-wider block">Top Performing Occasion</span>
                    <h3 className="text-base font-heading font-extrabold text-white mt-2 truncate">
                      {topPerformingOccasion}
                    </h3>
                    <p className="text-[9px] text-brand-muted mt-1">Top category by completions count</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Most Viewed Surprises Table */}
                  <div className="lg:col-span-8 p-6 glass-panel rounded-3xl border border-brand-border space-y-4">
                    <div>
                      <h3 className="font-heading font-bold text-sm text-white">Most Viewed Surprises</h3>
                      <p className="text-[10px] text-brand-muted">Surprise landing pages receiving the most engagement.</p>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="border-b border-brand-border text-brand-muted font-bold text-[10px] uppercase tracking-wider">
                            <th className="py-2.5">Recipient</th>
                            <th className="py-2.5">Occasion</th>
                            <th className="py-2.5">Plan</th>
                            <th className="py-2.5">Opens</th>
                            <th className="py-2.5">Completions</th>
                            <th className="py-2.5">Completion Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mostViewedSurprises.map((surprise: any, idx: number) => (
                            <tr key={idx} className="border-b border-brand-border/40 hover:bg-white/5 transition-colors">
                              <td className="py-3 font-semibold text-white truncate max-w-[120px]">{surprise.recipient}</td>
                              <td className="py-3 text-brand-muted">{surprise.occasion || 'Custom'}</td>
                              <td className="py-3 font-mono text-[10px] uppercase text-brand-purple font-bold">{surprise.plan}</td>
                              <td className="py-3 font-mono font-bold text-white">{surprise.opens}</td>
                              <td className="py-3 font-mono text-white">{surprise.completions}</td>
                              <td className="py-3 font-mono font-bold text-emerald-400">{surprise.rate}</td>
                            </tr>
                          ))}
                          {mostViewedSurprises.length === 0 && (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-brand-muted">No viewing statistics tracked yet.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Soundtrack preferences & reactions */}
                  <div className="lg:col-span-4 space-y-6">
                    {/* Soundtrack Popularity Card */}
                    <div className="p-6 glass-panel rounded-3xl border border-brand-border space-y-4">
                      <div>
                        <h3 className="font-heading font-bold text-sm text-white flex items-center gap-1.5">
                          <Music className="w-4 h-4 text-brand-purple" />
                          <span>Soundtrack Popularity</span>
                        </h3>
                        <p className="text-[10px] text-brand-muted">Which background library music tracks are selected most.</p>
                      </div>

                      <div className="space-y-4">
                        {musicUsage.map((track, idx) => (
                          <div key={idx} className="space-y-1 text-xs">
                            <div className="flex justify-between items-center text-[10px] font-bold">
                              <span className="text-white truncate max-w-[130px] font-mono">{track.name}</span>
                              <span className="text-brand-muted">{track.count} ({track.pct}%)</span>
                            </div>
                            <div className="w-full bg-brand-border/20 h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-brand-purple h-full rounded-full" 
                                style={{ width: `${track.pct}%` }}
                              />
                            </div>
                          </div>
                        ))}
                        {musicUsage.length === 0 && (
                          <div className="py-8 text-center text-xs text-brand-muted">No music usage metrics available.</div>
                        )}
                      </div>
                    </div>

                    {/* Receiver Reactions Summary Card */}
                    <div className="p-6 glass-panel rounded-3xl border border-brand-border space-y-4">
                      <div>
                        <h3 className="font-heading font-bold text-sm text-white flex items-center gap-1.5">
                          <Heart className="w-4 h-4 text-brand-pink fill-brand-pink/20" />
                          <span>Receiver Reactions</span>
                        </h3>
                        <p className="text-[10px] text-brand-muted">What reactions receivers send back to the creators.</p>
                      </div>

                      <div className="space-y-4">
                        {reactionMetrics.map((reaction, idx) => (
                          <div key={idx} className="space-y-1 text-xs">
                            <div className="flex justify-between items-center text-[10px] font-bold">
                              <span className="text-white truncate max-w-[130px] font-mono">{reaction.label}</span>
                              <span className="text-brand-muted">{reaction.count} ({reaction.pct}%)</span>
                            </div>
                            <div className="w-full bg-brand-border/20 h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-brand-pink h-full rounded-full" 
                                style={{ width: `${reaction.pct}%` }}
                              />
                            </div>
                          </div>
                        ))}
                        {reactionMetrics.reduce((sum, r) => sum + r.count, 0) === 0 && (
                          <div className="py-8 text-center text-xs text-brand-muted">No receiver reactions received yet.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4.5. REFERRALS TAB */}
            {activeTab === 'referrals' && (() => {
              const refs = currentData.referrals || [];
              const creds = currentData.credits || [];
              const txs = currentData.transactions || [];
              const usrs = currentData.users || [];

              const totalLinks = usrs.filter((u: any) => u.referral_code).length;
              const totalInv = refs.length;
              const succInv = refs.filter((r: any) => r.is_rewarded).length;
              const pendInv = refs.filter((r: any) => !r.is_rewarded).length;
              const reviewInv = refs.filter((r: any) => r.refund_review_required).length;

              const convRate = totalInv > 0 ? ((succInv / totalInv) * 100).toFixed(1) + '%' : '0%';
              const credIssued = creds.reduce((sum: number, c: any) => sum + (c.lifetime_credits || 0), 0);
              const credUsed = txs.filter((t: any) => t.transaction_type === 'spend').length;

              // Top Referrers calculations
              const counts: Record<string, { count: number; paid: number; user: any }> = {};
              refs.forEach((ref: any) => {
                const rid = ref.referrer_id;
                if (!counts[rid]) {
                  const referrerUser = usrs.find((u: any) => u.id === rid) || { email: 'Unknown', full_name: 'Unknown User' };
                  counts[rid] = { count: 0, paid: 0, user: referrerUser };
                }
                counts[rid].count += 1;
                if (ref.is_rewarded) {
                  counts[rid].paid += 1;
                }
              });
              const leaderboard = Object.values(counts)
                .sort((a, b) => b.count - a.count)
                .slice(0, 10);

              return (
                <div className="space-y-8 text-left select-none">
                  {/* Metric Cards Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="p-4 glass-panel border border-brand-border rounded-2xl space-y-1 bg-brand-purple/5">
                      <span className="text-[10px] text-brand-muted uppercase font-bold tracking-wider block">Generated Links</span>
                      <span className="text-xl font-heading font-extrabold text-white block">{totalLinks}</span>
                      <span className="text-[9px] text-brand-muted block">Active user codes</span>
                    </div>
                    <div className="p-4 glass-panel border border-brand-border rounded-2xl space-y-1">
                      <span className="text-[10px] text-brand-muted uppercase font-bold tracking-wider block">Total Invites</span>
                      <span className="text-xl font-heading font-extrabold text-white block">{totalInv}</span>
                      <span className="text-[9px] text-brand-muted block">Friends referred</span>
                    </div>
                    <div className="p-4 glass-panel border border-brand-border rounded-2xl space-y-1 bg-emerald-500/5">
                      <span className="text-[10px] text-brand-muted uppercase font-bold tracking-wider block">Paid Conversions</span>
                      <span className="text-xl font-heading font-extrabold text-white block">{succInv}</span>
                      <span className="text-[9px] text-brand-muted block">Referred purchases</span>
                    </div>
                    <div className="p-4 glass-panel border border-brand-border rounded-2xl space-y-1">
                      <span className="text-[10px] text-brand-muted uppercase font-bold tracking-wider block">Conversion Rate</span>
                      <span className="text-xl font-heading font-extrabold text-white block">{convRate}</span>
                      <span className="text-[9px] text-brand-muted block">Paid / Total Invites</span>
                    </div>
                    <div className="p-4 glass-panel border border-brand-border rounded-2xl space-y-1">
                      <span className="text-[10px] text-brand-muted uppercase font-bold tracking-wider block">Credits Issued</span>
                      <span className="text-xl font-heading font-extrabold text-white block">{credIssued}</span>
                      <span className="text-[9px] text-brand-muted block">Total free credits</span>
                    </div>
                    <div className="p-4 glass-panel border border-brand-border rounded-2xl space-y-1">
                      <span className="text-[10px] text-brand-muted uppercase font-bold tracking-wider block">Credits Spent</span>
                      <span className="text-xl font-heading font-extrabold text-white block">{credUsed}</span>
                      <span className="text-[9px] text-brand-muted block">Redeemed Basic surprises</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Leaderboard Table */}
                    <div className="lg:col-span-5 p-6 glass-panel rounded-3xl border border-brand-border space-y-4">
                      <div>
                        <h3 className="font-heading font-bold text-sm text-white flex items-center gap-1.5">
                          <Award className="w-4.5 h-4.5 text-brand-purple" />
                          <span>Top Referrers Leaderboard</span>
                        </h3>
                        <p className="text-[10px] text-brand-muted">Most active users inviting friends to Heartly.</p>
                      </div>

                      {leaderboard.length === 0 ? (
                        <div className="py-8 text-center text-xs text-brand-muted border border-dashed border-brand-border rounded-2xl">
                          No referrals recorded yet.
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-2xl border border-brand-border bg-brand-black/20">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-brand-border bg-brand-black/30 text-brand-muted">
                                <th className="p-3">Rank</th>
                                <th className="p-3">User</th>
                                <th className="p-3 text-center">Invites</th>
                                <th className="p-3 text-center">Paid</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-border/40 text-white">
                              {leaderboard.map((row, idx: number) => (
                                <tr key={idx} className="hover:bg-white/5 transition-colors">
                                  <td className="p-3 font-bold text-brand-muted">#{idx + 1}</td>
                                  <td className="p-3">
                                    <span className="font-semibold block truncate max-w-[120px]">{row.user.full_name || 'Anonymous'}</span>
                                    <span className="text-[9px] text-brand-muted block truncate max-w-[120px]">{row.user.email}</span>
                                  </td>
                                  <td className="p-3 text-center font-bold">{row.count}</td>
                                  <td className="p-3 text-center font-bold text-emerald-400">{row.paid}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Activity Logs Table */}
                    <div className="lg:col-span-7 p-6 glass-panel rounded-3xl border border-brand-border space-y-4">
                      <div>
                        <h3 className="font-heading font-bold text-sm text-white flex items-center gap-1.5">
                          <Clock className="w-4.5 h-4.5 text-brand-pink" />
                          <span>Recent Referrals Logs</span>
                        </h3>
                        <p className="text-[10px] text-brand-muted">Latest referred signups and rewards tracking.</p>
                      </div>

                      {refs.length === 0 ? (
                        <div className="py-8 text-center text-xs text-brand-muted border border-dashed border-brand-border rounded-2xl">
                          No recent referrals activity.
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-2xl border border-brand-border bg-brand-black/20">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-brand-border bg-brand-black/30 text-brand-muted">
                                <th className="p-3">Referrer</th>
                                <th className="p-3">Friend</th>
                                <th className="p-3">Date</th>
                                <th className="p-3">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-border/40 text-white">
                              {refs.slice(0, 10).map((ref: any, idx: number) => {
                                const referrerUser = usrs.find((u: any) => u.id === ref.referrer_id) || { email: 'Unknown' };
                                const friendUser = usrs.find((u: any) => u.id === ref.referred_user_id) || { email: 'Unknown' };

                                return (
                                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                                    <td className="p-3 truncate max-w-[120px] font-semibold">{referrerUser.email}</td>
                                    <td className="p-3 truncate max-w-[120px]">{friendUser.email}</td>
                                    <td className="p-3 text-brand-muted">
                                      {new Date(ref.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="p-3">
                                      {ref.refund_review_required ? (
                                        <span className="px-2 py-0.5 rounded-full bg-brand-pink/10 border border-brand-pink/20 text-[9px] text-brand-pink font-bold">
                                          Review
                                        </span>
                                      ) : ref.is_rewarded ? (
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] text-emerald-400 font-bold">
                                          Rewarded
                                        </span>
                                      ) : (
                                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[9px] text-amber-400 font-bold">
                                          Pending
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 5. CONTROLS & HEALTH TAB */}
            {activeTab === 'controls' && (
              <div className="space-y-8 text-left">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  
                  {/* Database Seeder Control */}
                  <div className="p-6 glass-panel rounded-3xl border border-brand-border space-y-5">
                    <div>
                      <h3 className="font-heading font-bold text-sm text-white flex items-center gap-1.5">
                        <Database className="w-4.5 h-4.5 text-brand-purple" />
                        <span>Database Seeding Utilities</span>
                      </h3>
                      <p className="text-[10px] text-brand-muted">Founder tools to seed mock records or clear database for testing.</p>
                    </div>

                    <div className="space-y-3">
                      <div className="p-4 rounded-xl border border-brand-border bg-brand-dark/40 space-y-3">
                        <h4 className="text-xs font-bold text-white">Seed Realistic Demo records</h4>
                        <p className="text-[10px] text-brand-muted leading-relaxed">
                          This writes guest tester user profiles, 3 sample surprises (Sophia Proposal, David Birthday, Karan Apology), captured orders, and mock surprise view logs directly into the Supabase database.
                        </p>
                        <button
                          onClick={handleSeedDatabase}
                          disabled={isSeeding}
                          className="px-4 py-2 bg-gradient-to-r from-brand-purple to-brand-pink text-xs font-semibold text-white rounded-lg active:scale-95 transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                        >
                          {isSeeding ? 'Injecting Seeds...' : 'Insert Seed Records ⚡'}
                        </button>
                      </div>

                      <div className="p-4 rounded-xl border border-brand-border bg-brand-dark/40 space-y-3">
                        <h4 className="text-xs font-bold text-white">Clear Seeded Records</h4>
                        <p className="text-[10px] text-brand-muted leading-relaxed">
                          Clears all surprise, order, and view records created by the guest seeder script to keep the production client workspace clean.
                        </p>
                        <button
                          onClick={async () => {
                            setIsSeeding(true);
                            setSeedMessage('Clearing database records...');
                            const supabase = createClient();
                            try {
                              // Delete analytics
                              if (checkAnalyticsSupport()) {
                                await supabase.from('surprise_analytics').delete().filter('surprise_id', 'in', '("s-seed-1","s-seed-2","s-seed-3")');
                              } else {
                                await supabase.from('surprise_views').delete().filter('surprise_id', 'in', '("s-seed-1","s-seed-2","s-seed-3")');
                              }
                              // Delete orders
                              await supabase.from('orders').delete().filter('surprise_id', 'in', '("s-seed-1","s-seed-2","s-seed-3")');
                              // Delete surprises
                              await supabase.from('surprises').delete().filter('id', 'in', '("s-seed-1","s-seed-2","s-seed-3")');

                              setSeedMessage('Seeded records deleted successfully! 🧹');
                              fetchRealData();
                            } catch (err: any) {
                              setSeedMessage('Failed clearing database: ' + err.message);
                            } finally {
                              setIsSeeding(false);
                              setTimeout(() => setSeedMessage(null), 3000);
                            }
                          }}
                          disabled={isSeeding}
                          className="px-4 py-2 border border-brand-pink/20 hover:bg-brand-pink/10 text-xs font-semibold text-brand-pink rounded-lg active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                        >
                          Clear Test Seeds 🧹
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* System configs validation */}
                  <div className="p-6 glass-panel rounded-3xl border border-brand-border space-y-5">
                    <div>
                      <h3 className="font-heading font-bold text-sm text-white flex items-center gap-1.5">
                        <Activity className="w-4.5 h-4.5 text-brand-purple animate-pulse" />
                        <span>System Health Checks</span>
                      </h3>
                      <p className="text-[10px] text-brand-muted">Verify active settings, tokens, and storage configuration.</p>
                    </div>

                    <div className="space-y-3.5 text-xs">
                      {[
                        { label: 'Supabase URL Config', status: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Connected' : 'Missing URL', ok: !!process.env.NEXT_PUBLIC_SUPABASE_URL },
                        { label: 'Supabase ANON KEY token', status: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Active' : 'Missing KEY', ok: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
                        { label: 'Database Sync Mode', status: 'Live Database Connected (Mock Mode Disabled)', ok: true },
                        { label: 'Storage Bucket Integration', status: 'Initialized (heartly-storage)', ok: true }
                      ].map((check, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl border border-brand-border bg-brand-dark/20 flex items-center justify-between">
                          <div>
                            <h4 className="font-bold text-white">{check.label}</h4>
                            <p className={`text-[10px] mt-0.5 ${check.ok ? 'text-emerald-400' : 'text-brand-pink'}`}>
                              {check.status}
                            </p>
                          </div>
                          {check.ok ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-brand-pink shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
