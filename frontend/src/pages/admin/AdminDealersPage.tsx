import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiCheck, FiX, FiPercent, FiDollarSign } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { formatCurrency } from '@/lib/utils';
import api from '@/services/api';

interface DealerEntry {
  id: number;
  user_id: number;
  company_name: string;
  dealer_id: string;
  gst_number: string | null;
  is_approved: boolean;
  special_discount: number;
  credit_limit: number;
  tier: string;
  user_email: string | null;
  user_name: string | null;
}

export function AdminDealersPage() {
  const qc = useQueryClient();
  const [editingDiscount, setEditingDiscount] = useState<{ id: number; value: string } | null>(null);
  const [editingCredit, setEditingCredit] = useState<{ id: number; value: string } | null>(null);

  const { data: pendingDealers, isLoading: loadingPending } = useQuery<DealerEntry[]>({
    queryKey: ['admin-dealers', 'pending'],
    queryFn: async () => { const { data } = await api.get('/admin/dealers', { params: { approved: false } }); return data; },
  });

  const { data: approvedDealers, isLoading: loadingApproved } = useQuery<DealerEntry[]>({
    queryKey: ['admin-dealers', 'approved'],
    queryFn: async () => { const { data } = await api.get('/admin/dealers', { params: { approved: true } }); return data; },
  });

  const approve = useMutation({
    mutationFn: async (dealerId: number) => { await api.post(`/admin/dealers/${dealerId}/approve`); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-dealers'] }); toast.success('Dealer approved!'); },
    onError: () => toast.error('Failed to approve'),
  });

  const reject = useMutation({
    mutationFn: async (dealerId: number) => { await api.post(`/admin/dealers/${dealerId}/reject`); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-dealers'] }); toast.success('Dealer rejected'); },
    onError: () => toast.error('Failed to reject'),
  });

  const updateDiscount = useMutation({
    mutationFn: async ({ dealerId, discount }: { dealerId: number; discount: number }) => {
      await api.put(`/admin/dealers/${dealerId}/discount`, null, { params: { discount } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-dealers'] });
      toast.success('Special discount updated!');
      setEditingDiscount(null);
    },
    onError: () => toast.error('Failed to update discount'),
  });

  const handleReject = (dealer: DealerEntry) => {
    if (window.confirm(`Reject dealer application for ${dealer.company_name}?`)) {
      reject.mutate(dealer.id);
    }
  };

  const updateCreditLimit = useMutation({
    mutationFn: async ({ dealerId, creditLimit }: { dealerId: number; creditLimit: number }) => {
      const { data } = await api.put(`/admin/dealers/${dealerId}/credit-limit`, null, { params: { credit_limit: creditLimit } });
      return data;
    },
    onSuccess: (_data, variables) => {
      // Optimistically update the cached dealer lists
      const updateCache = (old: DealerEntry[] | undefined) =>
        old?.map((d) => d.id === variables.dealerId ? { ...d, credit_limit: variables.creditLimit } : d);
      qc.setQueryData<DealerEntry[]>(['admin-dealers', 'approved'], updateCache);
      qc.setQueryData<DealerEntry[]>(['admin-dealers', 'pending'], updateCache);
      qc.invalidateQueries({ queryKey: ['admin-dealers'] });
      toast.success('Credit limit updated!');
      setEditingCredit(null);
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to update credit limit';
      toast.error(message);
    },
  });

  const saveDiscount = () => {
    if (!editingDiscount) return;
    const val = parseFloat(editingDiscount.value);
    if (isNaN(val) || val < 0 || val > 50) {
      toast.error('Discount must be between 0% and 50%');
      return;
    }
    updateDiscount.mutate({ dealerId: editingDiscount.id, discount: val });
  };

  const saveCreditLimit = () => {
    if (!editingCredit) return;
    const val = parseFloat(editingCredit.value);
    if (isNaN(val) || val < 0) {
      toast.error('Credit limit cannot be negative');
      return;
    }
    updateCreditLimit.mutate({ dealerId: editingCredit.id, creditLimit: val });
  };

  const isLoading = loadingPending || loadingApproved;

  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link to="/admin" className="text-sm text-brand-600 hover:text-brand-700 inline-flex items-center gap-1 mb-4">
          <FiArrowLeft size={14} /> Back to Admin
        </Link>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-6">Dealer Management</h1>

        {isLoading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600" /></div>
        ) : (
          <>
            {/* Pending Applications */}
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Pending Applications ({pendingDealers?.length ?? 0})
            </h2>
            {!pendingDealers?.length ? (
              <p className="text-gray-400 text-sm mb-8">No pending applications</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {pendingDealers.map((dealer, i) => (
                  <motion.div key={dealer.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <GlassCard>
                      <div className="mb-3">
                        <h3 className="font-bold text-gray-900">{dealer.company_name}</h3>
                        <p className="text-sm text-gray-500">{dealer.dealer_id}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                        <div><span className="text-gray-500">Contact</span><p className="text-gray-900">{dealer.user_name}</p></div>
                        <div><span className="text-gray-500">Email</span><p className="text-gray-900">{dealer.user_email}</p></div>
                        <div className="col-span-2"><span className="text-gray-500">GST Number</span><p className="text-gray-900">{dealer.gst_number || 'Not provided'}</p></div>
                      </div>
                      <div className="flex gap-2">
                        <GradientButton size="sm" onClick={() => approve.mutate(dealer.id)}>
                          <span className="flex items-center gap-1"><FiCheck size={14} /> Approve</span>
                        </GradientButton>
                        <GradientButton variant="danger" size="sm" onClick={() => handleReject(dealer)}>
                          <span className="flex items-center gap-1"><FiX size={14} /> Reject</span>
                        </GradientButton>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Approved Dealers */}
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Approved Dealers ({approvedDealers?.length ?? 0})
            </h2>
            {!approvedDealers?.length ? (
              <p className="text-gray-400 text-sm">No approved dealers yet</p>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">Dealer ID</th>
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">Company</th>
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">Contact</th>
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">GST</th>
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">Tier</th>
                      <th className="text-center py-3 px-4 text-gray-500 font-medium">Special Discount</th>
                      <th className="text-center py-3 px-4 text-gray-500 font-medium">Credit Limit</th>
                      <th className="text-center py-3 px-4 text-gray-500 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvedDealers.map((d) => {
                      const creditLimit = d.credit_limit ?? 0;
                      const specialDiscount = d.special_discount ?? 0;
                      const isEditingDisc = editingDiscount?.id === d.id;
                      const isEditingCred = editingCredit?.id === d.id;
                      const rowHighlight = isEditingDisc || isEditingCred;
                      return (
                        <tr key={d.id} className={`border-b border-gray-100 ${rowHighlight ? 'bg-brand-50' : 'hover:bg-gray-50'}`}>
                          <td className="py-3 px-4 font-semibold text-gray-900">{d.dealer_id}</td>
                          <td className="py-3 px-4 text-gray-700">{d.company_name}</td>
                          <td className="py-3 px-4 text-gray-600 text-xs">{d.user_email}</td>
                          <td className="py-3 px-4 text-gray-500 text-xs">{d.gst_number || '-'}</td>
                          <td className="py-3 px-4">
                            <span className="text-xs font-bold text-glow-700 bg-glow-100 px-2 py-0.5 rounded capitalize">{d.tier}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isEditingDisc ? (
                              <div className="flex items-center justify-center gap-1">
                                <input
                                  type="number"
                                  value={editingDiscount.value}
                                  onChange={(e) => setEditingDiscount({ ...editingDiscount, value: e.target.value })}
                                  min="0" max="50" step="0.5"
                                  className="w-16 px-2 py-1 border border-brand-300 rounded-lg text-center text-sm focus:ring-2 focus:ring-brand-100 outline-none"
                                  autoFocus
                                />
                                <span className="text-xs text-gray-500">%</span>
                              </div>
                            ) : (
                              <span className={`text-sm font-bold ${specialDiscount > 0 ? 'text-green-700' : 'text-gray-400'}`}>
                                {specialDiscount > 0 ? `${specialDiscount}%` : '—'}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isEditingCred ? (
                              <div className="flex items-center justify-center gap-1">
                                <input
                                  type="number"
                                  value={editingCredit.value}
                                  onChange={(e) => setEditingCredit({ ...editingCredit, value: e.target.value })}
                                  min="0" step="1000"
                                  className="w-24 px-2 py-1 border border-brand-300 rounded-lg text-center text-sm focus:ring-2 focus:ring-brand-100 outline-none"
                                  autoFocus
                                />
                              </div>
                            ) : (
                              <span className={`text-sm font-bold ${creditLimit > 0 ? 'text-blue-700' : 'text-gray-400'}`}>
                                {creditLimit > 0 ? formatCurrency(creditLimit) : '—'}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isEditingDisc ? (
                              <div className="flex items-center justify-center gap-1">
                                <button type="button" onClick={saveDiscount}
                                  className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors" title="Save">
                                  <FiCheck size={14} />
                                </button>
                                <button type="button" onClick={() => setEditingDiscount(null)}
                                  className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors" title="Cancel">
                                  <FiX size={14} />
                                </button>
                              </div>
                            ) : isEditingCred ? (
                              <div className="flex items-center justify-center gap-1">
                                <button type="button" onClick={saveCreditLimit}
                                  className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors" title="Save">
                                  <FiCheck size={14} />
                                </button>
                                <button type="button" onClick={() => setEditingCredit(null)}
                                  className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors" title="Cancel">
                                  <FiX size={14} />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCredit(null);
                                    setEditingDiscount({ id: d.id, value: String(specialDiscount) });
                                  }}
                                  className="p-1.5 bg-brand-50 text-brand-600 rounded-lg hover:bg-brand-100 transition-colors"
                                  title="Set special discount"
                                >
                                  <FiPercent size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingDiscount(null);
                                    setEditingCredit({ id: d.id, value: String(creditLimit) });
                                  }}
                                  className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                  title="Set credit limit"
                                >
                                  <FiDollarSign size={14} />
                                </button>
                              </div>
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
