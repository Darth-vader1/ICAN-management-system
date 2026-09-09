/**
 * Payment Failure Page
 * Shown after failed Paystack payment
 */

import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

export default function PaymentFailurePage() {
  const [searchParams] = useSearchParams();

  const reference = searchParams.get('reference');
  const trxref = searchParams.get('trxref');

  useEffect(() => {
    // This page intentionally renders the failed payment state without mutating local invoice state.
  }, [reference, trxref]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        {/* Failure Icon */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-5xl">❌</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Failed</h1>
          <p className="text-gray-600">Your payment could not be processed</p>
        </div>

        {/* Error Message */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-red-800 mb-2">What happened?</h3>
          <p className="text-sm text-red-700">
            Your payment was not successful. This could be due to:
          </p>
          <ul className="list-disc list-inside text-sm text-red-700 mt-2 space-y-1">
            <li>Insufficient funds</li>
            <li>Incorrect card details</li>
            <li>Payment cancelled</li>
            <li>Network connection issues</li>
            <li>Bank authorization declined</li>
          </ul>
        </div>

        {/* Payment Reference */}
        {(reference || trxref) && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="text-sm text-gray-600">Transaction Reference:</div>
            <div className="font-mono text-sm mt-1">{reference || trxref}</div>
          </div>
        )}

        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">What can you do?</h3>
          <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
            <li>Try paying again with a different payment method</li>
            <li>Check your card details and balance</li>
            <li>Contact your bank if the issue persists</li>
            <li>Reach out to our support team for assistance</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            to="/billing"
            className="block w-full px-4 py-2 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700"
          >
            Try Again - View Invoices
          </Link>
          <Link
            to="/help"
            className="block w-full px-4 py-2 bg-gray-200 text-gray-700 text-center rounded-lg hover:bg-gray-300"
          >
            Contact Support
          </Link>
          <Link
            to="/dashboard"
            className="block w-full px-4 py-2 border border-gray-300 text-gray-700 text-center rounded-lg hover:bg-gray-50"
          >
            Back to Dashboard
          </Link>
        </div>

        {/* Help Text */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Need immediate help? Email us at{' '}
          <a href="mailto:support@ican.edu" className="text-blue-600 hover:underline">
            support@ican.edu
          </a>
        </p>
      </div>
    </div>
  );
}
