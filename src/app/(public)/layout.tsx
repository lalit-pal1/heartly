'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, Menu, X, ArrowRight } from 'lucide-react';
import CustomButton from '@/components/ui/CustomButton';
import Particles from '@/components/ui/Particles';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Templates', href: '/templates' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'About Us', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <div className="relative min-h-screen flex flex-col bg-brand-black text-foreground overflow-hidden">
      {/* Dynamic Background glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] glow-purple opacity-40 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] glow-pink opacity-30 pointer-events-none" />
      
      {/* High-perf Canvas Particles */}
      <Particles />

      {/* Glassmorphic Navbar */}
      <header className={`sticky top-0 z-50 w-full transition-all duration-500 ${
        scrolled 
          ? 'border-b border-white/5 bg-brand-black/75 backdrop-blur-md shadow-lg shadow-black/20' 
          : 'border-b border-transparent bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-heading font-bold text-xl tracking-tight text-white cursor-pointer group">
            <Heart className="w-6 h-6 text-brand-pink fill-brand-pink/20 group-hover:scale-110 transition-transform duration-300" />
            <span>Heartly</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors cursor-pointer py-1 relative group ${
                  isActive(link.href) ? 'text-white' : 'text-brand-muted hover:text-white'
                }`}
              >
                <span>{link.label}</span>
                <span className={`absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-brand-purple to-brand-pink transition-all duration-300 ${
                  isActive(link.href) ? 'w-full' : 'w-0 group-hover:w-full'
                }`} />
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-brand-muted hover:text-white cursor-pointer">
              Sign In
            </Link>
            <Link href="/dashboard" className="cursor-pointer">
              <CustomButton variant="glow" size="sm" icon={ArrowRight} iconPosition="right">
                Dashboard
              </CustomButton>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-brand-muted hover:text-white cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-brand-border bg-brand-dark/95 backdrop-blur-md px-4 pt-2 pb-6 flex flex-col gap-4 animate-fade-in">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`text-base font-medium py-2 ${
                  isActive(link.href) ? 'text-brand-purple' : 'text-brand-muted hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <hr className="border-brand-border my-2" />
            <div className="flex flex-col gap-3">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="text-center text-sm font-medium text-brand-muted hover:text-white py-2">
                Sign In
              </Link>
              <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                <CustomButton variant="glow" size="md" className="w-full">
                  Dashboard
                </CustomButton>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        {children}
      </main>

      {/* Premium Dark Footer */}
      <footer className="border-t border-brand-border bg-brand-black/90 relative z-10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex flex-col gap-4 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 font-heading font-bold text-xl text-white">
              <Heart className="w-6 h-6 text-brand-pink fill-brand-pink/20" />
              <span>Heartly</span>
            </Link>
            <p className="text-sm text-brand-muted max-w-sm">
              Make your loved ones smile in the most unforgettable way. Premium personalized surprise stories crafted with love, music, and cinematic reveals.
            </p>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-white text-sm tracking-wider uppercase mb-4">Product</h4>
            <ul className="flex flex-col gap-2.5 text-sm">
              <li><Link href="/templates" className="text-brand-muted hover:text-white transition-colors">Templates</Link></li>
              <li><Link href="/pricing" className="text-brand-muted hover:text-white transition-colors">Pricing Plans</Link></li>
              <li><Link href="/dashboard/create" className="text-brand-purple hover:text-brand-pink transition-colors font-medium">Create Surprise</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-white text-sm tracking-wider uppercase mb-4">Company</h4>
            <ul className="flex flex-col gap-2.5 text-sm">
              <li><Link href="/about" className="text-brand-muted hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="text-brand-muted hover:text-white transition-colors">Contact Support</Link></li>
              <li><Link href="#" className="text-brand-muted hover:text-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-brand-border/60 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-brand-muted">
            &copy; {new Date().getFullYear()} Heartly. All rights reserved. Made with love on Heartly ❤️
          </p>
          <p className="text-xs text-brand-muted">
            Designed for unforgettable emotional moments.
          </p>
        </div>
      </footer>
    </div>
  );
}
