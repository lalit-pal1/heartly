'use client';

import React from 'react';
import { ShoppingBag, CheckCircle2, ArrowDownToLine, Receipt, FileText } from 'lucide-react';

export default function OrdersPage() {
  const orders = [
    {
      id: 'TXN-90231-HR',
      recipient: 'Sophia',
      occasion: 'Birthday',
      plan: 'Premium',
      amount: '₹79',
      status: 'Paid',
      date: 'June 10, 2026',
    },
    {
      id: 'TXN-82194-HR',
      recipient: 'David',
      occasion: 'Anniversary',
      plan: 'Luxury',
      amount: '₹149',
      status: 'Paid',
      date: 'June 05, 2026',
    },
  ];

  return (
    <div className="space-y-8 text-left select-none">
      <div>
        <h1 className="text-2xl font-heading font-extrabold text-white">Invoices & Orders</h1>
        <p className="text-xs text-brand-muted mt-1">Review receipts and activation histories for active surprises.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {orders.map((o) => (
          <div 
            key={o.id}
            className="glass-panel p-6 rounded-3xl border border-brand-border/60 flex flex-col justify-between space-y-6"
          >
            {/* Receipt Header */}
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-brand-muted font-mono tracking-wider">{o.id}</span>
                <h3 className="font-heading font-bold text-white text-base">Surprise Receipt</h3>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {o.status}
              </span>
            </div>

            <hr className="border-brand-border/40" />

            {/* Receipt details */}
            <div className="grid grid-cols-2 gap-4 text-xs text-brand-muted leading-relaxed">
              <div>
                <p className="font-semibold text-white">Recipient</p>
                <p className="mt-0.5">{o.recipient} ({o.occasion})</p>
              </div>
              <div>
                <p className="font-semibold text-white">Date Activated</p>
                <p className="mt-0.5">{o.date}</p>
              </div>
              <div>
                <p className="font-semibold text-white">Tier Plan Selected</p>
                <p className="mt-0.5 capitalize">{o.plan} surprise</p>
              </div>
              <div>
                <p className="font-semibold text-white">Total Amount Paid</p>
                <p className="mt-0.5 text-white font-extrabold text-sm">{o.amount}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-brand-border/40 flex gap-2">
              <button 
                onClick={() => alert('Downloading PDF invoice receipt mockup...')}
                className="flex-1 py-2 rounded-xl bg-brand-dark border border-brand-border text-[11px] font-bold text-brand-muted hover:text-white transition-all hover:border-brand-purple/20 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ArrowDownToLine className="w-3.5 h-3.5" />
                <span>Download PDF Invoice</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
