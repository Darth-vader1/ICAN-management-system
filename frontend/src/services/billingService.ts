import apiClient from '../lib/api';
import {
  FeeStructure,
  FeeStructureListItem,
  FeeStructureFormData,
  FeeStructureFilterParams,
  Invoice,
  InvoiceListItem,
  InvoiceFilterParams,
  Payment,
  PaymentListItem,
  PaymentFilterParams,
  ManualPaymentFormData,
  PaymentVerificationData,
  PaymentActionResponse,
  PaymentAllocationFormData,
  Refund,
  RefundFormData,
  FinancialSummary,
  PaystackInitializeRequest,
  PaystackInitializeResponse,
  PaystackVerifyResponse,
} from '../types/billing';

// Fee Structures
export const feeStructureService = {
  async getAll(params?: FeeStructureFilterParams): Promise<FeeStructureListItem[]> {
    const response = await apiClient.get<FeeStructureListItem[]>('/billing/fees/', { params });
    return response.data;
  },

  async getById(id: string): Promise<FeeStructure> {
    const response = await apiClient.get<FeeStructure>(`/billing/fees/${id}/`);
    return response.data;
  },

  async create(data: FeeStructureFormData): Promise<FeeStructure> {
    const response = await apiClient.post<FeeStructure>('/billing/fees/', data);
    return response.data;
  },

  async update(id: string, data: Partial<FeeStructureFormData>): Promise<FeeStructure> {
    const response = await apiClient.patch<FeeStructure>(`/billing/fees/${id}/`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/billing/fees/${id}/`);
  },
};

// Invoices
export const invoiceService = {
  async getAll(params?: InvoiceFilterParams): Promise<InvoiceListItem[]> {
    const response = await apiClient.get<InvoiceListItem[]>('/billing/invoices/', { params });
    return response.data;
  },

  async getMyInvoices(): Promise<Invoice[]> {
    const response = await apiClient.get<Invoice[]>('/billing/invoices/my-invoices/');
    return response.data;
  },

  async getById(id: string): Promise<Invoice> {
    const response = await apiClient.get<Invoice>(`/billing/invoices/${id}/`);
    return response.data;
  },

  async cancel(id: string, reason?: string): Promise<PaymentActionResponse> {
    const response = await apiClient.post<PaymentActionResponse>(
      `/billing/invoices/${id}/cancel/`,
      { reason }
    );
    return response.data;
  },
};

// Payments
export const paymentService = {
  async getAll(params?: PaymentFilterParams): Promise<PaymentListItem[]> {
    const response = await apiClient.get<PaymentListItem[]>('/billing/payments/', { params });
    return response.data;
  },

  async getById(id: string): Promise<Payment> {
    const response = await apiClient.get<Payment>(`/billing/payments/${id}/`);
    return response.data;
  },

  async createManual(data: ManualPaymentFormData): Promise<Payment> {
    const response = await apiClient.post<Payment>('/billing/payments/create_manual/', data);
    return response.data;
  },

  async verify(id: string, data: PaymentVerificationData): Promise<PaymentActionResponse> {
    const response = await apiClient.post<PaymentActionResponse>(
      `/billing/payments/${id}/verify/`,
      data
    );
    return response.data;
  },

  async allocate(
    paymentId: string,
    data: PaymentAllocationFormData
  ): Promise<PaymentActionResponse> {
    const response = await apiClient.post<PaymentActionResponse>(
      `/billing/payments/${paymentId}/allocate/`,
      data
    );
    return response.data;
  },
};

// Refunds
export const refundService = {
  async getAll(): Promise<Refund[]> {
    const response = await apiClient.get<Refund[]>('/billing/refunds/');
    return response.data;
  },

  async getById(id: string): Promise<Refund> {
    const response = await apiClient.get<Refund>(`/billing/refunds/${id}/`);
    return response.data;
  },

  async create(data: RefundFormData): Promise<Refund> {
    const response = await apiClient.post<Refund>('/billing/refunds/', data);
    return response.data;
  },
};

// Financial Profile
export const financialProfileService = {
  async getMyProfile(): Promise<FinancialSummary> {
    const response = await apiClient.get<FinancialSummary>('/billing/financial-profile/me/');
    return response.data;
  },

  async getStudentProfile(studentId: string): Promise<FinancialSummary> {
    const response = await apiClient.get<FinancialSummary>(
      `/billing/financial-profile/${studentId}/`
    );
    return response.data;
  },
};

// Paystack Integration
export const paystackService = {
  async initializePayment(data: PaystackInitializeRequest): Promise<PaystackInitializeResponse> {
    const response = await apiClient.post<PaystackInitializeResponse>(
      '/payments/paystack/initialize/',
      data
    );
    return response.data;
  },

  async verifyPayment(reference: string): Promise<PaystackVerifyResponse> {
    const response = await apiClient.get<PaystackVerifyResponse>(
      `/payments/paystack/verify/${reference}/`
    );
    return response.data;
  },
};

// Export all services
export default {
  feeStructure: feeStructureService,
  invoice: invoiceService,
  payment: paymentService,
  refund: refundService,
  financialProfile: financialProfileService,
  paystack: paystackService,
};
