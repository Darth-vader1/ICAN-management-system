/**
 * ManualPaymentForm Component
 * Form for recording manual payments (cash, bank transfer, POS)
 * Features: Receipt upload, payment method selection, amount validation
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileUpload } from './FileUpload';
import { Info } from 'lucide-react';

const manualPaymentSchema = z.object({
  student_id: z.number().positive('Student is required'),
  amount: z.string()
    .min(1, 'Amount is required')
    .regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount format'),
  payment_method: z.enum(['cash', 'bank_transfer', 'pos', 'cheque'], {
    required_error: 'Payment method is required',
  }),
  reference_number: z.string().optional(),
  payment_date: z.string().min(1, 'Payment date is required'),
  notes: z.string().optional(),
});

type ManualPaymentFormData = z.infer<typeof manualPaymentSchema>;

interface ManualPaymentFormProps {
  studentId?: number;
  onSubmit: (data: ManualPaymentFormData & { receipt?: File }) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  onCancel?: () => void;
}

export function ManualPaymentForm({
  studentId,
  onSubmit,
  isLoading = false,
  error,
  onCancel
}: ManualPaymentFormProps) {
  const [receipt, setReceipt] = useState<File | null>(null);

  const [displayAmount, setDisplayAmount] = useState('');

  const formatNumberWithCommas = (val: string) => {
    const cleanVal = val.replace(/[^0-9.]/g, '');
    const parts = cleanVal.split('.');
    if (parts.length > 2) {
      parts[1] = parts.slice(1).join('');
    }
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  const getUnformattedValue = (val: string) => {
    return val.replace(/,/g, '');
  };

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    watch,
  } = useForm<ManualPaymentFormData>({
    resolver: zodResolver(manualPaymentSchema),
    defaultValues: {
      student_id: studentId,
      payment_date: new Date().toISOString().split('T')[0],
    },
  });

  const paymentMethod = watch('payment_method');
  const currentAmount = watch('amount');

  const handleFormSubmit = async (data: ManualPaymentFormData) => {
    await onSubmit({
      ...data,
      ...(receipt && { receipt })
    });
  };

  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'pos', label: 'POS/Card' },
    { value: 'cheque', label: 'Cheque' },
  ];

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Student ID (hidden if pre-filled) */}
      {!studentId && (
        <div className="space-y-2">
          <Label htmlFor="student_id">Student ID *</Label>
          <Input
            id="student_id"
            type="number"
            {...register('student_id', { valueAsNumber: true })}
            disabled={isLoading}
            placeholder="Enter student ID"
          />
          {errors.student_id && (
            <p className="text-sm text-red-600">{errors.student_id.message}</p>
          )}
        </div>
      )}

      {/* Payment Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="amount">Amount (₦) *</Label>
            {currentAmount && !isNaN(parseFloat(currentAmount)) && (
              <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono">
                ₦{parseFloat(currentAmount).toLocaleString('en-NG')}
              </span>
            )}
          </div>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold text-sm">
              ₦
            </span>
            <Input
              id="amount"
              type="text"
              disabled={isLoading}
              placeholder="e.g. 50,000"
              value={displayAmount}
              onChange={(e) => {
                const formatted = formatNumberWithCommas(e.target.value);
                const numeric = getUnformattedValue(formatted);
                setDisplayAmount(formatted);
                setValue('amount', numeric, { shouldValidate: true });
              }}
              className="pl-8 font-mono text-sm font-semibold"
            />
          </div>

          {/* Quick Select Presets */}
          <div className="flex items-center gap-1.5 pt-1">
            <span className="text-[11px] text-slate-400 font-medium mr-1">Quick Select:</span>
            {[5000, 10000, 25000, 50000, 100000].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  const str = preset.toString();
                  const formatted = formatNumberWithCommas(str);
                  setDisplayAmount(formatted);
                  setValue('amount', str, { shouldValidate: true });
                }}
                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded transition-colors cursor-pointer"
              >
                +₦{preset >= 1000 ? `${(preset / 1000).toFixed(0)}k` : preset}
              </button>
            ))}
          </div>

          {errors.amount && (
            <p className="text-sm text-red-600">{errors.amount.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="payment_date">Payment Date *</Label>
          <Input
            id="payment_date"
            type="date"
            {...register('payment_date')}
            disabled={isLoading}
          />
          {errors.payment_date && (
            <p className="text-sm text-red-600">{errors.payment_date.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="payment_method">Payment Method *</Label>
        <Select
          id="payment_method"
          {...register('payment_method')}
          disabled={isLoading}
        >
          <option value="">Select payment method</option>
          {paymentMethods.map((method) => (
            <option key={method.value} value={method.value}>
              {method.label}
            </option>
          ))}
        </Select>
        {errors.payment_method && (
          <p className="text-sm text-red-600">{errors.payment_method.message}</p>
        )}
      </div>

      {/* Reference Number (conditional based on payment method) */}
      {(paymentMethod === 'bank_transfer' || paymentMethod === 'cheque') && (
        <div className="space-y-2">
          <Label htmlFor="reference_number">
            {paymentMethod === 'bank_transfer' ? 'Transfer Reference' : 'Cheque Number'}
          </Label>
          <Input
            id="reference_number"
            {...register('reference_number')}
            disabled={isLoading}
            placeholder={paymentMethod === 'bank_transfer' ? 'e.g., TRF/12345678' : 'e.g., CHQ001234'}
          />
          {errors.reference_number && (
            <p className="text-sm text-red-600">{errors.reference_number.message}</p>
          )}
        </div>
      )}

      {/* Receipt Upload */}
      <FileUpload
        label="Receipt/Proof of Payment (Optional)"
        accept="image/*,.pdf"
        maxSize={5 * 1024 * 1024} // 5MB
        onFileSelect={setReceipt}
        onRemove={() => setReceipt(null)}
        currentFile={receipt}
        disabled={isLoading}
        description="Upload receipt image or PDF"
      />

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          {...register('notes')}
          disabled={isLoading}
          placeholder="Add any additional notes about this payment..."
          rows={3}
        />
        {errors.notes && (
          <p className="text-sm text-red-600">{errors.notes.message}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Recording Payment...' : 'Record Payment'}
        </Button>
      </div>

      {/* Info box */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2.5">
        <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">
          This payment will be recorded and can be allocated to invoices later.
          {paymentMethod === 'bank_transfer' && ' Please verify the bank transfer details before recording.'}
          {paymentMethod === 'cash' && ' Ensure cash is deposited securely.'}
        </p>
      </div>
    </form>
  );
}
