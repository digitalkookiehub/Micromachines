import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiPackage, FiChevronRight } from 'react-icons/fi';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { GradientButton } from '@/components/ui/GradientButton';
import { useOrders } from '@/hooks/useOrders';
import { formatCurrency } from '@/lib/utils';
import type { OrderStatus, PaymentStatus } from '@/types';

const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const paymentColors: Record<PaymentStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
};

export function OrdersPage() {
  const [page, setPage] = useState(1);
  const { data: orders, isLoading } = useOrders(page);

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      </PageWrapper>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <PageWrapper>
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <FiPackage className="mx-auto text-gray-300 mb-4" size={64} />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No orders yet</h1>
          <p className="text-gray-500 mb-6">Start shopping to see your orders here</p>
          <Link to="/"><GradientButton>Browse Products</GradientButton></Link>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>
        <div className="space-y-4">
          {orders.map((order, i) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link to={`/orders/${order.id}`}>
                <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-gray-900">{order.order_number}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                          {order.status}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${paymentColors[order.payment_status]}`}>
                          {order.payment_status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {' \u00B7 '}
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-gray-900">{formatCurrency(order.total)}</span>
                      <FiChevronRight className="text-gray-400" size={20} />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-center gap-2 mt-8">
          {page > 1 && (
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setPage(page - 1)}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 text-sm">
              Previous
            </motion.button>
          )}
          {orders.length >= 20 && (
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setPage(page + 1)}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 text-sm">
              Next
            </motion.button>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
