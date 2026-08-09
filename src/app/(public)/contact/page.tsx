'use client';

import React, { useState } from 'react';
import { Mail, MessageSquare, Send, Heart, Loader2, AlertCircle } from 'lucide-react';
import CustomButton from '@/components/ui/CustomButton';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('Custom templates requests');
  const [message, setMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Client-side validations
    if (!name.trim()) {
      setError('Please enter your full name.');
      setSubmitting(false);
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      setSubmitting(false);
      return;
    }
    if (!message.trim()) {
      setError('Please enter your message details.');
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          reason,
          message: message.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit contact request.');
      }

      setSubmitted(true);
      // Reset form
      setName('');
      setEmail('');
      setReason('Custom templates requests');
      setMessage('');
    } catch (err: any) {
      console.error('Submission failed:', err);
      setError(err.message || 'Something went wrong. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-12 text-left">
      <div className="space-y-3 text-center">
        <h1 className="text-4xl font-heading font-extrabold text-white text-glow">Contact Us</h1>
        <p className="text-sm text-brand-muted max-w-sm mx-auto">
          Need help setting up a surprise, custom orders, or billing support? We are here.
        </p>
      </div>

      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-brand-border">
        {submitted ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-12 h-12 rounded-full bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center text-brand-purple mx-auto animate-bounce">
              <Heart className="w-6 h-6 fill-brand-purple/20" />
            </div>
            <h3 className="font-heading font-bold text-white text-lg animate-fade-in">Message Sent!</h3>
            <p className="text-xs text-brand-muted max-w-xs mx-auto leading-relaxed">
              Thank you for reaching out. A support companion will get back to your email within 12 hours.
            </p>
            <CustomButton variant="secondary" size="sm" onClick={() => setSubmitted(false)}>
              Send another message
            </CustomButton>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3.5 rounded-xl border border-brand-pink/20 bg-brand-pink/5 text-[11px] text-brand-pink flex items-center gap-2 select-none animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter name"
                  disabled={submitting}
                  className="w-full text-xs p-3 glass-input disabled:opacity-50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  disabled={submitting}
                  className="w-full text-xs p-3 glass-input disabled:opacity-50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-white">Reason for inquiry</label>
              <select 
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={submitting}
                className="w-full text-xs p-3 glass-input disabled:opacity-50"
              >
                <option>Custom templates requests</option>
                <option>Billing / Payment issues</option>
                <option>Link recovery support</option>
                <option>General feedback</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-white">Message Details</label>
              <textarea 
                rows={5}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="How can we make your experience better?"
                disabled={submitting}
                className="w-full text-xs p-3 glass-input disabled:opacity-50"
              />
            </div>

            <CustomButton 
              variant="glow" 
              size="md" 
              icon={submitting ? undefined : Send} 
              className="w-full"
              disabled={submitting}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Sending Message...
                </span>
              ) : (
                'Send Message'
              )}
            </CustomButton>
          </form>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-center select-none">
        <div className="p-4 rounded-2xl border border-brand-border bg-brand-dark/30 flex items-center gap-3 justify-center">
          <Mail className="w-5 h-5 text-brand-purple" />
          <div className="text-left">
            <h4 className="text-xs font-semibold text-white">Email Support</h4>
            <p className="text-[10px] text-brand-muted">support@heartly.me</p>
          </div>
        </div>
        <div className="p-4 rounded-2xl border border-brand-border bg-brand-dark/30 flex items-center gap-3 justify-center">
          <MessageSquare className="w-5 h-5 text-brand-pink" />
          <div className="text-left">
            <h4 className="text-xs font-semibold text-white">Instagram Support</h4>
            <p className="text-[10px] text-brand-muted">@heartly.me</p>
          </div>
        </div>
      </div>
    </div>
  );
}
