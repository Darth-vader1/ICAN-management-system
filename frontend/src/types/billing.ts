// Billing entity types for ICAN Platform

export type FeeType = 'registration' | 'course' | 'materials' | 'exam' | 'other';

export type InvoiceStatus = 'draft' | 'pending' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';

export type PaymentMethod = 'paystack' | 'bank_transfer' | 'cash' | 'pos';

export type PaymentStatus = 'pending' | 'successful' | 'failed' | 'reversed' | 'refunded';

// Fee Structure
export interface FeeStructure {
  id: string;
  level: string | null;
  level_name: string | null;
  course: string | null;
  course_code: string | null;
  course_name: string | null;
  session: string;
  session_label: string;
  fee_type: FeeType;
  fee_type_display: string;
  description: string;
  amount: string;
  currency: string;
  effective_from: string;
  effective_to: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LevelTierPricing {
  id: string;
  level: string;
  level_name?: string;
  session?: string | null;
  session_label?: string | null;
  course_count: number;
  amount: string;
  currency: string;
  is_active: boolean;
}

export interface FeeStructureListItem {
  id: string;
  description: string;
  amount: string;
  currency: string;
  fee_type_display: string;
  level_name: string | null;
  course_code: string | null;
  session_label: string;
  is_active: boolean;
}

// Invoice Item
export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: string;
  total: string;
  fee_structure: string | null;
  created_at: string;
}

// Payment Allocation
export interface PaymentAllocation {
  id: string;
  payment: string;
  invoice: string;
  invoice_number: string;
  payment_reference: string;
  amount_allocated: string;
  allocated_at: string;
  allocated_by: string | null;
  allocated_by_email: string | null;
  notes: string;
}

// Invoice
export interface Invoice {
  id: string;
  invoice_number: string;
  enrollment: string;
  student: string;
  student_name: string;
  student_code: string;
  enrollment_level: string;
  enrollment_session: string;
  total_amount: string;
  amount_paid: string;
  balance: string;
  status: InvoiceStatus;
  status_display: string;
  due_date: string;
  notes: string;
  items: InvoiceItem[];
  payment_allocations: PaymentAllocation[];
  created_at: string;
  updated_at: string;
}

export interface InvoiceListItem {
  id: string;
  invoice_number: string;
  student_name: string;
  student_code: string;
  total_amount: string;
  amount_paid: string;
  balance: string;
  status: InvoiceStatus;
  status_display: string;
  due_date: string;
  created_at: string;
}

// Payment
export interface Payment {
  id: string;
  student: string;
  student_name: string;
  student_code: string;
  invoice: string | null;
  invoice_number: string | null;
  amount: string;
  currency: string;
  method: PaymentMethod;
  method_display: string;
  provider: string;
  provider_reference: string;
  status: PaymentStatus;
  status_display: string;
  transaction_date: string;
  verified_at: string | null;
  verified_by: string | null;
  verified_by_email: string | null;
  metadata: Record<string, any>;
  receipt_upload_url: string;
  notes: string;
  allocations: PaymentAllocation[];
  created_at: string;
  updated_at: string;
}

export interface PaymentListItem {
  id: string;
  student_name: string;
  amount: string;
  currency: string;
  method?: PaymentMethod;
  method_display: string;
  status: PaymentStatus;
  status_display: string;
  transaction_date: string;
  provider_reference: string;
  verified_by?: string | null;
  verified_by_name?: string | null;
}

// Refund
export interface Refund {
  id: string;
  payment: string;
  payment_reference: string;
  payment_amount: string;
  amount: string;
  reason: string;
  processed_by: string | null;
  processed_by_email: string | null;
  processed_at: string;
  notes: string;
  metadata: Record<string, any>;
}

// Financial Summary
export interface FinancialSummary {
  total_invoiced: string;
  total_paid: string;
  total_balance: string;
  invoice_count: number;
  status_counts: {
    pending: number;
    partially_paid: number;
    paid: number;
    overdue: number;
  };
  invoices: InvoiceListItem[];
}

// Form Data Types

export interface FeeStructureFormData {
  session: string;
  level?: string;
  course?: string;
  fee_type: FeeType;
  description: string;
  amount: number | string;
  currency?: string;
  effective_from: string;
  effective_to?: string;
  is_active?: boolean;
}

export interface ManualPaymentFormData {
  student: string;
  invoice?: string;
  amount: number | string;
  currency?: string;
  method: Exclude<PaymentMethod, 'paystack'>;
  transaction_date?: string;
  receipt_upload_url?: string;
  notes?: string;
}

export interface PaymentVerificationData {
  verify: boolean;
  notes?: string;
}

export interface PaymentAllocationFormData {
  payment: string;
  invoice: string;
  amount?: number | string;
  notes?: string;
}

export interface RefundFormData {
  payment: string;
  amount: number | string;
  reason: string;
  notes?: string;
}

// Paystack Types

export interface PaystackInitializeRequest {
  invoice_id: string;
  callback_url?: string;
}

export interface PaystackInitializeResponse {
  success: boolean;
  authorization_url: string;
  access_code: string;
  reference: string;
  amount: number;
  invoice_number: string;
}

export interface PaystackVerifyResponse {
  success: boolean;
  reference: string;
  status: string;
  amount: number;
  currency: string;
  transaction_date: string;
  payment_id?: string;
  payment_status?: PaymentStatus;
}

// Filter Params

export interface InvoiceFilterParams {
  student?: string;
  status?: InvoiceStatus;
  session?: string;
}

export interface PaymentFilterParams {
  student?: string;
  status?: PaymentStatus;
  method?: PaymentMethod;
}

export interface FeeStructureFilterParams {
  session?: string;
  level?: string;
  course?: string;
  fee_type?: FeeType;
  is_active?: boolean;
}

// API Response Types

export interface PaymentActionResponse {
  success: boolean;
  message: string;
  payment?: Payment;
  allocation?: PaymentAllocation;
}
