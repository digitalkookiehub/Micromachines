import { motion } from 'framer-motion';
import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'dealer' | 'danger' | 'outline' | 'success' | 'gold';
  size?: 'sm' | 'md' | 'lg';
}

const variantStyles = {
  primary: 'bg-gradient-to-r from-accent-600 to-primary-600 text-white shadow-lg shadow-accent-200 hover:shadow-accent-300',
  dealer: 'bg-gradient-to-r from-accent-500 to-primary-500 text-white shadow-lg shadow-accent-200',
  danger: 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-200',
  success: 'bg-gradient-to-r from-green-500 to-green-700 text-white shadow-lg shadow-green-200',
  gold: 'bg-gradient-to-r from-gold-400 to-gold-500 text-gray-900 shadow-lg shadow-gold-200 hover:from-gold-300 hover:to-gold-400',
  outline: 'bg-white border-2 border-accent-200 text-accent-600 hover:bg-accent-50 shadow-sm',
};

const sizeStyles = { sm: 'px-4 py-2 text-xs', md: 'px-6 py-2.5 text-sm', lg: 'px-8 py-3 text-sm' };

export function GradientButton({ children, variant = 'primary', size = 'md', className, ...props }: GradientButtonProps) {
  return (
    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
      className={cn('rounded-xl font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed', variantStyles[variant], sizeStyles[size], className)} {...props}>
      {children}
    </motion.button>
  );
}
