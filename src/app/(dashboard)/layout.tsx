'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, LayoutDashboard, Sparkles, FolderHeart, 
  FileEdit, ShoppingBag, Settings, Menu, X, 
  Plus, Bell, LogOut, Search, ChevronRight, Loader2 
} from 'lucide-react';
import CustomButton from '@/components/ui/CustomButton';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/utils/supabase/client';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { user, profile, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  const sidebarItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Create Surprise', href: '/dashboard/create', icon: Plus },
    { label: 'My Surprises', href: '/dashboard/surprises', icon: FolderHeart },
    { label: 'Drafts', href: '/dashboard/drafts', icon: FileEdit },
    { label: 'Orders', href: '/dashboard/orders', icon: ShoppingBag },
    { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  // Helper to format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return 'Just now';
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      const supabase = createClient();
      try {
        // 1. Fetch surprises
        const { data: surprises, error: sError } = await supabase
          .from('surprises')
          .select('id, recipient_name, status, created_at, updated_at, plan_type')
          .eq('user_id', user.id);

        if (sError) throw sError;

        // 2. Fetch orders
        const { data: orders, error: oError } = await supabase
          .from('orders')
          .select('id, amount, payment_status, created_at, surprise_id')
          .eq('user_id', user.id)
          .eq('payment_status', 'captured');

        if (oError) throw oError;

        // 3. Fetch surprise opens & completions
        let analytics: any[] = [];
        try {
          const { data, error: aError } = await supabase
            .from('surprise_analytics')
            .select('id, opened_at, completed_at, surprise_id, surprises(user_id, recipient_name)');

          if (aError) {
            // Check if table or relation doesn't exist
            if (aError.code === 'PGRST205' || aError.code === 'PGRST200' || aError.message.includes('surprise_analytics')) {
              console.warn('surprise_analytics table or relationship not found. Falling back to surprise_views notifications...');
              const { data: viewsData, error: vError } = await supabase
                .from('surprise_views')
                .select('id, surprise_id, viewed_at, surprises(user_id, recipient_name)');
              if (!vError && viewsData) {
                analytics = viewsData.map((v: any) => ({
                  id: v.id,
                  surprise_id: v.surprise_id,
                  opened_at: v.viewed_at,
                  completed_at: null,
                  surprises: v.surprises
                }));
              }
            } else {
              throw aError;
            }
          } else {
            analytics = data || [];
          }
        } catch (e) {
          console.warn('Failed to fetch analytics, using empty fallback:', e);
        }

        const list: any[] = [];

        // Map surprises
        surprises?.forEach(s => {
          // Surprise Created
          list.push({
            id: `created-${s.id}`,
            text: `Your surprise for ${s.recipient_name} has been created successfully.`,
            time: formatRelativeTime(s.created_at),
            timestamp: new Date(s.created_at).getTime(),
            unread: false,
          });

          // Surprise Published
          if (s.status === 'active') {
            list.push({
              id: `published-${s.id}`,
              text: "Your surprise is now live.",
              time: formatRelativeTime(s.updated_at),
              timestamp: new Date(s.updated_at).getTime(),
              unread: false,
            });
          }

          // Draft Saved
          if (s.status === 'draft') {
            list.push({
              id: `draft-${s.id}`,
              text: "Draft saved successfully.",
              time: formatRelativeTime(s.updated_at),
              timestamp: new Date(s.updated_at).getTime(),
              unread: false,
            });
          }
        });

        // Map orders
        orders?.forEach(o => {
          const assocSurprise = surprises?.find(s => s.id === o.surprise_id);
          const planName = assocSurprise?.plan_type || 'Luxury';
          const capitalizedPlan = planName.charAt(0).toUpperCase() + planName.slice(1);
          list.push({
            id: `payment-${o.id}`,
            text: `Payment received for ${capitalizedPlan} Plan.`,
            time: formatRelativeTime(o.created_at),
            timestamp: new Date(o.created_at).getTime(),
            unread: false,
          });
        });

        // Map surprise analytics (opens/completions)
        const filteredAnalytics = (analytics as any[])?.filter(a => a.surprises?.user_id === user.id);
        filteredAnalytics?.forEach(a => {
          // Open notification
          list.push({
            id: `open-${a.id}`,
            text: `${a.surprises?.recipient_name || 'Someone'} opened your surprise.`,
            time: formatRelativeTime(a.opened_at),
            timestamp: new Date(a.opened_at).getTime(),
            unread: true,
          });

          // Completion notification (if completed)
          if (a.completed_at) {
            list.push({
              id: `complete-${a.id}`,
              text: `${a.surprises?.recipient_name || 'Someone'} completed your surprise! ✨`,
              time: formatRelativeTime(a.completed_at),
              timestamp: new Date(a.completed_at).getTime(),
              unread: true,
            });
          }
        });

        // Map account login event
        if (user.last_sign_in_at) {
          list.push({
            id: `signin-${user.id}`,
            text: "Signed in successfully.",
            time: formatRelativeTime(user.last_sign_in_at),
            timestamp: new Date(user.last_sign_in_at).getTime(),
            unread: false,
          });
        }

        // Sort descending
        list.sort((a, b) => b.timestamp - a.timestamp);
        setNotifications(list);
      } catch (err) {
        console.error('Error fetching notifications:', err);
      } finally {
        setLoadingNotifications(false);
      }
    };

    fetchNotifications();

    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const hasUnreadNotifications = notifications.some(n => n.unread);

  return (
    <div className="min-h-screen bg-brand-black flex text-foreground text-left relative overflow-hidden font-sans">
      
      {/* Background radial lighting */}
      <div className="absolute top-[-15%] left-[-15%] w-[50vw] h-[50vw] glow-purple opacity-25 pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-15%] w-[60vw] h-[60vw] glow-pink opacity-15 pointer-events-none" />

      {/* 1. DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-brand-dark/50 border-r border-brand-border backdrop-blur-xl h-screen sticky top-0 shrink-0 p-6 justify-between z-30 select-none">
        <div className="space-y-8">
          <Link href="/" className="flex items-center gap-2.5 font-heading font-bold text-xl text-white tracking-tight group">
            <Heart className="w-5.5 h-5.5 text-brand-pink fill-brand-pink/20 group-hover:scale-110 transition-transform duration-300" />
            <span>Heartly</span>
          </Link>
          
          <nav className="flex flex-col gap-1">
            {sidebarItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold transition-all relative group cursor-pointer ${
                    active 
                      ? 'bg-brand-purple/10 border border-brand-purple/15 text-white' 
                      : 'border border-transparent text-brand-muted hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={`w-4 h-4 shrink-0 transition-transform duration-300 ${active ? 'text-brand-purple' : 'group-hover:scale-105'}`} />
                    <span>{item.label}</span>
                  </div>
                  {active && (
                    <motion.div 
                      layoutId="sidebar-active-indicator"
                      className="absolute right-0 top-3 bottom-3 w-[3px] rounded-l-full bg-brand-purple"
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold text-brand-muted hover:text-brand-pink hover:bg-brand-pink/5 border border-transparent transition-all cursor-pointer group"
        >
          <LogOut className="w-4 h-4 shrink-0 group-hover:translate-x-[-2px] transition-transform" />
          <span>Exit Workspace</span>
        </button>
      </aside>

      {/* 2. MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 z-10">
        
        {/* Top bar with quick controls */}
        <header className="h-16 border-b border-brand-border bg-brand-dark/25 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20 select-none">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 text-brand-muted hover:text-white rounded-lg border border-brand-border bg-brand-dark/40 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Minimal mockup search bar */}
            <div className="hidden sm:flex items-center gap-2 max-w-xs w-full px-3 py-1.5 rounded-lg border border-brand-border bg-brand-dark/30 text-brand-muted focus-within:border-brand-purple/40 transition-colors">
              <Search className="w-4 h-4 shrink-0" />
              <input 
                type="text" 
                placeholder="Search surprises..."
                className="w-full text-xs bg-transparent border-none outline-none focus:ring-0 text-white placeholder-brand-muted"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/dashboard/create">
              <CustomButton variant="glow" size="sm" icon={Plus} className="text-xs font-semibold">
                Create Surprise
              </CustomButton>
            </Link>
            
            {/* Notification Bell Panel */}
            <div className="relative">
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2.5 text-brand-muted hover:text-white rounded-lg border border-brand-border bg-brand-dark/40 cursor-pointer relative animate-fade-in"
              >
                <Bell className="w-4 h-4" />
                {hasUnreadNotifications && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-brand-pink rounded-full" />
                )}
              </button>
              
              <AnimatePresence>
                {notificationsOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      style={{
                        backgroundColor: 'rgba(10, 10, 20, 0.95)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                      }}
                      className="absolute right-0 mt-2 w-80 rounded-2xl border border-brand-purple/35 shadow-[0_0_25px_rgba(168,85,247,0.15)] p-4 space-y-3 z-50 text-left"
                    >
                      <h4 className="font-heading font-bold text-xs text-white">Notifications</h4>
                      <hr className="border-brand-border/60" />
                      <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                        {loadingNotifications ? (
                          <div className="py-6 text-center text-xs text-brand-muted flex items-center justify-center gap-2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-purple" />
                            <span>Syncing...</span>
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="py-6 text-center text-xs text-brand-muted font-medium">
                            No notifications yet ❤️
                          </div>
                        ) : (
                          notifications.map(n => (
                            <div key={n.id} className="text-[11px] space-y-1 p-2 rounded-lg hover:bg-white/[0.03] transition-colors">
                              <p className={`leading-relaxed ${n.unread ? 'text-white font-semibold' : 'text-brand-muted'}`}>
                                {n.text}
                              </p>
                              <span className="text-[9px] text-brand-purple font-semibold font-mono block">{n.time}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Avatar indicator */}
            <div className="flex items-center gap-2 border-l border-brand-border/60 pl-4">
              <div className="w-8 h-8 rounded-full bg-brand-purple/20 border border-brand-purple/40 flex items-center justify-center text-xs font-bold text-brand-purple uppercase">
                {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </div>
              <span className="hidden lg:inline text-xs font-semibold text-brand-muted truncate max-w-[120px]">
                {profile?.full_name || user?.email?.split('@')[0] || 'Creator'}
              </span>
            </div>
          </div>
        </header>

        {/* Workspace views */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          {children}
        </main>
      </div>

      {/* 3. MOBILE SIDEBAR DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 bg-brand-black/80 backdrop-blur-sm"
          />
          
          <div className="relative w-64 bg-brand-dark border-r border-brand-border p-6 flex flex-col justify-between h-full z-10 animate-slide-in text-left">
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 font-heading font-bold text-xl text-white">
                  <Heart className="w-5.5 h-5.5 text-brand-pink fill-brand-pink/20" />
                  <span>Heartly</span>
                </Link>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-brand-muted hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex flex-col gap-1.5">
                {sidebarItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                        active 
                          ? 'bg-brand-purple/10 border border-brand-purple/25 text-white' 
                          : 'border border-transparent text-brand-muted hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <item.icon className={`w-4 h-4 shrink-0 ${active ? 'text-brand-purple' : ''}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold text-brand-muted hover:text-brand-pink hover:bg-brand-pink/5 border border-transparent transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Exit Workspace</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
