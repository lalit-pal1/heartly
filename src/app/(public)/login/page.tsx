'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Mail, Lock, ArrowRight, Loader2, Sparkles, Volume2, AlertCircle } from 'lucide-react';
import CustomButton from '@/components/ui/CustomButton';
import { createClient } from '@/utils/supabase/client';
import { getURL } from '@/utils/url';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorText, setErrorText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Securing connection...');

  useEffect(() => {
    const errorParam = searchParams?.get('error');
    if (errorParam) {
      setErrorText(errorParam);
    }
  }, [searchParams]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');
    setIsLoading(true);
    setLoadingText('Verifying credentials...');

    // Intercept admin credentials for secure server-side admin session creation
    if (email.trim().toLowerCase() === 'pal929956@gmail.com') {
      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          setErrorText(data.error || 'Invalid login credentials');
          setIsLoading(false);
        } else {
          setLoadingText('Admin access granted. Redirecting... 🔒');
          setTimeout(() => {
            router.push('/admin');
          }, 500);
        }
      } catch (err: any) {
        console.error('Admin login error:', err);
        setErrorText('Failed to authenticate with admin server. Please try again.');
        setIsLoading(false);
      }
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorText(error.message);
        setIsLoading(false);
      } else {
        setLoadingText('Access granted. Welcome back! ❤️');
        setTimeout(() => {
          router.push('/dashboard');
        }, 500);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorText(err.message || 'Failed to connect to the authentication server. Please check your network connection and Supabase settings in .env.local.');
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorText('');
    setIsLoading(true);
    setLoadingText('Connecting with Google...');
    
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${getURL()}/auth/callback`,
        },
      });

      if (error) {
        setErrorText(error.message);
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('Google login error:', err);
      setErrorText(err.message || 'Failed to connect to the authentication server. Please check your connection.');
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[80vh] flex items-center justify-center p-0 text-left select-none">
      
      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-brand-black/90 backdrop-blur-md z-50 flex flex-col items-center justify-center space-y-4 text-center"
          >
            <Loader2 className="w-8 h-8 text-brand-purple animate-spin" />
            <motion.p 
              key={loadingText}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs font-semibold text-brand-muted"
            >
              {loadingText}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main split-screen container */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch min-h-[70vh]">
        
        {/* LEFT COLUMN: BRANDING & STORY (Desktop only) */}
        <div className="hidden lg:flex lg:col-span-6 flex-col justify-between p-8 rounded-3xl relative overflow-hidden border border-brand-border/60 bg-gradient-to-br from-brand-dark/40 via-brand-purple/5 to-transparent">
          <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] glow-purple opacity-20 pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] glow-pink opacity-15 pointer-events-none" />

          {/* Tagline */}
          <div className="space-y-3 relative z-10">
            <Link href="/" className="inline-flex items-center gap-2 font-heading font-bold text-xl text-white group">
              <Heart className="w-5 h-5 text-brand-pink fill-brand-pink/20 group-hover:scale-110 transition-all duration-300" />
              <span>Heartly</span>
            </Link>
            <h2 className="text-3xl font-heading font-extrabold text-white leading-tight pt-4 text-glow">
              Welcome Back ❤️
            </h2>
            <p className="text-xs text-brand-muted max-w-sm">
              Continue creating unforgettable moments and stories for the people you love.
            </p>
          </div>

          {/* Animated floating Polaroid mockup */}
          <motion.div 
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="w-[240px] glass-card p-4 rounded-2xl border border-white/5 shadow-2xl mx-auto my-8 relative z-10 rotate-[-2deg] select-none pointer-events-none"
          >
            <div className="relative aspect-square w-full rounded-xl overflow-hidden border border-white/5 bg-brand-dark">
              <img 
                src="https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400&auto=format&fit=crop&q=80" 
                alt="happy memories" 
                className="w-full h-full object-cover filter brightness-90"
              />
            </div>
            <div className="pt-3 space-y-1.5 text-left text-[9px] text-brand-muted">
              <p className="font-semibold text-white">Anniversary Surprise</p>
              <p className="italic">“Spilling coffee on our first date, burning pasta, and endless smiles...”</p>
              <div className="flex items-center gap-1 text-[8px] text-brand-purple">
                <Volume2 className="w-3.5 h-3.5" />
                <span>Soft Romantic Melody</span>
              </div>
            </div>
          </motion.div>

          <p className="text-[10px] text-brand-muted relative z-10 font-mono">
            Designed for emotional connections.
          </p>
        </div>

        {/* RIGHT COLUMN: GLASS FORM */}
        <div className="lg:col-span-6 flex flex-col justify-center">
          <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-brand-border/60 space-y-6 w-full max-w-md mx-auto">
            
            {/* Header info (visible on mobile where left side is hidden) */}
            <div className="space-y-1 text-center lg:text-left">
              <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-white text-glow">Sign In</h1>
              <p className="text-xs text-brand-muted">Access your Heartly creations and edit drafts.</p>
            </div>

            {errorText && (
              <div className="text-xs font-semibold text-brand-pink bg-brand-pink/10 border border-brand-pink/20 p-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorText}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-muted pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@email.com"
                    className="w-full text-xs pl-10 pr-3 py-3 glass-input font-sans"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-white">Password</label>
                  <Link href="/forgot-password" className="text-[10px] text-brand-purple hover:underline font-semibold cursor-pointer">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-muted pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs pl-10 pr-3 py-3 glass-input font-mono"
                  />
                </div>
              </div>

              <div className="pt-2">
                <CustomButton variant="glow" size="md" icon={ArrowRight} iconPosition="right" className="w-full py-3">
                  Sign In
                </CustomButton>
              </div>
            </form>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-brand-border/40"></div>
              <span className="flex-shrink mx-4 text-brand-muted text-[9px] uppercase font-bold tracking-wider">or</span>
              <div className="flex-grow border-t border-brand-border/40"></div>
            </div>

            <button 
              onClick={handleGoogleLogin}
              className="w-full py-3 rounded-lg border border-brand-border bg-brand-dark/40 text-xs font-semibold text-white hover:bg-brand-dark hover:border-brand-purple/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            <p className="text-center text-xs text-brand-muted">
              Don't have an account?{' '}
              <Link href="/signup" className="text-brand-purple hover:underline font-semibold cursor-pointer">
                Sign Up
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 text-center">
        <Loader2 className="w-6 h-6 text-brand-purple animate-spin" />
        <p className="text-xs text-brand-muted font-semibold">Loading Secure Login...</p>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
