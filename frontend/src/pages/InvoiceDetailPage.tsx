import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiDownload, FiPrinter } from 'react-icons/fi';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { invoiceService } from '@/services/invoiceService';
import { formatCurrency } from '@/lib/utils';
import type { Invoice } from '@/types';

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      invoiceService.getById(Number(id)).then(setInvoice).catch(() => {}).finally(() => setLoading(false));
    }
  }, [id]);

  const handleDownload = async () => {
    if (!invoice) return;
    const url = await invoiceService.downloadPdf(invoice.id);
    if (url) window.open(url, '_blank');
  };

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      </PageWrapper>
    );
  }

  if (!invoice) {
    return (
      <PageWrapper>
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Invoice not found</h1>
          <Link to="/invoices" className="text-primary-600 mt-4 inline-block">Back to Invoices</Link>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link to="/invoices" className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center gap-1 mb-4">
          <FiArrowLeft size={14} /> Back to Invoices
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{invoice.invoice_number}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {new Date(invoice.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-2">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <GradientButton variant="outline" size="sm" onClick={handleDownload}>
                <span className="flex items-center gap-1"><FiDownload size={14} /> Download PDF</span>
              </GradientButton>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <GradientButton variant="outline" size="sm" onClick={() => window.print()}>
                <span className="flex items-center gap-1"><FiPrinter size={14} /> Print</span>
              </GradientButton>
            </motion.div>
          </div>
        </div>

        <GlassCard className="mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Billing Name</span>
              <p className="font-medium text-gray-900">{invoice.billing_name}</p>
            </div>
            <div>
              <span className="text-gray-500">GSTIN</span>
              <p className="font-medium text-gray-900">{invoice.gstin || 'N/A'}</p>
            </div>
            <div>
              <span className="text-gray-500">Order ID</span>
              <p className="font-medium text-gray-900">#{invoice.order_id}</p>
            </div>
            <div>
              <span className="text-gray-500">Tax Type</span>
              <p className="font-medium text-gray-900">{invoice.is_igst ? 'IGST (Inter-state)' : 'CGST + SGST (Intra-state)'}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4">Line Items</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 text-gray-500 font-medium">Product</th>
                  <th className="text-center py-3 text-gray-500 font-medium">HSN</th>
                  <th className="text-center py-3 text-gray-500 font-medium">Qty</th>
                  <th className="text-right py-3 text-gray-500 font-medium">Unit Price</th>
                  <th className="text-right py-3 text-gray-500 font-medium">Taxable</th>
                  {invoice.is_igst ? (
                    <th className="text-right py-3 text-gray-500 font-medium">IGST @{invoice.items[0]?.igst_rate ?? 18}%</th>
                  ) : (
                    <>
                      <th className="text-right py-3 text-gray-500 font-medium">CGST @{invoice.items[0]?.cgst_rate ?? 9}%</th>
                      <th className="text-right py-3 text-gray-500 font-medium">SGST @{invoice.items[0]?.sgst_rate ?? 9}%</th>
                    </>
                  )}
                  <th className="text-right py-3 text-gray-500 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="py-3 font-medium text-gray-900">{item.product_name}</td>
                    <td className="py-3 text-center text-gray-500">{item.hsn_code}</td>
                    <td className="py-3 text-center">{item.quantity}</td>
                    <td className="py-3 text-right">{formatCurrency(item.unit_price)}</td>
                    <td className="py-3 text-right">{formatCurrency(item.taxable_amount)}</td>
                    {invoice.is_igst ? (
                      <td className="py-3 text-right">{formatCurrency(item.igst_amount)}</td>
                    ) : (
                      <>
                        <td className="py-3 text-right">{formatCurrency(item.cgst_amount)}</td>
                        <td className="py-3 text-right">{formatCurrency(item.sgst_amount)}</td>
                      </>
                    )}
                    <td className="py-3 text-right font-medium">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="max-w-xs ml-auto space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.is_igst ? (
              <div className="flex justify-between">
                <span className="text-gray-500">IGST</span>
                <span>{formatCurrency(invoice.igst_amount)}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-500">CGST</span>
                  <span>{formatCurrency(invoice.cgst_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">SGST</span>
                  <span>{formatCurrency(invoice.sgst_amount)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Total Tax</span>
              <span>{formatCurrency(invoice.total_tax)}</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-gray-200 text-base font-bold">
              <span>Grand Total</span>
              <span>{formatCurrency(invoice.total_amount)}</span>
            </div>
          </div>
        </GlassCard>
      </div>
    </PageWrapper>
  );
}
