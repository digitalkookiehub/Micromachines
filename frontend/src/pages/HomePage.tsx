import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiChevronLeft, FiChevronRight, FiArrowRight, FiGrid } from 'react-icons/fi';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { ProductCard } from '@/components/ProductCard';
import { useProducts } from '@/hooks/useProducts';
import { useAddToCart } from '@/hooks/useCart';
import { useAuth } from '@/context/AuthContext';

const categories = [
  { value: 'mouse', label: 'Mouse', emoji: '🖱️' },
  { value: 'keyboard', label: 'Keyboards', emoji: '⌨️' },
  { value: 'monitor', label: 'Monitors', emoji: '🖥️' },
  { value: 'headset', label: 'Audio', emoji: '🎧' },
  { value: 'storage', label: 'Storage', emoji: '💾' },
  { value: 'accessories', label: 'More', emoji: '🔌' },
];

export function HomePage() {
  const [searchParams] = useSearchParams();
  const urlCategory = searchParams.get('category') || '';
  const [category, setCategory] = useState(urlCategory);
  const [page, setPage] = useState(1);
  const { data, isLoading } = useProducts(category, page);
  const addToCart = useAddToCart();
  const { user, openLoginModal } = useAuth();
  const { data: mice } = useProducts('mouse', 1);
  const { data: keyboards } = useProducts('keyboard', 1);
  const { data: headsets } = useProducts('headset', 1);
  const { data: monitors } = useProducts('monitor', 1);
  const { data: storage } = useProducts('storage', 1);
  const { data: accessories } = useProducts('accessories', 1);

  useEffect(() => { setCategory(urlCategory); setPage(1); }, [urlCategory]);
  const handleAddToCart = (productId: number) => { if (!user) { openLoginModal(); return; } addToCart.mutate({ productId }); };

  return (
    <PageWrapper>
      {/* Category Pills */}
      <div className="bg-white border-b border-gray-200 sticky top-[60px] z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto">
          <Link to="/"><motion.button whileTap={{ scale: 0.95 }}
            className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${!category ? 'bg-gradient-to-r from-brand-500 to-glow-500 text-white shadow-md shadow-brand-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>All</motion.button></Link>
          {categories.map((c) => (
            <Link key={c.value} to={`/?category=${c.value}`}><motion.button whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                category === c.value ? 'bg-gradient-to-r from-brand-500 to-glow-500 text-white shadow-md shadow-brand-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {c.emoji} {c.label}
            </motion.button></Link>
          ))}
        </div>
      </div>

      {/* Dealer Banner - always visible for customers & guests */}
      {user && (user.role === 'dealer' || user.role === 'admin') && (
        <div className="max-w-7xl mx-auto px-4 pt-6">
          <div className="bg-gradient-to-r from-brand-600 to-glow-600 rounded-2xl p-8 text-center shadow-lg shadow-brand-200">
            <h3 className="text-2xl font-black text-white mb-2">Unlock Dealer Pricing</h3>
            <p className="text-white/70 text-sm mb-5">Register as a dealer to get wholesale rates, AI tools & GST invoicing</p>
            <Link to="/register"><motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="px-8 py-3 bg-white text-brand-700 rounded-xl font-bold text-sm hover:bg-brand-50 shadow-lg">Register as Dealer</motion.button></Link>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4">
        {category ? (
          /* Category grid */
          <div className="py-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-black text-gray-900 capitalize">{category}</h2>
              <Link to="/" className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">All Products <FiArrowRight size={14} /></Link>
            </div>
            {isLoading ? <LoadingGrid /> : data?.items.length === 0 ? <EmptyState /> : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">{data?.items.map((p, i) => (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}><ProductCard product={p} onAddToCart={handleAddToCart} /></motion.div>
                ))}</div>
                {data && data.pages > 1 && <Pagination page={page} pages={data.pages} onPage={setPage} />}
              </>
            )}
          </div>
        ) : (
          /* Home */
          <>
            {mice && mice.items.length > 0 && <ProductRow title="🖱️ Mouse & Mice" cat="mouse" products={mice.items} onAdd={handleAddToCart} />}
            {keyboards && keyboards.items.length > 0 && <ProductRow title="⌨️ Keyboards" cat="keyboard" products={keyboards.items} onAdd={handleAddToCart} />}
            {monitors && monitors.items.length > 0 && <ProductRow title="🖥️ Monitors" cat="monitor" products={monitors.items} onAdd={handleAddToCart} />}

            {headsets && headsets.items.length > 0 && <ProductRow title="🎧 Headsets & Audio" cat="headset" products={headsets.items} onAdd={handleAddToCart} />}
            {storage && storage.items.length > 0 && <ProductRow title="💾 Storage & SSDs" cat="storage" products={storage.items} onAdd={handleAddToCart} />}
            {accessories && accessories.items.length > 0 && <ProductRow title="🔌 Accessories" cat="accessories" products={accessories.items} onAdd={handleAddToCart} />}

            {/* All Products */}
            <div className="py-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-black text-gray-900">All Products</h2>
                <span className="text-sm text-gray-500">{data?.total ?? 0} products</span>
              </div>
              {isLoading ? <LoadingGrid /> : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">{data?.items.map((p, i) => (
                  <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}><ProductCard product={p} onAddToCart={handleAddToCart} /></motion.div>
                ))}</div>
              )}
              {data && data.pages > 1 && <Pagination page={page} pages={data.pages} onPage={setPage} />}
            </div>
          </>
        )}
      </div>
    </PageWrapper>
  );
}

function ProductRow({ title, cat, products, onAdd }: { title: string; cat: string; products: import('@/types').Product[]; onAdd: (id: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * 260, behavior: 'smooth' });
  return (
    <div className="py-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-black text-gray-900">{title}</h3>
        <Link to={`/?category=${cat}`} className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">See all <FiArrowRight size={14} /></Link>
      </div>
      <div className="relative group">
        <div ref={ref} className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {products.slice(0, 10).map((p) => (<div key={p.id} className="flex-shrink-0 w-[220px]"><ProductCard product={p} onAddToCart={onAdd} /></div>))}
        </div>
        <button onClick={() => scroll(-1)} className="absolute left-0 top-1/3 -translate-y-1/2 w-10 h-24 bg-white shadow-lg border border-gray-200 rounded-r-xl items-center justify-center hidden group-hover:flex z-10 hover:bg-gray-50"><FiChevronLeft size={18} className="text-gray-600" /></button>
        <button onClick={() => scroll(1)} className="absolute right-0 top-1/3 -translate-y-1/2 w-10 h-24 bg-white shadow-lg border border-gray-200 rounded-l-xl items-center justify-center hidden group-hover:flex z-10 hover:bg-gray-50"><FiChevronRight size={18} className="text-gray-600" /></button>
      </div>
    </div>
  );
}

function LoadingGrid() {
  return <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">{Array.from({ length: 8 }).map((_, i) => (
    <div key={i} className="bg-white rounded-2xl border border-gray-200"><div className="aspect-square shimmer rounded-t-2xl" /><div className="p-4 space-y-3"><div className="h-3 shimmer rounded w-2/3" /><div className="h-5 shimmer rounded w-1/3" /></div></div>
  ))}</div>;
}

function EmptyState() {
  return <div className="text-center py-16 bg-white rounded-2xl border border-gray-200"><FiGrid className="mx-auto text-gray-300 mb-3" size={40} /><p className="font-bold text-gray-700">No products found</p><Link to="/" className="text-brand-600 text-sm hover:underline mt-2 inline-block">View all</Link></div>;
}

function Pagination({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  return <div className="flex justify-center gap-2 mt-8">
    {page > 1 && <button onClick={() => onPage(page - 1)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm bg-white hover:bg-gray-50 font-semibold text-gray-600">Prev</button>}
    {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map((p) => (
      <button key={p} onClick={() => onPage(p)} className={`w-10 h-10 rounded-xl text-sm font-bold ${p === page ? 'bg-gradient-to-r from-brand-500 to-glow-500 text-white shadow-md shadow-brand-200' : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-600'}`}>{p}</button>
    ))}
    {page < pages && <button onClick={() => onPage(page + 1)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm bg-white hover:bg-gray-50 font-semibold text-gray-600">Next</button>}
  </div>;
}
