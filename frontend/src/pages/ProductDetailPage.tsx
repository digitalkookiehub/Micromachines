import { useParams } from 'react-router-dom';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { GradientButton } from '@/components/ui/GradientButton';
import { useProduct } from '@/hooks/useProducts';
import { useAddToCart } from '@/hooks/useCart';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/utils';
import { FiShoppingCart } from 'react-icons/fi';

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading } = useProduct(slug ?? '');
  const addToCart = useAddToCart();
  const { user, openLoginModal } = useAuth();

  if (isLoading) return <PageWrapper><div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" /></div></PageWrapper>;
  if (!product) return <PageWrapper><div className="max-w-7xl mx-auto px-4 py-20 text-center"><h1 className="text-2xl font-bold">Product not found</h1></div></PageWrapper>;

  const isDealer = product.is_dealer === true;
  const handleAddToCart = () => { if (!user) { openLoginModal(); return; } addToCart.mutate({ productId: product.id }); };

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-10">
          <div className="bg-gray-100 rounded-2xl p-8 flex items-center justify-center aspect-square">
            {product.image_url ? <img src={product.image_url} alt={product.name} className="max-h-full max-w-full object-contain" /> : <div className="text-gray-400 text-8xl">📦</div>}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-primary-600 bg-primary-50 px-3 py-1 rounded-full">{product.brand}</span>
              <span className="text-sm text-gray-400 capitalize">{product.category}</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
            <div className="mb-6">
              {isDealer ? (
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-3xl font-bold text-dealer-700">{formatCurrency(product.price)}</span>
                    <span className="text-lg text-gray-400 line-through">{formatCurrency(product.mrp ?? 0)}</span>
                    <span className="bg-green-100 text-green-700 text-sm font-bold px-2 py-0.5 rounded">Save {product.savings_percent}%</span>
                  </div>
                  <p className="text-sm text-green-600">You save {formatCurrency(product.savings_amount ?? 0)}</p>
                </div>
              ) : (
                <div>
                  <span className="text-3xl font-bold text-gray-900">{formatCurrency(product.price)}</span>
                  {product.tax_label && <p className="text-sm text-gray-400 mt-1">{product.tax_label}</p>}
                </div>
              )}
            </div>
            {product.stock_quantity > 0 && product.stock_quantity < 20 && <p className="text-orange-600 text-sm font-medium mb-4">Only {product.stock_quantity} left!</p>}
            {product.description && <div className="mb-6"><h3 className="font-semibold text-gray-900 mb-2">Description</h3><p className="text-gray-600 text-sm">{product.description}</p></div>}
            {Object.keys(product.specifications || {}).length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Specifications</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  {Object.entries(product.specifications).map(([k, v]) => (
                    <div key={k} className="flex justify-between py-2 border-b border-gray-100 last:border-0"><span className="text-sm text-gray-500">{k}</span><span className="text-sm font-medium">{v}</span></div>
                  ))}
                </div>
              </div>
            )}
            <GradientButton variant={isDealer ? 'dealer' : 'primary'} size="lg" onClick={handleAddToCart} disabled={product.stock_quantity === 0} className="w-full flex items-center justify-center gap-2">
              <FiShoppingCart />{product.stock_quantity === 0 ? 'Out of Stock' : isDealer ? 'Add to Order' : 'Add to Cart'}
            </GradientButton>
            <div className="mt-4 text-xs text-gray-400">SKU: {product.sku} | HSN: {product.hsn_code}</div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
