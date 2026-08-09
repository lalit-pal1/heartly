import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface CustomButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'glass' | 'glow';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
}

export default function CustomButton({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  className = '',
  children,
  ...props
}: CustomButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand-purple/40 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';
  
  const variants = {
    primary: 'bg-gradient-to-r from-brand-purple to-brand-pink text-white hover:brightness-110 hover:shadow-lg hover:shadow-brand-purple/20',
    glow: 'bg-gradient-to-r from-brand-purple to-brand-pink text-white hover:brightness-110 shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)]',
    secondary: 'border border-brand-border bg-brand-dark/50 text-foreground hover:bg-brand-dark hover:border-brand-purple/40 hover:text-white',
    glass: 'glass-panel text-white hover:bg-white/10 hover:border-brand-pink/30 hover:shadow-lg hover:shadow-brand-pink/10',
  };

  const sizes = {
    sm: 'text-[10px] sm:text-xs px-2.5 sm:px-3 py-1.5 sm:py-2 gap-1 sm:gap-1.5',
    md: 'text-xs sm:text-sm px-3.5 sm:px-5 py-2 sm:py-3 gap-1.5 sm:gap-2',
    lg: 'text-sm sm:text-base px-5 sm:px-7 py-2.5 sm:py-4 gap-2 sm:gap-2.5 rounded-lg sm:rounded-xl',
  };

  return (
    <motion.button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 450, damping: 17 }}
      {...props}
    >
      {Icon && iconPosition === 'left' && <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />}
      <span>{children}</span>
      {Icon && iconPosition === 'right' && <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />}
    </motion.button>
  );
}
