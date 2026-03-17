import { motion } from 'framer-motion';
import { type InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const AnimatedInput = forwardRef<HTMLInputElement, AnimatedInputProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      )}
      <motion.input
        ref={ref}
        whileFocus={{ scale: 1.01 }}
        className={cn(
          'w-full px-4 py-3 rounded-xl border-2 transition-colors outline-none',
          error ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-primary-500',
          className
        )}
        {...props}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  )
);

AnimatedInput.displayName = 'AnimatedInput';
