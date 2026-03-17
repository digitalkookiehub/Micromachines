import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FiUsers, FiUserCheck, FiUserPlus, FiPackage, FiShoppingBag, FiDollarSign } from 'react-icons/fi';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { GlassCard } from '@/components/ui/GlassCard';
import { formatCurrency } from '@/lib/utils';
import api from '@/services/api';

interface AdminStats {
  total_users: number;
  total_dealers: number;
  pending_dealers: number;
  total_products: number;
  total_orders: number;
  total_revenue: number;
}

const statCards = [
  { key: 'total_users' as const, label: 'Total Users', icon: FiUsers, color: 'bg-blue-100 text-blue-600' },
  { key: 'total_dealers' as const, label: 'Total Dealers', icon: FiUserCheck, color: 'bg-purple-100 text-purple-600' },
  { key: 'pending_dealers' as const, label: 'Pending Dealers', icon: FiUserPlus, color: 'bg-yellow-100 text-yellow-600', highlight: true },
  { key: 'total_products' as const, label: 'Total Products', icon: FiPackage, color: 'bg-green-100 text-green-600' },
  { key: 'total_orders' as const, label: 'Total Orders', icon: FiShoppingBag, color: 'bg-indigo-100 text-indigo-600' },
  { key: 'total_revenue' as const, label: 'Total Revenue', icon: FiDollarSign, color: 'bg-emerald-100 text-emerald-600', isCurrency: true },
];

export function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: async () => { const { data } = await api.get('/admin/stats'); return data; },
  });

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      </PageWrapper>
    );
  }

  const quickLinks = [
    { to: '/admin/users', label: 'Manage Users', icon: FiUsers },
    { to: '/admin/dealers', label: 'Dealer Applications', icon: FiUserCheck },
    { to: '/admin/orders', label: 'All Orders', icon: FiShoppingBag },
    { to: '/admin/products', label: 'All Products', icon: FiPackage },
  ];

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {statCards.map((card, i) => {
            const value = stats?.[card.key] ?? 0;
            const Icon = card.icon;
            const shouldHighlight = card.highlight && value > 0;
            return (
              <motion.div
                key={card.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <GlassCard className={shouldHighlight ? 'ring-2 ring-yellow-400' : ''}>
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${card.color}`}>
                      <Icon size={24} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {card.isCurrency ? formatCurrency(value) : value}
                      </p>
                      <p className="text-sm text-gray-500">{card.label}</p>
                    </div>
                  </div>
                  {shouldHighlight && (
                    <Link to="/admin/dealers" className="text-xs text-yellow-600 font-medium mt-2 inline-block hover:underline">
                      Review pending applications &rarr;
                    </Link>
                  )}
                </GlassCard>
              </motion.div>
            );
          })}
        </div>

        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {quickLinks.map((link) => (
            <Link key={link.to} to={link.to}>
              <motion.div
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="flex flex-col items-center gap-3 p-6 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
              >
                <link.icon className="text-primary-600" size={28} />
                <span className="text-sm font-medium text-gray-700 text-center">{link.label}</span>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </PageWrapper>
  );
}
