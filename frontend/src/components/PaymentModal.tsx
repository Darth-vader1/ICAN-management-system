/**
 * Payment Modal Component
 * Handles Paystack payment initialization
 */
import { useState } from 'react';
import { paymentService } from '../services/paymentService';
import { showToast } from '../lib/toast';
import type { InvoiceListItem } from '../types/billing';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceListItem | null;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, invoice }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !invoice) return null;

  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      const callbackUrl = `${window.location.origin}/payment/success`;
      
      const response = await paymentService.initializePayment({
        invoice_id: invoice.id,
        callback_url: callbackUrl,
      });

      // Store reference in sessionStorage for verification later
      sessionStorage.setItem('payment_reference', response.reference);
      sessionStorage.setItem('invoice_id', invoice.id);

      // Redirect to Paystack
      paymentService.redirectToPaystack(response.authorization_url);
    } catch (error: any) {
      showToast.error(error?.response?.data?.detail || 'Failed to initialize payment');
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount?: number | string | null) => {
    const num = typeof amount === 'number' ? amount : parseFloat(String(amount || '0'));
    const validNum = isNaN(num) ? 0 : num;
    return `₦${validNum.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Make Payment</h3>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Invoice Number</span>
              <span className="text-sm font-medium text-gray-900">{invoice.invoice_number}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Total Amount</span>
              <span className="text-sm font-medium text-gray-900">{formatCurrency(invoice.total_amount)}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Paid</span>
              <span className="text-sm font-medium text-green-600">
                {formatCurrency((invoice as any).amount_paid ?? (invoice as any).paid_amount ?? 0)}
              </span>
            </div>
            <div className="h-px bg-gray-200 my-2"></div>
            <div className="flex justify-between items-center">
              <span className="text-base font-semibold text-gray-900">Balance Due</span>
              <span className="text-lg font-bold text-red-600">{formatCurrency(invoice.balance)}</span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-xs text-blue-800">
                <p className="font-medium mb-1">Payment via Paystack</p>
                <p>You will be redirected to Paystack's secure payment page. Use test card <strong>4084084084084081</strong> for testing.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handlePayment}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Pay {formatCurrency(invoice.balance)}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
