import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FiArrowLeft } from 'react-icons/fi';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { formatCurrency } from '@/lib/utils';
import api from '@/services/api';

interface AdminOrder {
  id: number;
  order_number: string;
  user_email: string | null;
  status: string;
  total: number;
  payment_status: string;
  created_at: string | null;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const paymentColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
};

const statusFilters = ['', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export function AdminOrdersPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data: orders, isLoading } = useQuery<AdminOrder[]>({
    queryKey: ['admin-orders', statusFilter, page],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, per_page: 20 };
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get('/admin/orders', { params });
      return data;
    },
  });

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link to="/admin" className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center gap-1 mb-4">
          <FiArrowLeft size={14} /> Back to Admin
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">All Orders</h1>

        <div className="flex gap-2 mb-6 flex-wrap">
          {statusFilters.map((s) => (
            <motion.button
              key={s}
              whileTap={{ scale: 0.95 }}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                statusFilter === s ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s || 'All'}
            </motion.button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Order #</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Customer</th>
                  <th className="text-center py-3 px-4 text-gray-500 font-medium">Status</th>
                  <th className="text-center py-3 px-4 text-gray-500 font-medium">Payment</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">Total</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders?.map((order, i) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="py-3 px-4">
                      <Link to={`/orders/${order.id}`} className="font-medium text-primary-600 hover:text-primary-700">
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{order.user_email || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${paymentColors[order.payment_status] || 'bg-gray-100 text-gray-600'}`}>
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium">{formatCurrency(order.total)}</td>
                    <td className="py-3 px-4 text-gray-500 text-xs">
                      {order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN') : '-'}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-center gap-2 mt-6">
          {page > 1 && (
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setPage(page - 1)}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 text-sm">Previous</motion.button>
          )}
          {(orders?.length ?? 0) >= 20 && (
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setPage(page + 1)}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 text-sm">Next</motion.button>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
