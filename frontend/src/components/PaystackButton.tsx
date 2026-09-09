/**
 * Paystack Payment Button Component
 * Integrates Paystack inline payment
 */

import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface PaystackButtonProps {
  amount: number;
  email: string;
  invoiceId: string;
  onSuccess: (reference: string) => void;
  onClose?: () => void;
  className?: string;
  disabled?: boolean;
}

declare global {
  interface Window {
    PaystackPop?: {
      setup: (config: {
        key: string;
        email: string;
        amount: number;
        ref: string;
        metadata?: Record<string, unknown>;
        onClose: () => void;
        callback: (response: { reference: string }) => void;
      }) => {
        openIframe: () => void;
      };
    };
  }
}

export default function PaystackButton({
  amount,
  email,
  invoiceId,
  onSuccess,
  onClose,
  className = '',
  disabled = false,
}: PaystackButtonProps) {
  const { user } = useAuth();

  useEffect(() => {
    // Load Paystack inline script
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePayment = () => {
    if (!window.PaystackPop) {
      alert('Payment system is loading. Please try again.');
      return;
    }

    // Generate unique reference
    const reference = `INV-${invoiceId}-${Date.now()}`;

    const handler = window.PaystackPop.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_xxxxxxxxxxxxx', // Replace with your public key
      email,
      amount: amount * 100, // Convert to kobo
      ref: reference,
      metadata: {
        invoice_id: invoiceId,
        user_id: user?.id,
        custom_fields: [
          {
            display_name: 'Invoice ID',
            variable_name: 'invoice_id',
            value: invoiceId,
          },
        ],
      },
      onClose: () => {
        if (onClose) onClose();
      },
      callback: (response) => {
        onSuccess(response.reference);
      },
    });

    handler.openIframe();
  };

  return (
    <button
      onClick={handlePayment}
      disabled={disabled}
      className={`${className} ${
        disabled
          ? 'bg-gray-300 cursor-not-allowed'
          : 'bg-green-600 hover:bg-green-700'
      } text-white px-6 py-2 rounded-lg font-medium transition-colors`}
    >
      Pay with Paystack
    </button>
  );
}
