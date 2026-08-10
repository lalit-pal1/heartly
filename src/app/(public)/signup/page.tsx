'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, User, Mail, Lock, ArrowRight, Loader2, AlertCircle, Gift, CheckCircle2 } from 'lucide-react';
import CustomButton from '@/components/ui/CustomButton';
import { createClient } from '@/utils/supabase/client';
import { getURL } from '@/utils/url';

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState(() => {
    if (typeof window !== 'undefined') {
      const urlCode = searchParams.get('ref');
      if (urlCode) return urlCode;
      const match = document.cookie.match(/(?:^|; )heartly_ref=([^;]*)/);
      return match ? decodeURIComponent(match[1]) : '';
    }
    return '';
  });
  
  const [errorText, setErrorText] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Creating account...');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlCode = searchParams?.get('ref');
      if (urlCode) {
        setReferralCode(urlCode.toUpperCase());
      } else {
        // Fallback to cookie
        const match = document.cookie.match(/(?:^|; )heartly_ref=([^;]*)/);
        if (match) {
          setReferralCode(decodeURIComponent(match[1]).toUpperCase());
        }
      }
    }
  }, [searchParams]);

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');
    setSuccessMessage('');

    if (password !== confirmPassword) {
      setErrorText('Passwords do not match. Please verify.');
      return;
    }

    if (password.length < 6) {
      setErrorText('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    setLoadingText('Saving your credentials...');
    
    try {
      const supabase = createClient();

      // Validate referral code if entered
      if (referralCode.trim()) {
        setLoadingText('Verifying referral code...');
        const { data: isValid, error: validateErr } = await supabase.rpc('validate_referral_code', {
          code_to_check: referralCode.trim()
        });
        if (validateErr || !isValid) {
          setErrorText('Invalid referral code. Please verify and try again, or leave it blank.');
          setIsLoading(false);
          return;
        }
      }

      setLoadingText('Saving your credentials...');
      const { data: signUpData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        setErrorText(error.message);
        setIsLoading(false);
      } else {
        const signedUpUser = signUpData?.user;
        const activeSession = signUpData?.session;

        // Record referral relationship if code was provided
        if (signedUpUser && referralCode.trim()) {
          setLoadingText('Registering referral relation...');
          await supabase.rpc('record_referral', {
            referred_id: signedUpUser.id,
            ref_code: referralCode.trim()
          });
          // Expire referral cookie
          document.cookie = "heartly_ref=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        }

        if (!activeSession) {
          // Email confirmation is enabled
          setLoadingText('');
          setIsLoading(false);
          setSuccessMessage("Account created successfully! ✉️ Please check your email inbox to verify your account before logging in.");
        } else {
          setLoadingText('Workspace ready. Welcome to Heartly! ❤️');
          setTimeout(() => {
            router.push('/dashboard');
          }, 500);
        }
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      setErrorText(err.message || 'Failed to connect to the authentication server. Please check your network connection and Supabase settings in .env.local.');
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setErrorText('');
    setIsLoading(true);
    setLoadingText('Authenticating with Google...');
    
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
      console.error('Google signup error:', err);
      setErrorText(err.message || 'Failed to connect to the authentication server. Please check your connection.');
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[80vh] flex items-center justify-center py-6 text-left select-none">
      
      {/* Onboarding Loading Overlay */}
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

      <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-brand-border/60 space-y-6 w-full max-w-md mx-auto">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 font-heading font-bold text-xl text-white">
            <Heart className="w-5 h-5 text-brand-pink fill-brand-pink/20" />
            <span>Heartly</span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-white text-glow pt-2">Create Account</h1>
          <p className="text-xs text-brand-muted">Craft emotional digital surprises for your loved ones.</p>
        </div>

        {errorText && (
          <div className="text-xs font-semibold text-brand-pink bg-brand-pink/10 border border-brand-pink/20 p-3 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorText}</span>
          </div>
        )}

        {successMessage ? (
          <div className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              <span className="text-sm font-bold text-white">Verify Your Email</span>
            </div>
            <p className="text-brand-muted leading-relaxed">{successMessage}</p>
            <div className="pt-3 border-t border-brand-border/40 text-center">
              <Link href="/login" className="inline-block text-brand-purple hover:underline font-semibold cursor-pointer">
                Go to Login Page &rarr;
              </Link>
            </div>
          </div>
        ) : (
          <>
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-muted pointer-events-none">
                    <User className="w-4 h-4" />
                  </span>
                  <input 
                    type="text" 
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Emma Watson"
                    className="w-full text-xs pl-10 pr-3 py-3 glass-input font-sans"
                  />
                </div>
              </div>

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
                <label className="text-xs font-semibold text-white">Choose Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-muted pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full text-xs pl-10 pr-3 py-3 glass-input font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white">Confirm Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-muted pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input 
                    type="password" 
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="w-full text-xs pl-10 pr-3 py-3 glass-input font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white">Referral Code (Optional)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-muted pointer-events-none">
                    <Gift className="w-4 h-4" />
                  </span>
                  <input 
                    type="text" 
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    placeholder="HEART-XXXX"
                    className="w-full text-xs pl-10 pr-3 py-3 glass-input font-mono"
                  />
                </div>
              </div>

              <div className="pt-2">
                <CustomButton variant="glow" size="md" icon={ArrowRight} iconPosition="right" className="w-full py-3">
                  Get Started Free
                </CustomButton>
              </div>
            </form>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-brand-border/40"></div>
              <span className="flex-shrink mx-4 text-brand-muted text-[9px] uppercase font-bold tracking-wider">or</span>
              <div className="flex-grow border-t border-brand-border/40"></div>
            </div>

            <button 
              onClick={handleGoogleSignup}
              className="w-full py-3 rounded-lg border border-brand-border bg-brand-dark/40 text-xs font-semibold text-white hover:bg-brand-dark hover:border-brand-purple/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Sign up with Google</span>
            </button>

            <p className="text-center text-xs text-brand-muted">
              Already have an account?{' '}
              <Link href="/login" className="text-brand-purple hover:underline font-semibold cursor-pointer">
                Login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 text-center">
        <Loader2 className="w-6 h-6 text-brand-purple animate-spin" />
        <p className="text-xs text-brand-muted font-semibold">Loading Secure Onboarding...</p>
      </div>
    }>
      <SignupContent />
    </Suspense>
  );
}
