import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiToggleLeft, FiToggleRight, FiAlertTriangle, FiSearch, FiEdit2, FiCheck, FiX, FiSave } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { formatCurrency } from '@/lib/utils';
import api from '@/services/api';

interface AdminProduct {
  id: number;
  name: string;
  slug: string;
  brand: string;
  category: string;
  customer_price: number;
  dealer_price: number;
  stock_quantity: number;
  is_active: boolean;
}

interface PaginatedProducts {
  items: AdminProduct[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

interface EditingRow {
  id: number;
  customer_price: string;
  dealer_price: string;
  discount_pct: string;
  stock_quantity: string;
}

export function AdminProductsPage() {
  const [activeFilter, setActiveFilter] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<EditingRow | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<PaginatedProducts>({
    queryKey: ['admin-products', activeFilter, search, page],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, per_page: 20 };
      if (activeFilter) params.active = activeFilter;
      if (search) params.search = search;
      const { data } = await api.get('/admin/products', { params });
      return data;
    },
  });

  const products = data?.items || [];

  const updateProduct = useMutation({
    mutationFn: async (params: { productId: number; customer_price?: number; dealer_price?: number; stock_quantity?: number; is_active?: boolean }) => {
      const { productId, ...rest } = params;
      await api.put(`/admin/products/${productId}`, null, { params: rest });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product updated');
      setEditing(null);
    },
    onError: () => toast.error('Failed to update'),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const startEdit = (p: AdminProduct) => {
    const disc = p.customer_price > 0 ? Math.round(((p.customer_price - p.dealer_price) / p.customer_price) * 100) : 0;
    setEditing({
      id: p.id,
      customer_price: p.customer_price.toString(),
      dealer_price: p.dealer_price.toString(),
      discount_pct: disc.toString(),
      stock_quantity: p.stock_quantity.toString(),
    });
  };

  const onMrpChange = (val: string) => {
    if (!editing) return;
    const mrp = parseFloat(val);
    const disc = parseFloat(editing.discount_pct);
    const dp = !isNaN(mrp) && !isNaN(disc) ? Math.round(mrp * (1 - disc / 100)) : editing.dealer_price;
    setEditing({ ...editing, customer_price: val, dealer_price: dp.toString() });
  };

  const onDealerPriceChange = (val: string) => {
    if (!editing) return;
    const mrp = parseFloat(editing.customer_price);
    const dp = parseFloat(val);
    const disc = !isNaN(mrp) && !isNaN(dp) && mrp > 0 ? Math.round(((mrp - dp) / mrp) * 100) : editing.discount_pct;
    setEditing({ ...editing, dealer_price: val, discount_pct: disc.toString() });
  };

  const onDiscountChange = (val: string) => {
    if (!editing) return;
    const mrp = parseFloat(editing.customer_price);
    const disc = parseFloat(val);
    const dp = !isNaN(mrp) && !isNaN(disc) ? Math.round(mrp * (1 - disc / 100)) : editing.dealer_price;
    setEditing({ ...editing, discount_pct: val, dealer_price: dp.toString() });
  };

  const saveEdit = () => {
    if (!editing) return;
    const cp = parseFloat(editing.customer_price);
    const dp = parseFloat(editing.dealer_price);
    const sq = parseInt(editing.stock_quantity);
    if (isNaN(cp) || isNaN(dp) || isNaN(sq) || cp <= 0 || dp <= 0) {
      toast.error('Invalid values');
      return;
    }
    if (dp >= cp) {
      toast.error('Dealer price must be less than MRP');
      return;
    }
    updateProduct.mutate({ productId: editing.id, customer_price: cp, dealer_price: dp, stock_quantity: sq });
  };

  const discount = (mrp: number, dealer: number) => {
    if (mrp <= 0) return 0;
    return Math.round(((mrp - dealer) / mrp) * 100);
  };

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Link to="/admin" className="text-sm text-accent-600 hover:text-accent-700 inline-flex items-center gap-1 mb-4">
          <FiArrowLeft size={14} /> Back to Admin
        </Link>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900">All Products</h1>
          <span className="text-sm text-gray-500">{data?.total ?? 0} products</span>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex gap-2">
            <div className="relative flex-1 max-w-md">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name, brand, or SKU..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-accent-400 focus:ring-2 focus:ring-accent-100 outline-none text-sm"
              />
            </div>
            <motion.button whileTap={{ scale: 0.95 }} type="submit"
              className="px-5 py-2.5 bg-accent-600 text-white rounded-xl text-sm font-semibold hover:bg-accent-700">
              Search
            </motion.button>
            {search && (
              <motion.button whileTap={{ scale: 0.95 }} type="button"
                onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}
                className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200">
                Clear
              </motion.button>
            )}
          </div>
        </form>

        {/* Filters */}
        <div className="flex gap-2 mb-5">
          {[{ label: 'All', value: '' }, { label: 'Active', value: 'true' }, { label: 'Inactive', value: 'false' }].map((f) => (
            <motion.button key={f.value} whileTap={{ scale: 0.95 }}
              onClick={() => { setActiveFilter(f.value); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeFilter === f.value ? 'bg-accent-600 text-white shadow-md shadow-accent-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {f.label}
            </motion.button>
          ))}
        </div>

        {search && (
          <p className="text-sm text-gray-500 mb-4">
            Showing results for "<span className="font-semibold text-gray-700">{search}</span>"
          </p>
        )}

        {/* Products Table */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent-600" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-500">No products found</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Product</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Brand</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Category</th>
                    <th className="text-right py-3 px-4 text-gray-500 font-medium">MRP</th>
                    <th className="text-right py-3 px-4 text-gray-500 font-medium">Dealer Price</th>
                    <th className="text-center py-3 px-4 text-gray-500 font-medium">Discount</th>
                    <th className="text-center py-3 px-4 text-gray-500 font-medium">Stock</th>
                    <th className="text-center py-3 px-4 text-gray-500 font-medium">Active</th>
                    <th className="text-center py-3 px-4 text-gray-500 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const isEditing = editing?.id === p.id;
                    const disc = discount(p.customer_price, p.dealer_price);

                    return (
                      <tr key={p.id} className={`border-b border-gray-100 ${isEditing ? 'bg-gold-50' : 'hover:bg-gray-50'}`}>
                        <td className="py-3 px-4">
                          <Link to={`/products/${p.slug}`} className="font-medium text-accent-600 hover:text-accent-700 hover:underline">
                            {p.name}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{p.brand}</td>
                        <td className="py-3 px-4 text-gray-500 capitalize">{p.category}</td>

                        {/* MRP */}
                        <td className="py-3 px-4 text-right">
                          {isEditing ? (
                            <input type="number" value={editing.customer_price}
                              onChange={(e) => onMrpChange(e.target.value)}
                              className="w-24 px-2 py-1 border border-accent-300 rounded-lg text-right text-sm focus:ring-2 focus:ring-accent-100 outline-none" />
                          ) : (
                            <span className="font-medium">{formatCurrency(p.customer_price)}</span>
                          )}
                        </td>

                        {/* Dealer Price */}
                        <td className="py-3 px-4 text-right">
                          {isEditing ? (
                            <input type="number" value={editing.dealer_price}
                              onChange={(e) => onDealerPriceChange(e.target.value)}
                              className="w-24 px-2 py-1 border border-accent-300 rounded-lg text-right text-sm focus:ring-2 focus:ring-accent-100 outline-none" />
                          ) : (
                            <span className="font-medium text-accent-700">{formatCurrency(p.dealer_price)}</span>
                          )}
                        </td>

                        {/* Discount % (editable) */}
                        <td className="py-3 px-4 text-center">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-0.5">
                              <input type="number" value={editing.discount_pct}
                                onChange={(e) => onDiscountChange(e.target.value)}
                                min="0" max="99"
                                className="w-14 px-2 py-1 border border-accent-300 rounded-lg text-center text-sm focus:ring-2 focus:ring-accent-100 outline-none" />
                              <span className="text-xs text-gray-500">%</span>
                            </div>
                          ) : (
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              disc >= 20 ? 'bg-green-100 text-green-700' : disc >= 10 ? 'bg-gold-100 text-gold-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {disc}% off
                            </span>
                          )}
                        </td>

                        {/* Stock */}
                        <td className="py-3 px-4 text-center">
                          {isEditing ? (
                            <input type="number" value={editing.stock_quantity}
                              onChange={(e) => setEditing({ ...editing, stock_quantity: e.target.value })}
                              className="w-16 px-2 py-1 border border-accent-300 rounded-lg text-center text-sm focus:ring-2 focus:ring-accent-100 outline-none" />
                          ) : (
                            <span className={`inline-flex items-center gap-1 ${p.stock_quantity < 10 ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                              {p.stock_quantity < 10 && <FiAlertTriangle size={12} />}
                              {p.stock_quantity}
                            </span>
                          )}
                        </td>

                        {/* Active toggle */}
                        <td className="py-3 px-4 text-center">
                          <motion.button whileTap={{ scale: 0.9 }}
                            onClick={() => updateProduct.mutate({ productId: p.id, is_active: !p.is_active })}
                            className={p.is_active ? 'text-green-600' : 'text-gray-400'}>
                            {p.is_active ? <FiToggleRight size={22} /> : <FiToggleLeft size={22} />}
                          </motion.button>
                        </td>

                        {/* Edit / Save / Cancel */}
                        <td className="py-3 px-4 text-center">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1">
                              <motion.button whileTap={{ scale: 0.9 }} onClick={saveEdit}
                                className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200" title="Save">
                                <FiCheck size={14} />
                              </motion.button>
                              <motion.button whileTap={{ scale: 0.9 }} onClick={() => setEditing(null)}
                                className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200" title="Cancel">
                                <FiX size={14} />
                              </motion.button>
                            </div>
                          ) : (
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => startEdit(p)}
                              className="p-1.5 bg-accent-50 text-accent-600 rounded-lg hover:bg-accent-100" title="Edit pricing">
                              <FiEdit2 size={14} />
                            </motion.button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="flex justify-center gap-1.5 mt-6">
            {page > 1 && (
              <button onClick={() => setPage(page - 1)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm bg-white hover:bg-gray-50">Prev</button>
            )}
            {Array.from({ length: Math.min(data.pages, 7) }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)}
                className={`w-10 h-10 rounded-xl text-sm font-semibold ${
                  p === page ? 'bg-accent-600 text-white shadow-md' : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-600'
                }`}>{p}</button>
            ))}
            {page < data.pages && (
              <button onClick={() => setPage(page + 1)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm bg-white hover:bg-gray-50">Next</button>
            )}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
