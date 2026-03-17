import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiShoppingCart, FiUser, FiPlus, FiLogOut, FiGrid } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { SearchBar } from '@/components/SearchBar';

export function Header() {
  const { user, logout, openLoginModal } = useAuth();
  const isDealer = user?.role === 'dealer' && user?.dealer_profile?.is_approved;
  const isAdmin = user?.role === 'admin';
  const canAddProduct = isAdmin || isDealer;

  return (
    <header className="sticky top-0 z-50">
      {isDealer && user?.dealer_profile && (
        <div className="bg-glow-600 text-white py-1 px-4 text-xs text-center font-semibold">
          {user.dealer_profile.company_name} | {user.dealer_profile.dealer_id} | {user.dealer_profile.tier} Tier
        </div>
      )}

      <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-glow-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
            <img src="/logo.svg" alt="Micro Machines" className="h-10 w-auto" />
          </Link>

          <div className="flex-1"><SearchBar /></div>

          <nav className="flex items-center gap-1">
            {canAddProduct && (
              <Link to="/products/add">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white text-brand-700 rounded-lg text-xs font-bold hover:bg-brand-50 transition-colors">
                  <FiPlus size={14} /> <span className="hidden md:inline">Add Product</span>
                </motion.div>
              </Link>
            )}
            {user ? (
              <>
                <Link to="/cart"><motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-2.5 rounded-lg hover:bg-white/10 transition-colors"><FiShoppingCart size={20} /></motion.div></Link>
                <Link to="/dashboard"><motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-2.5 rounded-lg hover:bg-white/10 transition-colors"><FiUser size={20} /></motion.div></Link>
                {isAdmin && <Link to="/admin"><motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-2.5 rounded-lg hover:bg-white/10 transition-colors"><FiGrid size={20} /></motion.div></Link>}
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={logout} className="p-2.5 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"><FiLogOut size={18} /></motion.button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/register"><motion.button whileHover={{ scale: 1.03 }} className="px-4 py-2 text-xs font-bold text-white/80 hover:text-white hidden sm:block">Register</motion.button></Link>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={openLoginModal}
                  className="px-5 py-2.5 bg-white text-brand-700 rounded-lg font-bold text-sm hover:bg-brand-50 transition-colors">
                  Login
                </motion.button>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
