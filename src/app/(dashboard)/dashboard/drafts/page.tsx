'use client';

import React from 'react';
import Link from 'next/link';
import { useHeartly } from '@/context/HeartlyContext';
import { FileEdit, Plus, Trash2, ArrowRight, Clock } from 'lucide-react';
import CustomButton from '@/components/ui/CustomButton';

export default function DraftsPage() {
  const { surprises, deleteSurprise } = useHeartly();
  const drafts = surprises.filter((s) => s.status === 'draft');

  // Helper mock steps completed
  const mockSteps = [
    { completed: 4, label: 'Message Drafted' },
    { completed: 6, label: 'Theme Selected' },
    { completed: 2, label: 'Recipient Added' },
  ];

  return (
    <div className="space-y-8 text-left select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-white">Drafts</h1>
          <p className="text-xs text-brand-muted mt-1">Pick up where you left off. Continue crafting your surprises.</p>
        </div>
        <Link href="/dashboard/create">
          <CustomButton variant="glow" size="sm" icon={Plus}>
            New Draft
          </CustomButton>
        </Link>
      </div>

      {drafts.length === 0 ? (
        <div className="glass-panel p-16 rounded-3xl border border-brand-border text-center space-y-6">
          <div className="w-12 h-12 rounded-full bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center text-brand-purple mx-auto">
            <FileEdit className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h3 className="font-heading font-bold text-white text-lg">No Drafts Found</h3>
            <p className="text-xs text-brand-muted max-w-sm mx-auto leading-relaxed">
              Any surprise you exit midway while building will appear here so you don't lose any of your precious writing or pictures.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {drafts.map((d, dIdx) => {
            const stepInfo = mockSteps[dIdx % mockSteps.length];
            return (
              <div 
                key={d.id} 
                className="glass-card p-6 rounded-2xl border border-brand-border/60 flex flex-col justify-between group"
              >
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-bold tracking-wider uppercase text-brand-purple px-2 py-0.5 rounded bg-brand-purple/10 border border-brand-purple/20">
                      {d.occasion}
                    </span>
                    <span className="text-[10px] text-brand-muted flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(d.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-heading font-bold text-white text-base leading-snug group-hover:text-brand-purple transition-colors truncate">
                      {d.title || 'Untitled Surprise'}
                    </h3>
                    <p className="text-[11px] text-brand-muted mt-1">Recipient: {d.recipientName || 'Unspecified'}</p>
                  </div>

                  {/* Simulated step progress indicator */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-[9px] text-brand-muted font-bold font-mono">
                      <span>Step {stepInfo.completed} of 9 completed</span>
                      <span>{stepInfo.label}</span>
                    </div>
                    <div className="w-full h-1 bg-brand-dark rounded-full overflow-hidden flex">
                      <div 
                        className="h-full bg-gradient-to-r from-brand-purple to-brand-pink"
                        style={{ width: `${(stepInfo.completed / 9) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-brand-border/40 mt-6 flex items-center justify-between">
                  <button 
                    onClick={() => deleteSurprise(d.id)}
                    className="text-xs text-brand-muted hover:text-brand-pink flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                  
                  <Link href="/dashboard/create">
                    <CustomButton variant="primary" size="sm" icon={ArrowRight} iconPosition="right" className="text-xs font-semibold py-1.5 px-3">
                      Resume
                    </CustomButton>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
