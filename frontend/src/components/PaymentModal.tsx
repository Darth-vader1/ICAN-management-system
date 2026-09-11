/**
 * Payment Modal Component
 * Supports Full Payments, Partial Payments, and Custom Amount selection with Paystack
 */
import React, { useState, useEffect, useMemo } from 'react';
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
  const [selectedAmount, setSelectedAmount] = useState<number>(0);
  const [customInput, setCustomInput] = useState<string>('');

  const balanceDue = useMemo(() => {
    if (!invoice) return 0;
    const bal = typeof invoice.balance === 'number' ? invoice.balance : parseFloat(String(invoice.balance || 0));
    return isNaN(bal) ? 0 : bal;
  }, [invoice]);

  // Preset pill options derived from balance due
  const presetPills = useMemo(() => {
    const pills = [10000, 25000, 50000, 75000].filter((amt) => amt < balanceDue);
    return pills;
  }, [balanceDue]);

  // Set default selected amount to balance due when modal opens
  useEffect(() => {
    if (invoice && balanceDue > 0) {
      setSelectedAmount(balanceDue);
      setCustomInput(String(balanceDue));
    }
  }, [invoice, balanceDue]);

  if (!isOpen || !invoice) return null;

  const handleSelectPreset = (amt: number) => {
    setSelectedAmount(amt);
    setCustomInput(String(amt));
  };

  const handleSelectFullBalance = () => {
    setSelectedAmount(balanceDue);
    setCustomInput(String(balanceDue));
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomInput(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setSelectedAmount(num);
    } else {
      setSelectedAmount(0);
    }
  };

  const isValidAmount = selectedAmount > 0 && selectedAmount <= balanceDue;

  const handlePayment = async () => {
    if (!isValidAmount) {
      showToast.error(`Payment amount must be between ₦1.00 and ₦${balanceDue.toLocaleString('en-NG')}`);
      return;
    }

    setIsProcessing(true);

    try {
      const callbackUrl = `${window.location.origin}/payment/success`;
      
      const response = await paymentService.initializePayment({
        invoice_id: invoice.id,
        amount: selectedAmount,
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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6 space-y-4 sm:space-y-5 max-h-[90vh] overflow-y-auto min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Make Payment</h3>
            <p className="text-xs text-slate-500 font-medium">Select full or partial payment amount</p>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Invoice Summary Card */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 text-xs font-medium space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Invoice Number</span>
            <span className="font-bold text-slate-900 font-mono">{invoice.invoice_number}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Total Invoice Fee</span>
            <span className="font-semibold text-slate-900">{formatCurrency(invoice.total_amount)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Already Paid</span>
            <span className="font-semibold text-emerald-600">
              {formatCurrency((invoice as any).amount_paid ?? (invoice as any).paid_amount ?? 0)}
            </span>
          </div>
          <div className="h-px bg-slate-200 my-1"></div>
          <div className="flex justify-between items-center text-sm">
            <span className="font-bold text-slate-900">Outstanding Balance</span>
            <span className="font-bold text-rose-600">{formatCurrency(balanceDue)}</span>
          </div>
        </div>

        {/* Partial Payment Amount Selection */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Amount to Pay (₦)
          </label>

          {/* Quick Preset Pills */}
          <div className="flex flex-wrap gap-2">
            {presetPills.map((pillAmt) => (
              <button
                key={pillAmt}
                type="button"
                onClick={() => handleSelectPreset(pillAmt)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                  selectedAmount === pillAmt
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                ₦{pillAmt.toLocaleString('en-NG')}
              </button>
            ))}
            <button
              type="button"
              onClick={handleSelectFullBalance}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                selectedAmount === balanceDue
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
              }`}
            >
              Pay Full Balance (₦{balanceDue.toLocaleString('en-NG')})
            </button>
          </div>

          {/* Custom Input */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">₦</span>
            <input
              type="number"
              min={1}
              max={balanceDue}
              step="any"
              value={customInput}
              onChange={handleCustomInputChange}
              placeholder="Enter custom amount..."
              className={`w-full pl-8 pr-4 py-2.5 bg-slate-50 border rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 ${
                !isValidAmount && selectedAmount > 0
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-slate-300 focus:ring-slate-900/10'
              }`}
            />
          </div>

          {/* Validation Feedback */}
          {selectedAmount > balanceDue && (
            <p className="text-xs text-rose-600 font-semibold flex items-center gap-1">
              <span>⚠️ Amount cannot exceed outstanding balance ({formatCurrency(balanceDue)})</span>
            </p>
          )}
          {selectedAmount <= 0 && customInput !== '' && (
            <p className="text-xs text-rose-600 font-semibold">⚠️ Amount must be greater than ₦0</p>
          )}
        </div>

        {/* Security Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2 text-xs text-blue-900">
          <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>
            Payments are securely processed via Paystack. Your financial balance is verified independently on the server.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePayment}
            disabled={isProcessing || !isValidAmount}
            className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Initializing...
              </>
            ) : (
              <>
                Pay {formatCurrency(selectedAmount)}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
