import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiShoppingCart, FiTrendingDown } from 'react-icons/fi';
import type { Product } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: number) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const isDealer = product.is_dealer === true;
  const isLowStock = product.stock_quantity > 0 && product.stock_quantity < 20;
  const isOutOfStock = product.stock_quantity === 0;

  return (
    <motion.div whileHover={{ y: -4 }}
      className="bg-white rounded-2xl border border-gray-200 hover:border-brand-300 hover:shadow-xl hover:shadow-brand-100 transition-all duration-300 overflow-hidden flex flex-col h-full group">

      {isDealer && (
        <div className="bg-gradient-to-r from-glow-500 to-brand-500 text-white text-[10px] font-bold px-2 py-1 text-center tracking-widest uppercase">
          Dealer Price
        </div>
      )}

      <Link to={`/products/${product.slug}`} className="block relative">
        <div className="aspect-square bg-gradient-to-br from-brand-50 to-glow-50 flex items-center justify-center p-5">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-500" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-brand-100 flex items-center justify-center"><span className="text-2xl">📦</span></div>
          )}
        </div>
        {isLowStock && (
          <span className="absolute top-2 right-2 text-[10px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full border border-orange-200">
            {product.stock_quantity} left
          </span>
        )}
      </Link>

      <div className="p-4 flex flex-col flex-1 border-t border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] font-bold text-brand-700 bg-brand-100 px-2 py-0.5 rounded">{product.brand}</span>
          <span className="text-[11px] text-gray-500 capitalize">{product.category}</span>
        </div>

        <Link to={`/products/${product.slug}`}>
          <h3 className="font-semibold text-gray-900 text-sm hover:text-brand-600 transition-colors line-clamp-2 leading-snug mb-2">{product.name}</h3>
        </Link>

        <div className="mt-auto">
          {isDealer ? (
            <div className="mb-3">
              <span className="text-xl font-black text-gray-900">{formatCurrency(product.price)}</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-400 line-through">{formatCurrency(product.mrp ?? 0)}</span>
                <span className="flex items-center gap-0.5 text-[11px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded">
                  <FiTrendingDown size={10} /> {product.savings_percent}% off
                </span>
              </div>
            </div>
          ) : (
            <div className="mb-3">
              <span className="text-xl font-black text-gray-900">{formatCurrency(product.price)}</span>
              {product.tax_label && <p className="text-[11px] text-gray-500 mt-1">{product.tax_label}</p>}
            </div>
          )}

          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            disabled={isOutOfStock} onClick={() => onAddToCart?.(product.id)}
            className={`w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              isOutOfStock ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-brand-500 to-glow-500 text-white shadow-md shadow-brand-200 hover:shadow-lg hover:shadow-brand-300'
            }`}>
            <FiShoppingCart size={14} />
            {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
