import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiDollarSign, FiClock, FiCheckCircle } from 'react-icons/fi';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { GlassCard } from '@/components/ui/GlassCard';
import { creditService } from '@/services/creditService';
import { formatCurrency } from '@/lib/utils';
import type { CreditSummary, CreditTransaction } from '@/types';

export function CreditDashboardPage() {
  const { data: summary, isLoading: loadingSummary } = useQuery<CreditSummary>({
    queryKey: ['credit-summary'],
    queryFn: () => creditService.getSummary(),
  });

  const { data: transactions, isLoading: loadingTxns } = useQuery<CreditTransaction[]>({
    queryKey: ['credit-transactions'],
    queryFn: () => creditService.getTransactions(),
  });

  const isLoading = loadingSummary || loadingTxns;

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link to="/dashboard" className="text-sm text-brand-600 hover:text-brand-700 inline-flex items-center gap-1 mb-4">
          <FiArrowLeft size={14} /> Back to Dashboard
        </Link>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-6">Credit Account</h1>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600" />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            {summary && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <GlassCard>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FiDollarSign className="text-blue-600" size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Credit Limit</p>
                        <p className="text-xl font-bold text-gray-900">{formatCurrency(summary.credit_limit)}</p>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                  <GlassCard>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <FiCheckCircle className="text-green-600" size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Available</p>
                        <p className="text-xl font-bold text-green-700">{formatCurrency(summary.available)}</p>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <GlassCard>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <FiClock className="text-amber-600" size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Outstanding</p>
                        <p className="text-xl font-bold text-amber-700">{formatCurrency(summary.used)}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 capitalize">
                      {summary.tier} tier &middot; {summary.terms_days}-day terms
                    </p>
                  </GlassCard>
                </motion.div>
              </div>
            )}

            {/* Transaction History */}
            <h2 className="text-lg font-bold text-gray-900 mb-4">Transaction History</h2>
            {!transactions?.length ? (
              <p className="text-gray-400 text-sm">No credit transactions yet</p>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">Date</th>
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">Order</th>
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">Type</th>
                      <th className="text-right py-3 px-4 text-gray-500 font-medium">Amount</th>
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">Due Date</th>
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => {
                      const overdue = !t.settled_at && isOverdue(t.due_date);
                      return (
                        <tr key={t.id} className={`border-b border-gray-100 ${overdue ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                          <td className="py-3 px-4 text-gray-600">
                            {t.created_at ? new Date(t.created_at).toLocaleDateString('en-IN') : '-'}
                          </td>
                          <td className="py-3 px-4">
                            {t.order_number ? (
                              <Link to={`/orders/${t.order_id}`} className="text-brand-600 hover:underline font-medium">
                                {t.order_number}
                              </Link>
                            ) : '-'}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded capitalize ${
                              t.transaction_type === 'usage' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                            }`}>
                              {t.transaction_type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-gray-900">
                            {formatCurrency(t.amount)}
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {t.due_date ? new Date(t.due_date).toLocaleDateString('en-IN') : '-'}
                          </td>
                          <td className="py-3 px-4">
                            {t.settled_at ? (
                              <span className="text-xs font-bold px-2 py-0.5 rounded bg-green-100 text-green-700">
                                Settled
                              </span>
                            ) : overdue ? (
                              <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-100 text-red-700">
                                Overdue
                              </span>
                            ) : (
                              <span className="text-xs font-bold px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">
                                Pending
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </PageWrapper>
  );
}
