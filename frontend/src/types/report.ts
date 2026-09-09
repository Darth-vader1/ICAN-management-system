/**
 * Report types for ICAN Platform
 * Phase 8: Reporting System
 */

export type ReportFormat = 'json' | 'csv' | 'excel' | 'pdf';

export interface FinancialSummary {
  period: {
    start_date: string;
    end_date: string;
  };
  overview: {
    total_invoiced: number;
    total_paid: number;
    total_outstanding: number;
    collection_rate: number;
  };
  payment_methods: Array<{
    method: string;
    total: number;
    count: number;
  }>;
  invoice_status: Array<{
    status: string;
    count: number;
    total: number;
  }>;
}

export interface StudentReport {
  student: {
    id: string;
    name: string;
    student_id: string;
    email: string;
    phone: string;
  };
  enrollments: {
    total: number;
    active: number;
    details: Array<{
      session: string;
      level: string;
      status: string;
      courses: string[];
    }>;
  };
  attendance: {
    total_sessions: number;
    present: number;
    late: number;
    absent: number;
    attendance_rate: number;
  };
  financial: {
    total_invoiced: number;
    total_paid: number;
    balance: number;
  };
}

export interface AttendanceReportSession {
  date: string;
  course: string;
  title: string;
  status: string;
  total_students: number;
  present: number;
  absent: number;
  late: number;
  attendance_rate: number;
}

export interface AttendanceReport {
  period: {
    start_date: string;
    end_date: string;
  };
  summary: {
    total_sessions: number;
    completed_sessions: number;
    average_attendance_rate: number;
  };
  sessions: AttendanceReportSession[];
}

export interface PaymentDetail {
  date: string;
  reference: string;
  student: string;
  student_id: string;
  amount: number;
  method: string;
  invoice: string;
}

export interface PaymentReport {
  period: {
    start_date: string;
    end_date: string;
  };
  summary: {
    total_payments: number;
    total_amount: number;
    average_payment: number;
  };
  payments: PaymentDetail[];
}

export interface EnrollmentDetail {
  student: string;
  student_id: string;
  session: string;
  level: string;
  status: string;
  enrolled_date: string;
}

export interface EnrollmentReport {
  summary: {
    total_enrollments: number;
    active_enrollments: number;
  };
  by_level: Array<{
    level__name: string;
    count: number;
  }>;
  by_status: Array<{
    status: string;
    count: number;
  }>;
  enrollments: EnrollmentDetail[];
}

export interface ReportParams {
  start_date?: string;
  end_date?: string;
  format?: ReportFormat;
  [key: string]: any;
}
