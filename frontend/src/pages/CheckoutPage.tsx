import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FiMapPin, FiCreditCard, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { AnimatedInput } from '@/components/ui/AnimatedInput';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/context/AuthContext';
import { orderService } from '@/services/orderService';
import { creditService } from '@/services/creditService';
import { formatCurrency } from '@/lib/utils';
import type { PaymentMethod, CreditSummary } from '@/types';

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

interface AddressForm {
  full_name: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
}

const emptyAddress: AddressForm = { full_name: '', address_line1: '', address_line2: '', city: '', state: '', pincode: '', phone: '' };

export function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: cart, isLoading: cartLoading } = useCart();
  const [shipping, setShipping] = useState<AddressForm>(emptyAddress);
  const [billing, setBilling] = useState<AddressForm>(emptyAddress);
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('razorpay');

  const isDealer = user?.role === 'dealer' && user?.dealer_profile?.is_approved;
  const hasCreditLimit = isDealer && (user?.dealer_profile?.credit_limit ?? 0) > 0;

  const { data: creditSummary } = useQuery<CreditSummary>({
    queryKey: ['credit-summary'],
    queryFn: () => creditService.getSummary(),
    enabled: !!hasCreditLimit,
  });

  const updateShipping = (field: keyof AddressForm, value: string) => setShipping((p) => ({ ...p, [field]: value }));
  const updateBilling = (field: keyof AddressForm, value: string) => setBilling((p) => ({ ...p, [field]: value }));

  const orderTotal = (cart?.subtotal ?? 0) * 1.18;
  const insufficientCredit = paymentMethod === 'credit' && creditSummary && creditSummary.available < orderTotal;

  const handlePay = async () => {
    if (!shipping.full_name || !shipping.address_line1 || !shipping.city || !shipping.state || !shipping.pincode || !shipping.phone) {
      toast.error('Please fill all required shipping fields');
      return;
    }
    setProcessing(true);
    try {
      const billingAddr = sameAsShipping ? shipping : billing;
      const order = await orderService.create(
        shipping as unknown as Record<string, string>,
        billingAddr as unknown as Record<string, string>,
        paymentMethod,
      );

      if (paymentMethod === 'credit') {
        toast.success('Order placed on credit!');
        navigate(`/orders/${order.id}`);
        return;
      }

      const payment = await orderService.initiatePayment(order.id);

      const options = {
        key: payment.key_id,
        amount: payment.amount,
        currency: payment.currency,
        name: 'MicroMachines',
        description: `Order ${order.order_number}`,
        order_id: payment.razorpay_order_id,
        handler: () => {
          toast.success('Payment successful!');
          navigate(`/orders/${order.id}`);
        },
        prefill: { name: shipping.full_name, contact: shipping.phone },
        theme: { color: '#6366f1' },
      };

      if (window.Razorpay) {
        new window.Razorpay(options).open();
      } else {
        toast.success('Order created! Payment gateway loading...');
        navigate(`/orders/${order.id}`);
      }
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to create order';
      toast.error(message);
    } finally {
      setProcessing(false);
    }
  };

  if (cartLoading) {
    return (
      <PageWrapper>
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      </PageWrapper>
    );
  }

  const addressFields: { key: keyof AddressForm; label: string; required?: boolean }[] = [
    { key: 'full_name', label: 'Full Name', required: true },
    { key: 'phone', label: 'Phone', required: true },
    { key: 'address_line1', label: 'Address Line 1', required: true },
    { key: 'address_line2', label: 'Address Line 2' },
    { key: 'city', label: 'City', required: true },
    { key: 'state', label: 'State', required: true },
    { key: 'pincode', label: 'Pincode', required: true },
  ];

  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <GlassCard>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FiMapPin /> Shipping Address
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addressFields.map(({ key, label, required }) => (
                  <AnimatedInput
                    key={key}
                    label={`${label}${required ? ' *' : ''}`}
                    value={shipping[key]}
                    onChange={(e) => updateShipping(key, e.target.value)}
                    required={required}
                  />
                ))}
              </div>
            </GlassCard>

            <GlassCard>
              <label className="flex items-center gap-2 mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sameAsShipping}
                  onChange={(e) => setSameAsShipping(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">Billing address same as shipping</span>
              </label>
              {!sameAsShipping && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FiMapPin /> Billing Address
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {addressFields.map(({ key, label, required }) => (
                      <AnimatedInput
                        key={key}
                        label={`${label}${required ? ' *' : ''}`}
                        value={billing[key]}
                        onChange={(e) => updateBilling(key, e.target.value)}
                        required={required}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </GlassCard>

            {/* Payment Method Selection for Dealers */}
            {hasCreditLimit && (
              <GlassCard>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FiCreditCard /> Payment Method
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('razorpay')}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      paymentMethod === 'razorpay'
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <FiCreditCard className={paymentMethod === 'razorpay' ? 'text-primary-600' : 'text-gray-400'} />
                      <span className="font-semibold text-sm text-gray-900">Pay Now</span>
                    </div>
                    <p className="text-xs text-gray-500">Pay via Razorpay</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('credit')}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      paymentMethod === 'credit'
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <FiClock className={paymentMethod === 'credit' ? 'text-primary-600' : 'text-gray-400'} />
                      <span className="font-semibold text-sm text-gray-900">Pay Later</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {creditSummary ? `${creditSummary.terms_days}-day credit` : 'Credit terms'}
                    </p>
                  </button>
                </div>

                {paymentMethod === 'credit' && creditSummary && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 rounded-lg bg-gray-50 text-sm space-y-1"
                  >
                    <div className="flex justify-between">
                      <span className="text-gray-500">Credit Limit</span>
                      <span className="font-medium">{formatCurrency(creditSummary.credit_limit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Available</span>
                      <span className={`font-medium ${insufficientCredit ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(creditSummary.available)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">This Order</span>
                      <span className="font-medium">{formatCurrency(orderTotal)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-1">
                      <span className="text-gray-500">After Order</span>
                      <span className={`font-bold ${insufficientCredit ? 'text-red-600' : ''}`}>
                        {formatCurrency(creditSummary.available - orderTotal)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Payment Due</span>
                      <span className="font-medium">{creditSummary.terms_days} days from today</span>
                    </div>
                    {insufficientCredit && (
                      <p className="text-red-600 font-medium text-xs mt-2">
                        Insufficient credit. Please reduce order or pay via Razorpay.
                      </p>
                    )}
                  </motion.div>
                )}
              </GlassCard>
            )}
          </div>

          <div>
            <GlassCard>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FiCreditCard /> Order Summary
              </h2>
              {cart?.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm py-2 border-b border-gray-100">
                  <span className="text-gray-600">{item.product_name} x{item.quantity}</span>
                  <span className="font-medium">{formatCurrency(item.total)}</span>
                </div>
              ))}
              <div className="mt-4 pt-2 border-t border-gray-200">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatCurrency(cart?.subtotal ?? 0)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>GST (18%)</span>
                  <span>{formatCurrency((cart?.subtotal ?? 0) * 0.18)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 mt-3 pt-2 border-t">
                  <span>Total</span>
                  <span>{formatCurrency(orderTotal)}</span>
                </div>
              </div>
              <GradientButton
                className="w-full mt-6"
                size="lg"
                onClick={handlePay}
                disabled={processing || !cart?.items.length || !!insufficientCredit}
              >
                {processing
                  ? 'Processing...'
                  : paymentMethod === 'credit'
                    ? 'Place Order on Credit'
                    : 'Pay with Razorpay'}
              </GradientButton>
            </GlassCard>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
