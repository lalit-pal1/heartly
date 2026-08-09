'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Heart, AlertCircle, LogIn, Sparkles } from 'lucide-react';
import Link from 'next/link';
import CustomButton from '@/components/ui/CustomButton';
import { useAuth } from '@/context/AuthContext';

export default function AdminLoginPage() {
  const { user, signInWithGoogle, loading: authLoading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Redirect if already authenticated as admin
  useEffect(() => {
    const checkRedirect = async () => {
      // 1. Check Google Auth Whitelist
      if (user && user.email === 'pal929956@gmail.com') {
        router.push('/admin');
        return;
      }

      // 2. Check Cookie Session fallback
      try {
        const res = await fetch('/api/admin/verify-session');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            router.push('/admin');
            return;
          }
        }
      } catch (err) {
        console.warn('Verify session error:', err);
      }

      setCheckingSession(false);
    };

    if (!authLoading) {
      checkRedirect();
    }
  }, [user, authLoading, router]);

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Please fill in both email and password.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid credentials');
      } else {
        router.push('/admin');
      }
    } catch (err) {
      setError('Unable to reach the server. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError('Google Authentication failed.');
      console.error(err);
    }
  };

  if (authLoading || checkingSession) {
    return (
      <div className="min-h-screen bg-brand-black flex flex-col items-center justify-center text-center space-y-4 select-none">
        <div className="w-10 h-10 rounded-full border-[3px] border-brand-purple/20 border-t-brand-purple animate-spin" />
        <p className="text-xs text-brand-muted font-semibold animate-pulse">Checking credentials... 🔒</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-black flex items-center justify-center p-4 text-left select-none relative overflow-hidden font-sans">
      {/* Radial glow background */}
      <div className="absolute top-[-20%] left-[-15%] w-[60vw] h-[60vw] glow-purple opacity-15 pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-15%] w-[60vw] h-[60vw] glow-pink opacity-10 pointer-events-none" />

      <div className="w-full max-w-md p-6 sm:p-8 glass-panel rounded-3xl border border-brand-border/60 shadow-2xl relative space-y-6 z-10">
        
        {/* Portal Branding */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-full bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center text-brand-purple mx-auto animate-pulse">
            <LogIn className="w-7 h-7 ml-0.5" />
          </div>
          <div className="flex items-center justify-center gap-1.5 font-heading font-extrabold text-white text-lg">
            <Heart className="w-5 h-5 text-brand-pink fill-brand-pink/20" />
            <span>Heartly Founder Portal</span>
          </div>
          <p className="text-xs text-brand-muted px-4 leading-relaxed">
            Please authenticate using Google OAuth or your secure manual founder credentials.
          </p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="p-4 rounded-xl bg-brand-pink/10 border border-brand-pink/25 flex items-start gap-3 text-xs text-brand-pink">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span className="font-semibold leading-relaxed">{error}</span>
          </div>
        )}

        {/* Manual Login Form */}
        <form onSubmit={handleManualLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-brand-muted uppercase tracking-wider block">Founder Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
              <input
                type="email"
                placeholder="founder@heartly.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 glass-input text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-brand-muted uppercase tracking-wider block">Secure Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 glass-input text-xs tracking-widest"
              />
            </div>
          </div>

          <CustomButton 
            variant="glow" 
            size="md" 
            disabled={loading} 
            className="w-full font-bold text-xs"
          >
            {loading ? 'Authenticating...' : 'Sign In Manually'}
          </CustomButton>
        </form>

        {/* Separator */}
        <div className="flex items-center justify-center gap-3 py-2 text-[10px] text-brand-muted font-bold uppercase tracking-widest">
          <div className="h-[1px] bg-brand-border/60 flex-1" />
          <span>OR</span>
          <div className="h-[1px] bg-brand-border/60 flex-1" />
        </div>

        {/* Google Login Trigger */}
        <button
          onClick={handleGoogleLogin}
          type="button"
          className="w-full py-3 rounded-xl border border-brand-border bg-brand-dark/40 hover:bg-brand-purple/5 hover:border-brand-purple/30 text-xs font-bold text-white transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
        >
          {/* Google Icon G */}
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.555 0-6.437-2.882-6.437-6.437 0-3.555 2.882-6.437 6.437-6.437 1.542 0 2.946.549 4.053 1.455l3.155-3.155C18.98 1.83 15.836 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.262 0 10.428-4.394 10.428-10.603 0-.649-.058-1.277-.168-1.892H12.24z"
            />
          </svg>
          <span>Sign In with Google</span>
        </button>

        {/* Back to Home Link */}
        <div className="pt-2 text-center">
          <Link href="/" className="text-[10px] text-brand-muted hover:text-white transition-colors uppercase tracking-wider font-semibold">
            ← Back to Heartly Home
          </Link>
        </div>

      </div>
    </div>
  );
}
