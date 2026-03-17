import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiTrash2, FiMinus, FiPlus } from 'react-icons/fi';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { GradientButton } from '@/components/ui/GradientButton';
import { useCart, useUpdateCartItem, useRemoveCartItem } from '@/hooks/useCart';
import { formatCurrency } from '@/lib/utils';

export function CartPage() {
  const { data: cart, isLoading } = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();

  if (isLoading) return <PageWrapper><div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" /></div></PageWrapper>;
  if (!cart || cart.items.length === 0) return (
    <PageWrapper><div className="max-w-4xl mx-auto px-4 py-20 text-center"><h1 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h1><Link to="/"><GradientButton>Browse Products</GradientButton></Link></div></PageWrapper>
  );

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Shopping Cart ({cart.item_count} items)</h1>
        <div className="space-y-4">
          {cart.items.map((item) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
              <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                {item.product_image ? <img src={item.product_image} alt={item.product_name} className="max-h-full max-w-full object-contain" /> : <span className="text-2xl">📦</span>}
              </div>
              <div className="flex-1"><h3 className="font-medium text-gray-900">{item.product_name}</h3><p className="text-sm text-gray-500">{formatCurrency(item.price)} each</p></div>
              <div className="flex items-center gap-2">
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => updateItem.mutate({ itemId: item.id, quantity: item.quantity - 1 })} className="p-1 rounded bg-gray-100 hover:bg-gray-200"><FiMinus size={16} /></motion.button>
                <span className="w-8 text-center font-medium">{item.quantity}</span>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => updateItem.mutate({ itemId: item.id, quantity: item.quantity + 1 })} className="p-1 rounded bg-gray-100 hover:bg-gray-200"><FiPlus size={16} /></motion.button>
              </div>
              <div className="text-right min-w-[80px]"><p className="font-bold text-gray-900">{formatCurrency(item.total)}</p></div>
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => removeItem.mutate(item.id)} className="p-2 text-red-400 hover:text-red-600"><FiTrash2 size={18} /></motion.button>
            </motion.div>
          ))}
        </div>
        <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4"><span className="text-lg font-medium text-gray-600">Subtotal</span><span className="text-2xl font-bold text-gray-900">{formatCurrency(cart.subtotal)}</span></div>
          <p className="text-xs text-gray-400 mb-4">Taxes calculated at checkout</p>
          <Link to="/checkout"><GradientButton className="w-full" size="lg">Proceed to Checkout</GradientButton></Link>
        </div>
      </div>
    </PageWrapper>
  );
}
