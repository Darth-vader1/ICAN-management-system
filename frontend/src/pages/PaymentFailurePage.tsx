/**
 * Payment Failure Page
 * Shown after failed Paystack payment
 */
import { useNavigate } from 'react-router-dom';

export default function PaymentFailurePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Payment Failed</h2>
        <p className="text-center text-gray-600 mb-6">
          Your payment could not be processed. Please try again or contact support if the problem persists.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => navigate('/billing')}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
