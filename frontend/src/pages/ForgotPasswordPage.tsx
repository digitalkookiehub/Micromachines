import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { MeshBackground } from '@/components/layout/MeshBackground';
import { GlassCard } from '@/components/ui/GlassCard';
import { AnimatedInput } from '@/components/ui/AnimatedInput';
import { GradientButton } from '@/components/ui/GradientButton';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) setSubmitted(true);
  };

  return (
    <PageWrapper>
      <MeshBackground />
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <GlassCard className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiMail className="text-primary-600" size={28} />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
                  <p className="text-gray-500 mt-2 text-sm">Enter your email and we'll send you a reset link</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <AnimatedInput
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                  <GradientButton type="submit" className="w-full">
                    Send Reset Link
                  </GradientButton>
                </form>
                <div className="mt-4 text-center">
                  <Link to="/" className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center gap-1">
                    <FiArrowLeft size={14} /> Back to Home
                  </Link>
                </div>
              </motion.div>
            ) : (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiCheckCircle className="text-green-600" size={28} />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Check Your Email</h2>
                <p className="text-gray-500 text-sm">
                  If an account with that email exists, a reset link has been sent.
                </p>
                <div className="mt-6">
                  <Link to="/">
                    <GradientButton variant="outline">Back to Home</GradientButton>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      </div>
    </PageWrapper>
  );
}
