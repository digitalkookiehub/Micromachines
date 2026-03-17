import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiFileText, FiDownload, FiChevronRight } from 'react-icons/fi';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { GradientButton } from '@/components/ui/GradientButton';
import { invoiceService } from '@/services/invoiceService';
import { formatCurrency } from '@/lib/utils';
import type { Invoice } from '@/types';

export function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    invoiceService.list().then(setInvoices).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleDownload = async (invoiceId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = await invoiceService.downloadPdf(invoiceId);
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

  if (invoices.length === 0) {
    return (
      <PageWrapper>
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <FiFileText className="mx-auto text-gray-300 mb-4" size={64} />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No invoices yet</h1>
          <p className="text-gray-500 mb-6">Invoices are generated after successful payments</p>
          <Link to="/orders"><GradientButton>View Orders</GradientButton></Link>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Invoices</h1>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Invoice #</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Date</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Billing Name</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">GSTIN</th>
                <th className="text-right py-3 px-4 text-gray-500 font-medium">Amount</th>
                <th className="text-center py-3 px-4 text-gray-500 font-medium">PDF</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv, i) => (
                <motion.tr
                  key={inv.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                >
                  <td className="py-3 px-4">
                    <Link to={`/invoices/${inv.id}`} className="font-medium text-primary-600 hover:text-primary-700">
                      {inv.invoice_number}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-gray-500">
                    {new Date(inv.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="py-3 px-4 text-gray-900">{inv.billing_name}</td>
                  <td className="py-3 px-4 text-gray-500">{inv.gstin || '-'}</td>
                  <td className="py-3 px-4 text-right font-medium text-gray-900">{formatCurrency(inv.total_amount)}</td>
                  <td className="py-3 px-4 text-center">
                    {inv.pdf_url && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => handleDownload(inv.id, e)}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        <FiDownload size={16} />
                      </motion.button>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <Link to={`/invoices/${inv.id}`}>
                      <FiChevronRight className="text-gray-400" size={16} />
                    </Link>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageWrapper>
  );
}
