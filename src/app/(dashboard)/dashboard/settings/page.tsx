'use client';

import React, { useState, useEffect } from 'react';
import { Settings, User, Bell, CreditCard, Shield, Save, Moon, LogOut, AlertCircle, Gift, Copy, Share2, Check, Award, Clock, ShieldAlert, Loader2 } from 'lucide-react';
import CustomButton from '@/components/ui/CustomButton';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';

export default function SettingsPage() {
  const { signOut, user, profile: authProfile } = useAuth();
  const router = useRouter();

  const [activeSection, setActiveSection] = useState('profile');
  const [successMsg, setSuccessMsg] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Referrals & Reward Credits States
  const [basicCredits, setBasicCredits] = useState(0);
  const [lifetimeRewards, setLifetimeRewards] = useState(0);
  const [referralsList, setReferralsList] = useState<any[]>([]);
  const [loadingReferrals, setLoadingReferrals] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  useEffect(() => {
    const fetchReferralData = async () => {
      if (!user) return;
      setLoadingReferrals(true);
      const supabase = createClient();
      try {
        // Fetch credits
        const { data: creditsData } = await supabase
          .from('reward_credits')
          .select('basic_credits, lifetime_credits')
          .eq('user_id', user.id)
          .maybeSingle();

        if (creditsData) {
          setBasicCredits(creditsData.basic_credits);
          setLifetimeRewards(creditsData.lifetime_credits);
        }

        // Fetch referral history from the secure history view
        const { data: historyData } = await supabase
          .from('referral_history_view')
          .select('*')
          .order('signup_time', { ascending: false });

        if (historyData) {
          setReferralsList(historyData);
        }
      } catch (err) {
        console.error('Error fetching referral data:', err);
      } finally {
        setLoadingReferrals(false);
      }
    };

    if (activeSection === 'referrals') {
      fetchReferralData();
    }
  }, [user, activeSection]);

  const referralLink = typeof window !== 'undefined' && authProfile?.referral_code
    ? `${window.location.origin}/signup?ref=${authProfile.referral_code}`
    : '';

  const handleCopyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleShareLink = async () => {
    if (!referralLink) return;
    const shareData = {
      title: 'Join Heartly ❤️',
      text: 'Make your loved ones smile with premium emotional digital surprises! Sign up using my referral link:',
      url: referralLink,
    };
    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      } else {
        handleCopyLink();
      }
    } catch (err) {
      console.warn('Web Share failed, fallback to copy:', err);
      handleCopyLink();
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 3000);
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      // 1. Sign out from Supabase (Google or Email/Password session)
      await signOut();
      
      // 2. Clear secure admin manual session cookie if present
      await fetch('/api/admin/logout', { method: 'POST' });
      
      // 3. Redirect to /login
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setSigningOut(false);
      setShowSignOutModal(false);
    }
  };

  const navs = [
    { id: 'profile', label: 'Profile Settings', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'billing', label: 'Billing Settings', icon: CreditCard },
    { id: 'security', label: 'Security & Auth', icon: Shield },
    { id: 'referrals', label: 'Invite Friends', icon: Gift },
    { id: 'signout', label: 'Sign Out', icon: LogOut },
  ];

  return (
    <div className="space-y-8 text-left select-none relative">
      <div>
        <h1 className="text-2xl font-heading font-extrabold text-white">Settings</h1>
        <p className="text-xs text-brand-muted mt-1">Configure profile details, invoices, and notification channels.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Tab side panel navigation */}
        <nav className="md:col-span-4 flex flex-col gap-1">
          {navs.map((n) => {
            const active = activeSection === n.id;
            return (
              <button
                key={n.id}
                onClick={() => {
                  if (n.id === 'signout') {
                    setShowSignOutModal(true);
                  } else {
                    setActiveSection(n.id);
                  }
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-left ${
                  active 
                    ? 'bg-brand-purple/10 border-brand-purple/20 text-white'
                    : 'border-transparent text-brand-muted hover:text-white hover:bg-white/5'
                }`}
              >
                <n.icon className={`w-4 h-4 shrink-0 ${active ? 'text-brand-purple' : ''}`} />
                <span>{n.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Tab contents */}
        <div className="md:col-span-8 glass-panel p-6 sm:p-8 rounded-3xl border border-brand-border/60 relative">
          
          {successMsg && (
            <div className="mb-4 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
              Settings successfully saved!
            </div>
          )}

          {activeSection === 'profile' && (
            <form onSubmit={handleSave} className="space-y-6">
              <h3 className="font-heading font-bold text-white text-sm">Personal Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white">Full Name</label>
                  <input type="text" defaultValue="Lalit Kumar" className="w-full text-xs p-3 glass-input" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white">Email Address</label>
                  <input type="email" defaultValue="lalit@gmail.com" className="w-full text-xs p-3 glass-input" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white">Preferred Currency</label>
                <select className="w-full text-xs p-3 glass-input">
                  <option value="INR">INR (₹) - Indian Rupee</option>
                  <option value="USD">USD ($) - US Dollar</option>
                </select>
              </div>
              <CustomButton variant="glow" size="sm" icon={Save}>
                Save Profile
              </CustomButton>
            </form>
          )}

          {activeSection === 'notifications' && (
            <form onSubmit={handleSave} className="space-y-6">
              <h3 className="font-heading font-bold text-white text-sm">Alert Channels</h3>
              <div className="space-y-4 text-xs">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded border-brand-border bg-brand-dark/50 text-brand-purple focus:ring-0" />
                  <span className="text-brand-muted">Email me when a loved one opens my surprise link</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded border-brand-border bg-brand-dark/50 text-brand-purple focus:ring-0" />
                  <span className="text-brand-muted">Notify me about holiday themes and template additions</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="rounded border-brand-border bg-brand-dark/50 text-brand-purple focus:ring-0" />
                  <span className="text-brand-muted">Send text alerts to my whatsapp number</span>
                </label>
              </div>
              <CustomButton variant="glow" size="sm" icon={Save}>
                Save Alerts
              </CustomButton>
            </form>
          )}

          {activeSection === 'billing' && (
            <div className="space-y-6 text-xs text-brand-muted leading-relaxed">
              <h3 className="font-heading font-bold text-white text-sm">Billing Tiers</h3>
              <p>You are currently on the **Creator Free Trial**.</p>
              <div className="p-4 rounded-xl border border-brand-border bg-brand-dark/30">
                <h4 className="font-semibold text-white mb-1">Razorpay Setup</h4>
                <p>Payment status endpoints are ready for sandbox transactions. Live payments will trigger automatically on invoice select.</p>
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <form onSubmit={handleSave} className="space-y-6">
              <h3 className="font-heading font-bold text-white text-sm">Security Controls</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white">Current Password</label>
                  <input type="password" placeholder="••••••••" className="w-full text-xs p-3 glass-input font-mono" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white">New Password</label>
                  <input type="password" placeholder="Min 8 characters" className="w-full text-xs p-3 glass-input font-mono" />
                </div>
              </div>
              <CustomButton variant="glow" size="sm" icon={Save}>
                Update Password
              </CustomButton>
            </form>
          )}

          {activeSection === 'referrals' && (
            <div className="space-y-8 select-none text-left">
              {/* Header section */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-border/40">
                <div className="space-y-1">
                  <h3 className="font-heading font-extrabold text-white text-base flex items-center gap-2">
                    <Gift className="w-5 h-5 text-brand-purple" />
                    <span>Invite Friends & Earn Credits</span>
                  </h3>
                  <p className="text-[11px] text-brand-muted leading-relaxed max-w-md">
                    Share the love! Get a free **₹39 Basic Surprise Credit** for every friend who signs up and makes their first plan purchase.
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-brand-purple/10 border border-brand-purple/20 px-3 py-1.5 rounded-xl shrink-0">
                  <span className="text-[10px] text-brand-muted uppercase font-bold tracking-wider">Your Code:</span>
                  <span className="text-xs font-mono font-bold text-white tracking-widest bg-brand-black/35 px-2 py-0.5 rounded border border-brand-border/40 select-text">
                    {authProfile?.referral_code || 'GENERATING...'}
                  </span>
                </div>
              </div>

              {/* Referral link & Copy/Share card */}
              <div className="p-5 rounded-2xl border border-brand-border bg-brand-dark/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <span className="text-[9px] text-brand-muted uppercase font-extrabold tracking-wider">Referral Link</span>
                  <div className="text-xs text-white font-mono bg-brand-black/40 border border-brand-border/50 px-3 py-2.5 rounded-xl overflow-x-auto truncate select-all">
                    {referralLink || 'Sign in to generate link'}
                  </div>
                </div>
                <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                  <button
                    onClick={handleCopyLink}
                    type="button"
                    className="px-4 py-2.5 rounded-xl border border-brand-border bg-brand-dark/40 hover:bg-white/5 text-xs font-bold text-white transition-all cursor-pointer flex items-center gap-1.5 active:scale-98"
                  >
                    {copySuccess ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleShareLink}
                    type="button"
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-purple to-brand-pink text-xs font-bold text-white transition-all cursor-pointer flex items-center gap-1.5 hover:opacity-90 active:scale-98"
                  >
                    {shareSuccess ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Shared!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4" />
                        <span>Invite Friends</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Metrics grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl border border-brand-border bg-brand-dark/20 text-center space-y-1.5">
                  <span className="text-[9px] text-brand-muted uppercase font-extrabold tracking-wider block">Available Credits</span>
                  <span className="text-3xl font-heading font-extrabold text-white text-glow-purple block">{basicCredits}</span>
                  <span className="text-[10px] text-brand-muted block font-medium">₹39 Basic Surprises</span>
                </div>
                <div className="p-4 rounded-2xl border border-brand-border bg-brand-dark/20 text-center space-y-1.5">
                  <span className="text-[9px] text-brand-muted uppercase font-extrabold tracking-wider block">Successful Invites</span>
                  <span className="text-3xl font-heading font-extrabold text-white text-glow-pink block">
                    {referralsList.filter(r => r.is_rewarded).length}
                  </span>
                  <span className="text-[10px] text-brand-muted block font-medium">Referred purchases</span>
                </div>
                <div className="p-4 rounded-2xl border border-brand-border bg-brand-dark/20 text-center space-y-1.5">
                  <span className="text-[9px] text-brand-muted uppercase font-extrabold tracking-wider block">Total Earned</span>
                  <span className="text-3xl font-heading font-extrabold text-white text-glow block">{lifetimeRewards}</span>
                  <span className="text-[10px] text-brand-muted block font-medium">Lifetime free credits</span>
                </div>
              </div>

              {/* Referral History */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Referral History</h4>
                {loadingReferrals ? (
                  <div className="py-8 flex flex-col items-center justify-center text-center space-y-2 text-brand-muted text-xs">
                    <Loader2 className="w-5 h-5 text-brand-purple animate-spin" />
                    <span>Loading your referrals...</span>
                  </div>
                ) : referralsList.length === 0 ? (
                  <div className="p-6 rounded-2xl border border-dashed border-brand-border text-center text-brand-muted text-xs space-y-2">
                    <Gift className="w-8 h-8 text-brand-border/40 mx-auto" />
                    <p className="font-semibold">No referrals yet</p>
                    <p className="text-[10px] max-w-xs mx-auto">Your invites will appear here once your friends sign up using your referral link.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-brand-border bg-brand-dark/20">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-brand-border bg-brand-black/20 text-brand-muted font-semibold">
                          <th className="p-3">Friend</th>
                          <th className="p-3">Signup Date</th>
                          <th className="p-3">Purchase Status</th>
                          <th className="p-3">Reward Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-border/40 text-white">
                        {referralsList.map((ref) => {
                          const isRewarded = ref.is_rewarded;
                          const purchaseStatus = ref.purchase_status;
                          const reviewRequired = ref.refund_review_required;

                          return (
                            <tr key={ref.id} className="hover:bg-white/5 transition-colors">
                              <td className="p-3 font-semibold max-w-[150px] truncate">
                                {ref.friend_name || ref.friend_email.split('@')[0]}
                                <span className="block text-[10px] text-brand-muted font-normal mt-0.5 select-all">
                                  {ref.friend_email}
                                </span>
                              </td>
                              <td className="p-3 text-brand-muted">
                                {new Date(ref.signup_time).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </td>
                              <td className="p-3">
                                {purchaseStatus === 'captured' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-400">
                                    <Award className="w-3 h-3" /> Paid Plan
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[9px] font-bold text-amber-400">
                                    <Clock className="w-3 h-3" /> Pending Purchase
                                  </span>
                                )}
                              </td>
                              <td className="p-3">
                                {reviewRequired ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-pink/10 border border-brand-pink/20 text-[9px] font-bold text-brand-pink">
                                    <ShieldAlert className="w-3 h-3" /> Under Review
                                  </span>
                                ) : isRewarded ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-purple/10 border border-brand-purple/20 text-[9px] font-bold text-brand-purple text-glow">
                                    <Award className="w-3 h-3" /> Credit Issued
                                  </span>
                                ) : purchaseStatus === 'captured' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-400">
                                    Credit Claimed
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-brand-muted">Locks until first paid plan purchase</span>
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
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showSignOutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSignOutModal(false)}
              className="absolute inset-0 bg-brand-black/80 backdrop-blur-sm"
            />
            
            {/* Modal Body */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="w-full max-w-sm glass-panel p-6 sm:p-8 rounded-3xl border border-brand-border/60 shadow-2xl relative z-10 space-y-6 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-brand-pink/10 border border-brand-pink/20 flex items-center justify-center text-brand-pink mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>

              <div className="space-y-2">
                <h3 className="font-heading font-extrabold text-white text-lg">Are you sure?</h3>
                <p className="text-xs text-brand-muted leading-relaxed">
                  You will be signed out from your account.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowSignOutModal(false)}
                  type="button"
                  className="flex-1 py-2.5 rounded-xl border border-brand-border bg-brand-dark/40 hover:bg-white/5 text-xs font-semibold text-white transition-all cursor-pointer active:scale-98"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  type="button"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-brand-purple to-brand-pink text-xs font-bold text-white transition-all cursor-pointer hover:opacity-90 active:scale-98 disabled:opacity-50"
                >
                  {signingOut ? 'Signing out...' : 'Yes, Sign Out'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
