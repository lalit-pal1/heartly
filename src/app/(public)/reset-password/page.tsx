'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Heart, Lock, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import CustomButton from '@/components/ui/CustomButton';
import { createClient } from '@/utils/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');

    if (password !== confirmPassword) {
      setErrorText('Passwords do not match. Please verify.');
      return;
    }

    if (password.length < 6) {
      setErrorText('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setErrorText(error.message);
      setIsLoading(false);
    } else {
      setIsSuccess(true);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isSuccess && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isSuccess && countdown === 0) {
      router.push('/dashboard');
    }
  }, [isSuccess, countdown, router]);

  return (
    <div className="relative min-h-[75vh] flex items-center justify-center py-6 text-left select-none">
      
      <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-brand-border/60 space-y-6 w-full max-w-sm mx-auto">
        
        {/* Branding header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 font-heading font-bold text-xl text-white">
            <Heart className="w-5 h-5 text-brand-pink fill-brand-pink/20" />
            <span>Heartly</span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-white text-glow pt-2">Set New Password</h1>
          <p className="text-xs text-brand-muted px-2">Choose a secure password for your account</p>
        </div>

        {isSuccess ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-6 space-y-4"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading font-bold text-white text-sm">Password Updated</h3>
              <p className="text-[11px] text-brand-muted max-w-xs mx-auto leading-relaxed">
                Your password has been changed successfully. You can now access your dashboard.
              </p>
            </div>
            <p className="text-[10px] text-brand-muted">
              Redirecting to Dashboard in <span className="text-brand-purple font-bold font-mono">{countdown}</span> seconds...
            </p>
            <div className="pt-2">
              <Link href="/dashboard">
                <CustomButton variant="glow" size="sm" icon={ArrowRight} className="w-full">
                  Go to Dashboard
                </CustomButton>
              </Link>
            </div>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorText && (
              <div className="text-xs font-semibold text-brand-pink bg-brand-pink/10 border border-brand-pink/20 p-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorText}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white">New Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-muted pointer-events-none">
                  <Lock className="w-4 h-4" />
                </span>
                <input 
                  type="password" 
                  required
                  value={password}
                  disabled={isLoading}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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
                  disabled={isLoading}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs pl-10 pr-3 py-3 glass-input font-mono"
                />
              </div>
            </div>

            <div className="pt-2">
              <CustomButton variant="glow" size="md" className="w-full py-3" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Password'}
              </CustomButton>
            </div>
          </form>
        )}
      </div>

    </div>
  );
}
