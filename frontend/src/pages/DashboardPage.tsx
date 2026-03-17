import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiPackage, FiShoppingBag, FiDollarSign, FiPlus } from 'react-icons/fi';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/utils';
import api from '@/services/api';

interface DashboardStats {
  role: string;
  products_listed?: number;
  total_orders: number;
  total_revenue?: number;
  dealer_tier?: string;
  recent_orders: Array<{ id: number; order_number: string; total: number; status: string; created_at: string }>;
}

export function DashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => { const { data } = await api.get('/dashboard/stats'); return data; },
  });
  const isDealer = user?.role === 'dealer';

  if (isLoading) return <PageWrapper><div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" /></div></PageWrapper>;

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Welcome, {user?.full_name}</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {isDealer && (
            <GlassCard hover={false}><div className="flex items-center gap-3"><div className="p-3 bg-dealer-100 rounded-xl"><FiPackage className="text-dealer-600" size={24} /></div><div><p className="text-2xl font-bold">{stats?.products_listed ?? 0}</p><p className="text-sm text-gray-500">Products Listed</p></div></div></GlassCard>
          )}
          <GlassCard hover={false}><div className="flex items-center gap-3"><div className="p-3 bg-primary-100 rounded-xl"><FiShoppingBag className="text-primary-600" size={24} /></div><div><p className="text-2xl font-bold">{stats?.total_orders ?? 0}</p><p className="text-sm text-gray-500">Total Orders</p></div></div></GlassCard>
          {isDealer && (
            <GlassCard hover={false}><div className="flex items-center gap-3"><div className="p-3 bg-green-100 rounded-xl"><FiDollarSign className="text-green-600" size={24} /></div><div><p className="text-2xl font-bold">{formatCurrency(stats?.total_revenue ?? 0)}</p><p className="text-sm text-gray-500">Revenue</p></div></div></GlassCard>
          )}
        </div>
        {isDealer && <div className="mb-8"><Link to="/products/add"><GradientButton variant="dealer" className="flex items-center gap-2"><FiPlus /> Add New Product</GradientButton></Link></div>}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Recent Orders</h2>
          {stats?.recent_orders?.length ? (
            <div className="space-y-3">
              {stats.recent_orders.map((order) => (
                <motion.div key={order.id} whileHover={{ x: 4 }} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <Link to={`/orders/${order.id}`} className="flex-1"><p className="font-medium text-gray-900">{order.order_number}</p><p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString()}</p></Link>
                  <span className="text-sm capitalize px-2 py-1 rounded-full bg-gray-100 text-gray-600">{order.status}</span>
                  <span className="font-medium text-gray-900 ml-4">{formatCurrency(order.total)}</span>
                </motion.div>
              ))}
            </div>
          ) : <p className="text-gray-400 text-sm">No orders yet</p>}
        </div>
      </div>
    </PageWrapper>
  );
}
