import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiFileText, FiCheckCircle, FiTruck, FiPackage, FiClock } from 'react-icons/fi';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { useOrder } from '@/hooks/useOrders';
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
  credit_pending: 'bg-amber-100 text-amber-800',
};

const steps: { key: OrderStatus; label: string; icon: typeof FiClock }[] = [
  { key: 'pending', label: 'Placed', icon: FiClock },
  { key: 'confirmed', label: 'Confirmed', icon: FiCheckCircle },
  { key: 'processing', label: 'Processing', icon: FiPackage },
  { key: 'shipped', label: 'Shipped', icon: FiTruck },
  { key: 'delivered', label: 'Delivered', icon: FiCheckCircle },
];

const stepOrder: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading } = useOrder(Number(id) || 0);

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      </PageWrapper>
    );
  }

  if (!order) {
    return (
      <PageWrapper>
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Order not found</h1>
          <Link to="/orders" className="text-primary-600 mt-4 inline-block">Back to Orders</Link>
        </div>
      </PageWrapper>
    );
  }

  const currentStepIndex = order.status === 'cancelled' ? -1 : stepOrder.indexOf(order.status);

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link to="/orders" className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center gap-1 mb-4">
          <FiArrowLeft size={14} /> Back to Orders
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{order.order_number}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status]}`}>
              {order.status}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${paymentColors[order.payment_status]}`}>
              {order.payment_status}
            </span>
          </div>
        </div>

        {order.status !== 'cancelled' && (
          <GlassCard className="mb-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4">Order Progress</h2>
            <div className="flex items-center justify-between">
              {steps.map((step, i) => {
                const isCompleted = i <= currentStepIndex;
                const isCurrent = i === currentStepIndex;
                const Icon = step.icon;
                return (
                  <div key={step.key} className="flex flex-col items-center flex-1">
                    <div className="flex items-center w-full">
                      {i > 0 && (
                        <div className={`flex-1 h-1 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                      )}
                      <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: isCurrent ? 1.15 : 1 }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
                        }`}
                      >
                        <Icon size={18} />
                      </motion.div>
                      {i < steps.length - 1 && (
                        <div className={`flex-1 h-1 ${i < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'}`} />
                      )}
                    </div>
                    <span className={`text-xs mt-2 ${isCompleted ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        )}

        <GlassCard className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4">Order Items</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 text-gray-500 font-medium">Product</th>
                  <th className="text-center py-3 text-gray-500 font-medium">HSN</th>
                  <th className="text-center py-3 text-gray-500 font-medium">Qty</th>
                  <th className="text-right py-3 text-gray-500 font-medium">Unit Price</th>
                  <th className="text-right py-3 text-gray-500 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="py-3 font-medium text-gray-900">{item.product_name}</td>
                    <td className="py-3 text-center text-gray-500">{item.hsn_code}</td>
                    <td className="py-3 text-center">{item.quantity}</td>
                    <td className="py-3 text-right">{formatCurrency(item.unit_price)}</td>
                    <td className="py-3 text-right font-medium">{formatCurrency(item.total_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Summary</h2>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between gap-16">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between gap-16">
                  <span className="text-gray-500">Tax (GST)</span>
                  <span>{formatCurrency(order.tax_amount)}</span>
                </div>
                <div className="flex justify-between gap-16 pt-2 border-t border-gray-200 text-base font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>
            <div>
              <Link to="/invoices">
                <GradientButton variant="outline" size="sm">
                  <span className="flex items-center gap-1"><FiFileText size={14} /> View Invoices</span>
                </GradientButton>
              </Link>
            </div>
          </div>
        </GlassCard>
      </div>
    </PageWrapper>
  );
}
