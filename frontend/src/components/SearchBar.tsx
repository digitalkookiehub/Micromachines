import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiX } from 'react-icons/fi';
import { useProductSearch } from '@/hooks/useProducts';
import { formatCurrency } from '@/lib/utils';
import type { Product } from '@/types';

export function SearchBar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data } = useProductSearch(query);
  const results: Product[] = data?.items?.slice(0, 6) || [];

  useEffect(() => {
    const h = (e: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex rounded-lg overflow-hidden">
        <input ref={inputRef} type="text" placeholder="Search products, brands..."
          value={query} onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }} onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => { if (e.key === 'Enter' && query.trim()) { setIsOpen(false); navigate(`/?search=${encodeURIComponent(query.trim())}`); } if (e.key === 'Escape') setIsOpen(false); }}
          className="flex-1 px-4 py-2.5 bg-white text-gray-900 placeholder-gray-400 outline-none text-sm" />
        {query && <button onClick={() => { setQuery(''); inputRef.current?.focus(); }} className="px-2 bg-white text-gray-400 hover:text-gray-600"><FiX size={14} /></button>}
        <button onClick={() => { if (query.trim()) { setIsOpen(false); navigate(`/?search=${encodeURIComponent(query.trim())}`); } }}
          className="bg-glow-500 hover:bg-glow-600 px-4 flex items-center transition-colors">
          <FiSearch size={18} className="text-white" />
        </button>
      </div>

      <AnimatePresence>
        {isOpen && query.length > 1 && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50">
            {results.length === 0 ? (
              <div className="px-4 py-5 text-center text-sm text-gray-400">No results for "{query}"</div>
            ) : (
              <div className="max-h-[360px] overflow-y-auto divide-y divide-gray-100">
                {results.map((p) => (
                  <button key={p.id} onClick={() => { setIsOpen(false); setQuery(''); navigate(`/products/${p.slug}`); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-brand-50 transition-colors text-left">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                      {p.image_url ? <img src={p.image_url} alt="" className="max-h-full max-w-full object-contain" /> : <span>📦</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate font-semibold">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.brand}</p>
                    </div>
                    <span className="text-sm font-bold text-brand-600">{formatCurrency(p.price)}</span>
                  </button>
                ))}
                {(data?.total ?? 0) > 6 && (
                  <button onClick={() => { setIsOpen(false); navigate(`/?search=${encodeURIComponent(query)}`); }}
                    className="w-full px-4 py-3 text-sm text-brand-600 hover:bg-brand-50 font-bold">View all {data?.total} results</button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
