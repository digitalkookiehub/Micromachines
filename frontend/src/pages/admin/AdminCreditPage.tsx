import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiCheck, FiFilter } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { GradientButton } from '@/components/ui/GradientButton';
import api from '@/services/api';
import { formatCurrency } from '@/lib/utils';

interface OutstandingEntry {
  id: number;
  dealer_id: string;
  company_name: string;
  order_id: number | null;
  order_number: string | null;
  amount: number;
  due_date: string | null;
  is_overdue: boolean;
  created_at: string | null;
}

export function AdminCreditPage() {
  const qc = useQueryClient();
  const [overdueOnly, setOverdueOnly] = useState(false);

  const { data: outstanding, isLoading } = useQuery<OutstandingEntry[]>({
    queryKey: ['admin-credit-outstanding', overdueOnly],
    queryFn: async () => {
      const { data } = await api.get('/admin/credit/outstanding', {
        params: { overdue_only: overdueOnly },
      });
      return data;
    },
  });

  const settle = useMutation({
    mutationFn: async (transactionId: number) => {
      await api.post(`/admin/credit/transactions/${transactionId}/settle`, {});
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-credit-outstanding'] });
      toast.success('Transaction settled!');
    },
    onError: () => toast.error('Failed to settle'),
  });

  const handleSettle = (entry: OutstandingEntry) => {
    if (window.confirm(`Settle ${formatCurrency(entry.amount)} for ${entry.company_name} (${entry.order_number})?`)) {
      settle.mutate(entry.id);
    }
  };

  const totalOutstanding = outstanding?.reduce((sum, e) => sum + e.amount, 0) ?? 0;
  const totalOverdue = outstanding?.filter((e) => e.is_overdue).reduce((sum, e) => sum + e.amount, 0) ?? 0;

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link to="/admin" className="text-sm text-brand-600 hover:text-brand-700 inline-flex items-center gap-1 mb-4">
          <FiArrowLeft size={14} /> Back to Admin
        </Link>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-6">Credit Management</h1>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Outstanding</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalOutstanding)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Overdue</p>
            <p className={`text-2xl font-bold ${totalOverdue > 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {formatCurrency(totalOverdue)}
            </p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setOverdueOnly(false)}
            className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
              !overdueOnly ? 'bg-brand-100 text-brand-700' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setOverdueOnly(true)}
            className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 ${
              overdueOnly ? 'bg-red-100 text-red-700' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <FiFilter size={12} /> Overdue Only
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600" />
          </div>
        ) : !outstanding?.length ? (
          <p className="text-gray-400 text-sm py-8 text-center">No outstanding credit transactions</p>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Dealer</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Order</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">Amount</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Due Date</th>
                  <th className="text-center py-3 px-4 text-gray-500 font-medium">Status</th>
                  <th className="text-center py-3 px-4 text-gray-500 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {outstanding.map((entry, i) => (
                  <motion.tr
                    key={entry.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className={`border-b border-gray-100 ${entry.is_overdue ? 'bg-red-50' : 'hover:bg-gray-50'}`}
                  >
                    <td className="py-3 px-4">
                      <p className="font-semibold text-gray-900">{entry.company_name}</p>
                      <p className="text-xs text-gray-400">{entry.dealer_id}</p>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-700">
                      {entry.order_number || '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900">
                      {formatCurrency(entry.amount)}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {entry.due_date ? new Date(entry.due_date).toLocaleDateString('en-IN') : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {entry.is_overdue ? (
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-100 text-red-700">Overdue</span>
                      ) : (
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">Pending</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <GradientButton
                        size="sm"
                        onClick={() => handleSettle(entry)}
                        disabled={settle.isPending}
                      >
                        <span className="flex items-center gap-1"><FiCheck size={12} /> Settle</span>
                      </GradientButton>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
