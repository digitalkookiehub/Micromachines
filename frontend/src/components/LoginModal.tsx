import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiLock, FiMail } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router-dom';

export function LoginModal() {
  const { isLoginModalOpen, closeLoginModal, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setIsSubmitting(true);
    try { await login(email, password); setEmail(''); setPassword(''); }
    catch { setError('Invalid email or password'); }
    finally { setIsSubmitting(false); }
  };

  return (
    <AnimatePresence>
      {isLoginModalOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={closeLoginModal}>
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-brand-600 to-glow-600 p-6 relative">
              <button onClick={closeLoginModal} className="absolute top-4 right-4 p-1 text-white/50 hover:text-white rounded-full hover:bg-white/10"><FiX size={18} /></button>
              <h2 className="text-xl font-black text-white">Sign In</h2>
              <p className="text-white/60 text-xs mt-0.5">Welcome to Micro Machines</p>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"
                    required className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-50 text-gray-900 placeholder-gray-400 outline-none text-sm" />
                </div>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password"
                    required className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-50 text-gray-900 placeholder-gray-400 outline-none text-sm" />
                </div>
                {error && <p className="text-red-600 text-xs bg-red-50 px-3 py-2 rounded-lg border border-red-100">{error}</p>}
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} type="submit" disabled={isSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-brand-500 to-glow-500 text-white rounded-xl font-bold text-sm shadow-md shadow-brand-200 disabled:opacity-50 hover:shadow-lg hover:shadow-brand-300 transition-all">
                  {isSubmitting ? 'Signing in...' : 'Sign In'}
                </motion.button>
              </form>
              <div className="mt-4 flex justify-between text-xs">
                <Link to="/forgot-password" onClick={closeLoginModal} className="text-gray-500 hover:text-brand-600">Forgot password?</Link>
                <Link to="/register" onClick={closeLoginModal} className="font-bold text-brand-600 hover:text-glow-600">Create account</Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
