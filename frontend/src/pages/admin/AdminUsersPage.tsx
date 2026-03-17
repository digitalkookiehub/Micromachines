import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { PageWrapper } from '@/components/layout/PageWrapper';
import api from '@/services/api';
import type { User, UserRole } from '@/types';

const roleBadge: Record<UserRole, string> = {
  customer: 'bg-blue-100 text-blue-800',
  dealer: 'bg-purple-100 text-purple-800',
  admin: 'bg-red-100 text-red-800',
};

const roles: Array<{ label: string; value: string }> = [
  { label: 'All', value: '' },
  { label: 'Customer', value: 'customer' },
  { label: 'Dealer', value: 'dealer' },
  { label: 'Admin', value: 'admin' },
];

export function AdminUsersPage() {
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['admin-users', roleFilter, page],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, per_page: 20 };
      if (roleFilter) params.role = roleFilter;
      const { data } = await api.get('/admin/users', { params });
      return data;
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: number; isActive: boolean }) => {
      await api.put(`/admin/users/${userId}`, null, { params: { is_active: isActive } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User updated');
    },
    onError: () => toast.error('Failed to update user'),
  });

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link to="/admin" className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center gap-1 mb-4">
          <FiArrowLeft size={14} /> Back to Admin
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage Users</h1>

        <div className="flex gap-2 mb-6">
          {roles.map((r) => (
            <motion.button
              key={r.value}
              whileTap={{ scale: 0.95 }}
              onClick={() => { setRoleFilter(r.value); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                roleFilter === r.value ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {r.label}
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
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Email</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Name</th>
                  <th className="text-center py-3 px-4 text-gray-500 font-medium">Role</th>
                  <th className="text-center py-3 px-4 text-gray-500 font-medium">Active</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users?.map((u, i) => (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 text-gray-900">{u.email}</td>
                    <td className="py-3 px-4 text-gray-600">{u.full_name}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${roleBadge[u.role]}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => toggleActive.mutate({ userId: u.id, isActive: !u.is_active })}
                        className={u.is_active ? 'text-green-600' : 'text-gray-400'}
                      >
                        {u.is_active ? <FiToggleRight size={22} /> : <FiToggleLeft size={22} />}
                      </motion.button>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">
                      {u.is_verified ? 'Verified' : 'Unverified'}
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
          {(users?.length ?? 0) >= 20 && (
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setPage(page + 1)}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 text-sm">Next</motion.button>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
