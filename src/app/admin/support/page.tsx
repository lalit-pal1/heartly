'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Mail, AlertCircle, Loader2, Search, Trash2, 
  CheckCircle2, Clock, Inbox, ShieldAlert, Lock, LogOut, 
  Heart, Filter, RefreshCw, Eye
} from 'lucide-react';
import CustomButton from '@/components/ui/CustomButton';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/utils/supabase/client';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  reason: string;
  message: string;
  status: 'unread' | 'read';
  created_at: string;
}

export default function SupportInboxPage() {
  const { user, loading: authLoading, signOut: supabaseSignOut } = useAuth();
  const router = useRouter();

  // Admin Auth States
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Message States
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [reasonFilter, setReasonFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All'); // All, Unread, Read

  // Action states
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // 1. Verify Admin Access
  useEffect(() => {
    const checkAccess = async () => {
      setCheckingAuth(true);
      try {
        const res = await fetch('/api/admin/verify-session');
        const data = await res.json();
        if (data.authenticated) {
          setIsAdmin(true);
          return;
        }

        // Fallback to Supabase User Email Check
        const supabase = createClient();
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();
        
        const authorizedEmails = [
          'pal929956@gmail.com',
          'founder@heartly.in',
          'admin@heartly.in',
          'lalit@heartly.in',
          'lalit.gemini@gmail.com'
        ];

        if (supabaseUser && supabaseUser.email && authorizedEmails.includes(supabaseUser.email.toLowerCase())) {
          setIsAdmin(true);
          return;
        }

        setIsAdmin(false);
      } catch (err) {
        console.error('Verify admin session failed:', err);
        setIsAdmin(false);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAccess();
  }, []);

  // 2. Fetch Messages from Supabase
  const fetchMessages = async () => {
    if (isAdmin !== true) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    try {
      const { data, error: dbErr } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbErr) {
        // Check if table missing
        if (dbErr.message.includes('relation "public.contact_messages" does not exist')) {
          throw new Error('Database table "contact_messages" does not exist. Please push schema migrations first!');
        }
        throw dbErr;
      }
      setMessages(data || []);
    } catch (err: any) {
      console.error('Error loading support messages:', err);
      setError(err.message || 'Failed to fetch messages.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [isAdmin]);

  // 3. Mark message as read
  const markAsRead = async (message: ContactMessage) => {
    if (message.status === 'read' || updatingId) return;
    setUpdatingId(message.id);
    const supabase = createClient();
    try {
      const { error: patchErr } = await supabase
        .from('contact_messages')
        .update({ status: 'read' })
        .eq('id', message.id);

      if (patchErr) throw patchErr;

      // Update local state
      setMessages(prev => prev.map(m => m.id === message.id ? { ...m, status: 'read' } : m));
      if (selectedMessage?.id === message.id) {
        setSelectedMessage(prev => prev ? { ...prev, status: 'read' } : null);
      }
    } catch (err: any) {
      console.error('Error updating status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  // 4. Toggle Read/Unread status manually
  const toggleStatus = async (message: ContactMessage) => {
    if (updatingId) return;
    const newStatus = message.status === 'unread' ? 'read' : 'unread';
    setUpdatingId(message.id);
    const supabase = createClient();
    try {
      const { error: patchErr } = await supabase
        .from('contact_messages')
        .update({ status: newStatus })
        .eq('id', message.id);

      if (patchErr) throw patchErr;

      setMessages(prev => prev.map(m => m.id === message.id ? { ...m, status: newStatus } : m));
      setSelectedMessage(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (err: any) {
      console.error('Failed to toggle message status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  // 5. Delete message
  const deleteMessage = async (id: string) => {
    if (deletingId) return;
    const confirmed = window.confirm('Are you sure you want to delete this message?');
    if (!confirmed) return;

    setDeletingId(id);
    const supabase = createClient();
    try {
      const { error: delErr } = await supabase
        .from('contact_messages')
        .delete()
        .eq('id', id);

      if (delErr) throw delErr;

      setMessages(prev => prev.filter(m => m.id !== id));
      if (selectedMessage?.id === id) {
        setSelectedMessage(null);
      }
    } catch (err: any) {
      console.error('Failed to delete message:', err);
      alert('Delete failed: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  // Auto-read selected message
  useEffect(() => {
    if (selectedMessage && selectedMessage.status === 'unread') {
      const timer = setTimeout(() => {
        markAsRead(selectedMessage);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [selectedMessage]);

  // Search & Filter computations
  const filteredMessages = useMemo(() => {
    return messages.filter(m => {
      // 1. Search Query
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query || 
        m.name.toLowerCase().includes(query) ||
        m.email.toLowerCase().includes(query) ||
        m.message.toLowerCase().includes(query);

      // 2. Reason Filter
      const matchesReason = reasonFilter === 'All' || m.reason === reasonFilter;

      // 3. Status Filter
      const matchesStatus = statusFilter === 'All' ||
        (statusFilter === 'Unread' && m.status === 'unread') ||
        (statusFilter === 'Read' && m.status === 'read');

      return matchesSearch && matchesReason && matchesStatus;
    });
  }, [messages, searchQuery, reasonFilter, statusFilter]);

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

  // Auth Loading
  if (authLoading || checkingAuth) {
    return (
      <div className="min-h-screen bg-brand-black flex flex-col items-center justify-center p-6 text-center select-none font-sans">
        <Loader2 className="w-8 h-8 text-brand-purple animate-spin mb-3" />
        <p className="text-xs text-brand-muted font-semibold">Verifying Founder session...</p>
      </div>
    );
  }

  // Access Shield Guard
  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-brand-black flex flex-col items-center justify-center p-6 text-center select-none font-sans relative">
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] glow-purple opacity-20 pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] glow-pink opacity-10 pointer-events-none" />

        <div className="max-w-md w-full p-8 glass-panel rounded-3xl border border-brand-border space-y-6">
          <div className="w-14 h-14 rounded-full bg-brand-pink/10 border border-brand-pink/20 flex items-center justify-center text-brand-pink mx-auto animate-pulse">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-heading font-extrabold text-white">Founder Access Only</h1>
            <p className="text-xs text-brand-muted leading-relaxed">
              This space is reserved for Heartly administrators and founders. Please log in with an authorized email account to view analytics and support tickets.
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
          <Link href="/admin" className="text-brand-muted hover:text-white p-1.5 rounded-lg border border-brand-border bg-brand-dark/40 shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2 font-heading font-bold text-base text-white">
            <Heart className="w-4.5 h-4.5 text-brand-pink fill-brand-pink/20" />
            <span>Support Messages</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchMessages}
            className="p-2 text-brand-muted hover:text-white rounded-lg border border-brand-border bg-brand-dark/40 cursor-pointer transition-all"
            title="Refresh Inbox"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={async () => {
              const supabase = createClient();
              await supabase.auth.signOut();
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

      {/* Main Support Grid Workspace */}
      <main className="max-w-7xl w-full mx-auto px-6 pt-8 flex-1 flex flex-col min-h-[500px]">
        {error ? (
          <div className="p-6 rounded-3xl border border-brand-pink/20 bg-brand-pink/5 max-w-lg mx-auto text-center space-y-4 my-8">
            <AlertCircle className="w-10 h-10 text-brand-pink mx-auto animate-pulse" />
            <h3 className="font-heading font-bold text-white text-base">Schema Conflict Detected</h3>
            <p className="text-xs text-brand-muted leading-relaxed">{error}</p>
            <CustomButton variant="secondary" size="sm" onClick={fetchMessages}>
              Try Syncing Again
            </CustomButton>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch flex-1">
            
            {/* Left messages list: span-5 */}
            <div className="lg:col-span-5 flex flex-col space-y-4 min-h-[400px]">
              
              {/* Search & Filter bar */}
              <div className="p-4 glass-panel rounded-2xl border border-brand-border/60 space-y-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-brand-border bg-brand-dark/30 text-brand-muted focus-within:border-brand-purple/40 transition-colors">
                  <Search className="w-4 h-4 shrink-0" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search sender, email, details..."
                    className="w-full text-xs bg-transparent border-none outline-none focus:ring-0 text-white placeholder-brand-muted"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-brand-muted uppercase tracking-wide">Category</label>
                    <select
                      value={reasonFilter}
                      onChange={(e) => setReasonFilter(e.target.value)}
                      className="w-full text-[10px] p-2 glass-input h-8 font-semibold"
                    >
                      <option>All</option>
                      <option>Custom templates requests</option>
                      <option>Billing / Payment issues</option>
                      <option>Link recovery support</option>
                      <option>General feedback</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-brand-muted uppercase tracking-wide">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full text-[10px] p-2 glass-input h-8 font-semibold"
                    >
                      <option>All</option>
                      <option>Unread</option>
                      <option>Read</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Messages list container */}
              <div className="flex-1 overflow-y-auto max-h-[600px] pr-1 space-y-2.5">
                {loading ? (
                  <div className="py-20 text-center text-xs text-brand-muted flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-brand-purple" />
                    <span>Loading support mailbox...</span>
                  </div>
                ) : filteredMessages.length === 0 ? (
                  <div className="py-20 text-center glass-panel border border-brand-border rounded-2xl text-brand-muted text-xs flex flex-col items-center justify-center gap-2">
                    <Inbox className="w-8 h-8 text-brand-border" />
                    <span>No matching support messages found.</span>
                  </div>
                ) : (
                  filteredMessages.map(m => (
                    <div
                      key={m.id}
                      onClick={() => setSelectedMessage(m)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer text-left relative group ${
                        selectedMessage?.id === m.id
                          ? 'bg-brand-purple/10 border-brand-purple/40 shadow-[0_0_15px_rgba(168,85,247,0.1)]'
                          : 'bg-brand-dark/20 border-brand-border/60 hover:bg-white/[0.02] hover:border-brand-purple/20'
                      }`}
                    >
                      {m.status === 'unread' && (
                        <span className="absolute top-4 right-4 w-2 h-2 bg-brand-pink rounded-full animate-pulse" />
                      )}
                      <div className="space-y-1.5 pr-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold text-white text-xs truncate max-w-[150px]">{m.name}</h4>
                          <span className="text-[9px] text-brand-muted font-mono">{formatRelativeTime(m.created_at)}</span>
                        </div>
                        <p className="text-[10px] text-brand-purple font-semibold">{m.reason}</p>
                        <p className="text-[10px] text-brand-muted line-clamp-2 leading-relaxed">
                          {m.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right message details pane: span-7 */}
            <div className="lg:col-span-7 flex flex-col">
              <div className="glass-panel border border-brand-border/60 rounded-3xl p-6 sm:p-8 flex-1 flex flex-col justify-between min-h-[400px]">
                {selectedMessage ? (
                  <div className="space-y-6 flex-1 flex flex-col justify-between">
                    
                    {/* Header info */}
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-brand-border/40">
                        <div>
                          <h2 className="text-lg font-heading font-bold text-white">{selectedMessage.name}</h2>
                          <div className="flex items-center gap-1.5 text-xs text-brand-purple font-semibold mt-0.5">
                            <Mail className="w-3.5 h-3.5" />
                            <a href={`mailto:${selectedMessage.email}`} className="hover:underline">
                              {selectedMessage.email}
                            </a>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-brand-muted bg-brand-dark/50 border border-brand-border px-2.5 py-1 rounded-lg">
                          {new Date(selectedMessage.created_at).toLocaleString()}
                        </span>
                      </div>

                      <div className="space-y-1 bg-brand-purple/5 border border-brand-purple/10 p-3.5 rounded-xl text-left">
                        <span className="text-[9px] font-bold text-brand-purple uppercase tracking-wider">Inquiry Reason</span>
                        <p className="text-xs font-semibold text-white">{selectedMessage.reason}</p>
                      </div>

                      <div className="space-y-2 pt-2">
                        <span className="text-[9px] font-bold text-brand-muted uppercase tracking-wider">Message Description</span>
                        <div className="p-4 rounded-xl border border-brand-border/40 bg-brand-dark/25 text-xs text-white leading-relaxed min-h-[160px] whitespace-pre-wrap text-left select-text">
                          {selectedMessage.message}
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-6 border-t border-brand-border/40">
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleStatus(selectedMessage)}
                          disabled={!!updatingId}
                          className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                            selectedMessage.status === 'read'
                              ? 'border-brand-purple/30 bg-brand-purple/10 text-brand-purple hover:bg-brand-purple/20'
                              : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                          }`}
                        >
                          <Eye className="w-4 h-4 shrink-0" />
                          <span>{selectedMessage.status === 'read' ? 'Mark Unread' : 'Mark Read'}</span>
                        </button>

                        <a 
                          href={`mailto:${selectedMessage.email}?subject=Re: [Heartly Support] ${selectedMessage.reason}`}
                          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-brand-purple text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                        >
                          <Mail className="w-4 h-4 shrink-0" />
                          <span>Send Response Email</span>
                        </a>
                      </div>

                      <button
                        onClick={() => deleteMessage(selectedMessage.id)}
                        disabled={!!deletingId}
                        className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border border-brand-pink/20 hover:border-brand-pink/40 hover:bg-brand-pink/5 text-xs font-bold text-brand-pink cursor-pointer active:scale-95 transition-all"
                      >
                        <Trash2 className="w-4 h-4 shrink-0" />
                        <span>Delete Message</span>
                      </button>

                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-brand-muted space-y-3">
                    <Inbox className="w-12 h-12 text-brand-border animate-pulse" />
                    <div>
                      <h3 className="font-heading font-bold text-white text-sm">Select Message</h3>
                      <p className="text-[11px] text-brand-muted mt-1 max-w-xs leading-relaxed">
                        Choose an inquiry from the customer message list to read full details and send email responses.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </main>

    </div>
  );
}
