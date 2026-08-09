'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, HelpCircle, ArrowRight } from 'lucide-react';
import CustomButton from '@/components/ui/CustomButton';

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const plans = [
    {
      name: 'Free',
      price: '₹0',
      tagline: 'Simple heartfelt note',
      features: ['2 Memory Photos', 'Heartly Watermark', 'Standard loading speed', 'Basic themes only', 'Standard sharing link'],
      popular: false,
    },
    {
      name: 'Basic',
      price: '₹39',
      tagline: 'Sleek custom surprise',
      features: ['5 Memory Photos', 'Custom text editor options', 'Background music selection', '1 Premium theme', 'No Watermark', 'Custom slug link'],
      popular: false,
    },
    {
      name: 'Premium',
      price: '₹79',
      tagline: 'The ideal emotional gift',
      features: ['10 Memory Photos', 'Access to all themes', 'Custom passcode locks', 'Active countdown timer', 'Priority page load speeds', 'No Watermark', 'Lifetime Archival'],
      popular: true,
    },
    {
      name: 'Luxury',
      price: '₹149',
      tagline: 'For absolute perfection',
      features: ['20 Memory Photos', 'Custom Voice Note uploads', 'Midnight Unlock Schedule', 'Hidden interaction keys', 'Priority VIP Support', 'Custom meta tags', 'Lifetime Archival'],
      popular: false,
    },
  ];

  const faqs = [
    {
      q: 'How does the recipient open the surprise?',
      a: 'Once you build the surprise and complete the checkout, you will get a private URL (e.g., heartly.me/r/your-slug). You can send this link directly to them via WhatsApp, Instagram DM, or email. When they click it, the cinematic experience opens.'
    },
    {
      q: 'Can I select a custom background track?',
      a: 'Yes! On Basic, Premium, and Luxury plans, you can pick from our curated collection of beautiful background instrumentals (piano, ambient lo-fi, acoustic guitar, etc.). On the Luxury plan, you can also upload your own voice notes!'
    },
    {
      q: 'What is the "Midnight Unlock" feature?',
      a: 'Available in the Luxury plan, the Midnight Unlock lets you schedule the surprise to only open at exactly 12:00 AM on a specific date (like their birthday). If they open the link before that, they will see a beautiful custom countdown timer screen instead.'
    },
    {
      q: 'How long does a Heartly surprise link stay active?',
      a: 'Free plan surprises are kept active for 30 days. Paid plans (Basic, Premium, Luxury) are archived permanently, meaning they can revisit the link and relive the memory years down the line.'
    }
  ];

  return (
    <div className="space-y-16 text-left">
      <div className="text-center space-y-4 max-w-xl mx-auto">
        <h1 className="text-4xl font-heading font-extrabold text-white text-glow">Pricing Plans</h1>
        <p className="text-sm text-brand-muted">
          No subscription required. Pay once per surprise link and create a memory that lasts forever.
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
        {plans.map((plan, idx) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.05 }}
            className={`glass-card p-6 rounded-3xl flex flex-col justify-between border relative ${
              plan.popular ? 'border-brand-purple bg-brand-purple/5 shadow-[0_0_20px_rgba(168,85,247,0.1)]' : 'border-brand-border'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-brand-purple to-brand-pink text-[9px] font-bold tracking-widest uppercase rounded-full text-white shadow-md">
                Popular Choice
              </div>
            )}
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="font-heading font-bold text-lg text-white">{plan.name}</h3>
                <p className="text-[11px] text-brand-muted">{plan.tagline}</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-heading font-extrabold text-white">{plan.price}</span>
                {plan.price !== '₹0' && <span className="text-xs text-brand-muted">/ surprise</span>}
              </div>
              <hr className="border-brand-border" />
              <ul className="space-y-3">
                {plan.features.map((feature, fIdx) => (
                  <li key={fIdx} className="flex items-start gap-2 text-xs text-brand-muted">
                    <Check className="w-3.5 h-3.5 text-brand-purple shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="pt-8">
              <Link href="/dashboard/create">
                <CustomButton variant={plan.popular ? 'glow' : 'secondary'} className="w-full text-xs font-semibold py-2">
                  Create {plan.name}
                </CustomButton>
              </Link>
            </div>
          </motion.div>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="max-w-2xl mx-auto space-y-8 pt-12">
        <h2 className="text-2xl font-heading font-bold text-white text-center flex items-center justify-center gap-2">
          <HelpCircle className="w-5 h-5 text-brand-purple" />
          <span>Frequently Asked Questions</span>
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, fIdx) => (
            <div 
              key={fIdx}
              className="glass-panel rounded-2xl border border-brand-border/60 overflow-hidden cursor-pointer transition-all duration-300"
              onClick={() => setOpenFaq(openFaq === fIdx ? null : fIdx)}
            >
              <div className="p-4 flex items-center justify-between text-sm font-semibold text-white">
                <span>{faq.q}</span>
                <span className="text-brand-purple font-mono">{openFaq === fIdx ? '−' : '+'}</span>
              </div>
              {openFaq === fIdx && (
                <div className="p-4 pt-0 border-t border-brand-border/40 text-xs text-brand-muted leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
