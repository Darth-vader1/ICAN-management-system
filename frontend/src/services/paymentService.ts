/**
 * Payment Service - Paystack Integration
 */
import { apiClient } from '../lib/api';

export interface PaymentInitializeRequest {
  invoice_id: string;
  amount?: number;
  callback_url?: string;
}

export interface PaymentInitializeResponse {
  success: boolean;
  authorization_url: string;
  access_code: string;
  reference: string;
  amount: number;
  invoice_number: string;
}

export interface PaymentVerifyResponse {
  success: boolean;
  reference: string;
  status: string;
  amount: number;
  currency: string;
  transaction_date: string;
  payment_id?: string;
  payment_status?: string;
}

export const paymentService = {
  /**
   * Initialize a Paystack payment for an invoice
   */
  async initializePayment(data: PaymentInitializeRequest): Promise<PaymentInitializeResponse> {
    const response = await apiClient.post<PaymentInitializeResponse>(
      '/payments/paystack/initialize/',
      data
    );
    return response.data;
  },

  /**
   * Verify a Paystack payment transaction
   */
  async verifyPayment(reference: string): Promise<PaymentVerifyResponse> {
    const response = await apiClient.get<PaymentVerifyResponse>(
      `/payments/paystack/verify/${reference}/`
    );
    return response.data;
  },

  /**
   * Redirect user to Paystack payment page
   */
  redirectToPaystack(authorizationUrl: string): void {
    window.location.href = authorizationUrl;
  },
};

export default paymentService;
