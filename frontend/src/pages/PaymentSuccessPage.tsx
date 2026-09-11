/**
 * Payment Success Page
 * Shown after successful Paystack payment
 */
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { paymentService } from '../services/paymentService';
import { showToast } from '../lib/toast';

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const reference = searchParams.get('reference') || sessionStorage.getItem('payment_reference');

  useEffect(() => {
    if (!reference) {
      setError('No payment reference found');
      setIsVerifying(false);
      return;
    }

    verifyPayment();
  }, [reference]);

  const verifyPayment = async () => {
    try {
      const result = await paymentService.verifyPayment(reference!);
      setVerificationResult(result);
      
      if (result.status === 'success') {
        showToast.success('Payment successful!');
        // Clear stored reference
        sessionStorage.removeItem('payment_reference');
        sessionStorage.removeItem('invoice_id');
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to verify payment');
    } finally {
      setIsVerifying(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₦${(amount / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Verification Failed</h2>
          <p className="text-center text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/billing')}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Billing
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Payment Successful!</h2>
        <p className="text-center text-gray-600 mb-6">
          Your payment has been processed successfully.
        </p>

        {verificationResult && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Reference</span>
              <span className="font-medium text-gray-900 text-xs break-all">{verificationResult.reference}</span>
            </div>
            {verificationResult.invoice_number && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Invoice</span>
                <span className="font-medium text-gray-900">{verificationResult.invoice_number}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Amount</span>
              <span className="font-medium text-gray-900">{formatCurrency(verificationResult.amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Date</span>
              <span className="font-medium text-gray-900">
                {new Date(verificationResult.transaction_date).toLocaleString()}
              </span>
            </div>
            {verificationResult.already_processed && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-blue-600 text-center">
                  This payment was already processed
                </p>
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => navigate('/billing')}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          View Billing
        </button>
      </div>
    </div>
  );
}
