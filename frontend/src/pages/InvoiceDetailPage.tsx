/**
 * Invoice Detail Page
 * Shows detailed invoice information with payment option
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useInvoice } from '../hooks/queries';
import { showToast } from '../lib/toast';
import PaystackButton from '../components/PaystackButton';
import { paystackService } from '../services/billingService';
import { QUERY_KEYS } from '../lib/queryKeys';
import type { Invoice } from '../types/billing';
import { ExportDropdown } from '../components/ExportDropdown';
import { reportService } from '../services/reportService';

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: invoice, isLoading: loading, error } = useInvoice(id!);

  const handlePaymentSuccess = async (reference: string) => {
    const toastId = showToast.loading('Verifying payment with server...');
    try {
      await paystackService.verifyPayment(reference);
      showToast.dismiss(toastId);
      showToast.success(`Payment verified and completed! Reference: ${reference}`);
    } catch (err: any) {
      showToast.dismiss(toastId);
      console.error('Payment verification failed:', err);
      showToast.error(err?.response?.data?.detail || 'Failed to verify payment with server');
    } finally {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.billing.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.enrollments.all });
      queryClient.invalidateQueries({ queryKey: ['billing'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    }
  };

  const formatCurrency = (amount: number | string) => {
    const numericAmount = Number(amount || 0);
    return `₦${numericAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partially_paid':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-500';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    console.error('Failed to fetch invoice:', error);
    showToast.error('Invoice not found');
    navigate('/billing');
    return null;
  }

  if (!invoice && !loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Invoice not found</p>
      </div>
    );
  }

  const handleExportPDF = () => {
    const printElement = document.getElementById('invoice-printable-card');
    if (!printElement) {
      window.print();
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast.error('Please allow popups to export the invoice PDF');
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice?.invoice_number || 'Document'} - ICAN Tutorial Centre</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @page { size: A4; margin: 12mm; }
            body { font-family: system-ui, -apple-system, sans-serif; background: #ffffff; color: #0f172a; padding: 10px; }
            .no-print { display: none !important; }
          </style>
        </head>
        <body>
          <div style="max-width: 800px; margin: 0 auto;">
            ${printElement.outerHTML}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 400);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleExportExcel = () => {
    if (!invoice) return;
    const lines = [
      `Invoice Number: ${invoice.invoice_number}`,
      `Student Name: ${invoice.student_name || 'Student'}`,
      `Student Email: ${user?.email || ''}`,
      `Issue Date: ${new Date(invoice.created_at).toLocaleDateString()}`,
      `Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`,
      `Status: ${invoice.status_display || invoice.status}`,
      '',
      'Description,Quantity,Amount',
      ...(invoice.items || []).map((item) => `"${item.description || ''}",${item.quantity || 1},${item.total || 0}`),
      '',
      `Subtotal,,${invoice.items?.reduce((sum, item) => sum + Number(item.total || 0), 0) || 0}`,
      `Total Amount,,${invoice.total_amount || 0}`,
      `Amount Paid,,${invoice.amount_paid || 0}`,
      `Balance,,${invoice.balance || 0}`,
    ];
    const csvContent = '\ufeff' + lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    reportService.downloadBlob(blob, `invoice_${invoice.invoice_number}_${new Date().toISOString().slice(0, 10)}.csv`);
    showToast.success(`Invoice exported: ${invoice.invoice_number}`);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between no-print">
        <button
          onClick={() => navigate(-1)}
          className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        
        <div className="flex gap-3">
          <ExportDropdown
            size="sm"
            onExportPdf={handleExportPDF}
            onExportExcel={handleExportExcel}
          />
          {Number(invoice.balance || 0) > 0 && user?.email && (
            <PaystackButton
              amount={Number(invoice.balance || 0)}
              email={user.email}
              invoiceId={invoice.id}
              onSuccess={handlePaymentSuccess}
            />
          )}
        </div>
      </div>

      {/* Invoice Card */}
      <div id="invoice-printable-card" className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-8 py-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">INVOICE</h1>
              <p className="text-blue-100">ICAN Tutorial Centre</p>
            </div>
            <div className="text-right">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.status)}`}>
                {invoice.status_display}
              </span>
            </div>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="p-8">
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">INVOICE TO:</h3>
              <p className="font-medium text-gray-900">{invoice.student_name || 'Student'}</p>
              <p className="text-sm text-gray-600">{user?.email}</p>
            </div>
            <div className="text-right">
              <div className="mb-4">
                <p className="text-sm text-gray-500">Invoice Number</p>
                <p className="font-bold text-gray-900">{invoice.invoice_number}</p>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-500">Issue Date</p>
                <p className="font-medium text-gray-900">
                  {new Date(invoice.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Due Date</p>
                <p className="font-medium text-gray-900">
                  {new Date(invoice.due_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="mb-8 overflow-x-auto">
            <table className="w-full min-w-[320px]">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-3 text-sm font-medium text-gray-500 whitespace-nowrap">DESCRIPTION</th>
                  <th className="text-right py-3 text-sm font-medium text-gray-500 whitespace-nowrap">AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items?.map((item, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="py-4 text-gray-900">
                      {item.description}
                      {item.quantity && item.quantity > 1 && (
                        <span className="text-sm text-gray-500"> (x{item.quantity})</span>
                      )}
                    </td>
                    <td className="py-4 text-right text-gray-900 whitespace-nowrap font-semibold">
                      {formatCurrency(item.total || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64">
              <div className="flex justify-between py-2 text-gray-600">
                <span>Subtotal:</span>
                <span>{formatCurrency(invoice.items.reduce((sum, item) => sum + Number(item.total || 0), 0))}</span>
              </div>
              <div className="flex justify-between py-3 border-t-2 border-gray-300 font-bold text-lg">
                <span>Total:</span>
                <span>{formatCurrency(invoice.total_amount)}</span>
              </div>
              {Number(invoice.amount_paid || 0) > 0 && (
                <>
                  <div className="flex justify-between py-2 text-green-600">
                    <span>Paid:</span>
                    <span>-{formatCurrency(invoice.amount_paid)}</span>
                  </div>
                  <div className="flex justify-between py-3 border-t border-gray-300 font-bold text-lg text-red-600">
                    <span>Balance Due:</span>
                    <span>{formatCurrency(invoice.balance)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">NOTES:</h3>
              <p className="text-gray-700 text-sm">{invoice.notes}</p>
            </div>
          )}

          {/* Payment Info */}
          {Number(invoice.balance || 0) > 0 && (
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Payment Instructions:</strong> Click the "Pay with Paystack" button above to make a secure online payment.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Thank you for choosing ICAN Tutorial Centre
          </p>
        </div>
      </div>
    </div>
  );
}
