import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../lib/queryKeys';
import { showToast } from '../../lib/toast';
import { getErrorMessage } from '../../lib/api';
import {
  feeStructureService,
  invoiceService,
  paymentService,
  refundService,
  financialProfileService,
  paystackService,
} from '../../services/billingService';
import type {
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
} from '../../types/billing';

export function useFeeStructures(filters?: FeeStructureFilterParams) {
  return useQuery({
    queryKey: QUERY_KEYS.billing.fees.list(filters),
    queryFn: () => feeStructureService.getAll(filters),
    staleTime: 5 * 60 * 1000,
    placeholderData: [],
    throwOnError: false,
  });
}

export function useFeeStructure(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: QUERY_KEYS.billing.fees.detail(id),
    queryFn: () => feeStructureService.getById(id),
    staleTime: 5 * 60 * 1000,
    enabled: enabled && Boolean(id),
    throwOnError: false,
  });
}

interface CreateFeeStructureVariables {
  data: FeeStructureFormData;
}

export function useCreateFeeStructure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data }: CreateFeeStructureVariables) => feeStructureService.create(data),
    onSuccess: (newFeeStructure) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.billing.fees.list() });
      queryClient.setQueryData(QUERY_KEYS.billing.fees.detail(newFeeStructure.id), newFeeStructure);
      showToast.success('Fee structure created successfully');
    },
    onError: (error) => {
      showToast.error(getErrorMessage(error));
    },
  });
}

interface UpdateFeeStructureVariables {
  id: string;
  data: Partial<FeeStructureFormData>;
}

export function useUpdateFeeStructure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: UpdateFeeStructureVariables) => feeStructureService.update(id, data),
    onSuccess: (updatedFeeStructure) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.billing.fees.list() });
      queryClient.setQueryData(QUERY_KEYS.billing.fees.detail(updatedFeeStructure.id), updatedFeeStructure);
      showToast.success('Fee structure updated successfully');
    },
    onError: (error) => {
      showToast.error(getErrorMessage(error));
    },
  });
}

interface DeleteFeeStructureVariables {
  id: string;
}

export function useDeleteFeeStructure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: DeleteFeeStructureVariables) => feeStructureService.delete(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.billing.fees.list() });
      queryClient.removeQueries({ queryKey: QUERY_KEYS.billing.fees.detail(variables.id) });
      showToast.success('Fee structure deleted successfully');
    },
    onError: (error) => {
      showToast.error(getErrorMessage(error));
    },
  });
}

export function useInvoices(filters?: InvoiceFilterParams) {
  return useQuery({
    queryKey: QUERY_KEYS.billing.invoices.list(filters),
    queryFn: () => invoiceService.getAll(filters),
    staleTime: 5 * 60 * 1000,
    placeholderData: [],
    throwOnError: false,
  });
}

export function useInvoice(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: QUERY_KEYS.billing.invoices.detail(id),
    queryFn: () => invoiceService.getById(id),
    staleTime: 5 * 60 * 1000,
    enabled: enabled && Boolean(id),
    throwOnError: false,
  });
}

interface MyInvoicesFilters {
  [key: string]: unknown;
}

export function useMyInvoices(filters?: MyInvoicesFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.billing.invoices.myInvoices(filters),
    queryFn: () => invoiceService.getMyInvoices(),
    staleTime: 5 * 60 * 1000,
    placeholderData: [],
    throwOnError: false,
  });
}

export function usePayments(filters?: PaymentFilterParams) {
  return useQuery({
    queryKey: QUERY_KEYS.billing.payments.list(filters),
    queryFn: () => paymentService.getAll(filters),
    staleTime: 5 * 60 * 1000,
    placeholderData: [],
    throwOnError: false,
  });
}

export function usePayment(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: QUERY_KEYS.billing.payments.detail(id),
    queryFn: () => paymentService.getById(id),
    staleTime: 5 * 60 * 1000,
    enabled: enabled && Boolean(id),
    throwOnError: false,
  });
}

interface MyPaymentsFilters {
  [key: string]: unknown;
}

export function useMyPayments(filters?: MyPaymentsFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.billing.payments.myPayments(filters),
    queryFn: async () => {
      const data = await paymentService.getAll();
      return data;
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: [],
    throwOnError: false,
  });
}

interface CreateManualPaymentVariables {
  data: ManualPaymentFormData;
}

export function useCreateManualPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data }: CreateManualPaymentVariables) => paymentService.createManual(data),
    onSuccess: (newPayment) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.billing.payments.list() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.billing.invoices.list() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.billing.financialSummary() });
      queryClient.setQueryData(QUERY_KEYS.billing.payments.detail(newPayment.id), newPayment);
      showToast.success('Manual payment created successfully');
    },
    onError: (error) => {
      showToast.error(getErrorMessage(error));
    },
  });
}

interface VerifyPaymentVariables {
  id: string;
  data: PaymentVerificationData;
}

export function useVerifyPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: VerifyPaymentVariables) => paymentService.verify(id, data),
    onSuccess: (response: PaymentActionResponse, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.billing.payments.list() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.billing.payments.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.billing.invoices.list() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.billing.financialSummary() });
      showToast.success(response.message || 'Payment verified successfully');
    },
    onError: (error) => {
      showToast.error(getErrorMessage(error));
    },
  });
}

interface AllocatePaymentVariables {
  paymentId: string;
  data: PaymentAllocationFormData;
}

export function useAllocatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ paymentId, data }: AllocatePaymentVariables) =>
      paymentService.allocate(paymentId, data),
    onSuccess: (response: PaymentActionResponse, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.billing.payments.list() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.billing.payments.detail(variables.paymentId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.billing.invoices.list() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.billing.financialSummary() });
      showToast.success(response.message || 'Payment allocated successfully');
    },
    onError: (error) => {
      showToast.error(getErrorMessage(error));
    },
  });
}

interface RefundsFilters {
  [key: string]: unknown;
}

export function useRefunds(filters?: RefundsFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.billing.refunds.list(filters),
    queryFn: () => refundService.getAll(),
    staleTime: 5 * 60 * 1000,
    placeholderData: [],
    throwOnError: false,
  });
}

interface CreateRefundVariables {
  data: RefundFormData;
}

export function useCreateRefund() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data }: CreateRefundVariables) => refundService.create(data),
    onSuccess: (newRefund) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.billing.refunds.list() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.billing.payments.list() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.billing.financialSummary() });
      showToast.success('Refund created successfully');
    },
    onError: (error) => {
      showToast.error(getErrorMessage(error));
    },
  });
}

interface FinancialSummaryFilters {
  [key: string]: unknown;
}

export function useFinancialSummary(filters?: FinancialSummaryFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.billing.financialSummary(filters),
    queryFn: () => financialProfileService.getMyProfile(),
    staleTime: 5 * 60 * 1000,
    throwOnError: false,
  });
}

export function useStudentFinancialProfile(studentId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: QUERY_KEYS.billing.studentFinancialProfile(studentId),
    queryFn: () => financialProfileService.getStudentProfile(studentId),
    staleTime: 5 * 60 * 1000,
    enabled: enabled && Boolean(studentId),
    throwOnError: false,
  });
}

export function useInitializePaystack() {
  return useMutation({
    mutationFn: (data: PaystackInitializeRequest) => paystackService.initializePayment(data),
    onError: (error) => {
      showToast.error(getErrorMessage(error));
    },
  });
}

interface VerifyPaystackVariables {
  reference: string;
}

export function useVerifyPaystack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reference }: VerifyPaystackVariables) => paystackService.verifyPayment(reference),
    onSuccess: (response: PaystackVerifyResponse) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.billing.payments.list() });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.billing.invoices.list() });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.billing.financialSummary() });
        showToast.success('Payment verified successfully');
      } else {
        showToast.error('Payment verification failed');
      }
    },
    onError: (error) => {
      showToast.error(getErrorMessage(error));
    },
  });
}
