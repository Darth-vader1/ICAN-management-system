/**
 * MSW (Mock Service Worker) Handlers
 * Mock API responses for testing and development
 */

import { http, HttpResponse } from 'msw';

const API_URL = 'http://localhost:8000/api';

export const handlers = [
  // ============================================================================
  // Authentication Endpoints
  // ============================================================================
  
  // Login
  http.post(`${API_URL}/auth/login/`, async ({ request }) => {
    const body = await request.json() as any;
    
    if (body.email === 'admin@example.com' && body.password === 'password123') {
      return HttpResponse.json({
        access: 'mock_access_token',
        refresh: 'mock_refresh_token',
        user: {
          id: 1,
          email: 'admin@example.com',
          first_name: 'Admin',
          last_name: 'User',
          role: 'super_admin',
        },
      });
    }
    
    return HttpResponse.json(
      { detail: 'Invalid credentials' },
      { status: 401 }
    );
  }),

  // Register
  http.post(`${API_URL}/auth/register/`, async ({ request }) => {
    const body = await request.json() as any;
    
    return HttpResponse.json({
      id: 100,
      email: body.email,
      first_name: body.first_name,
      last_name: body.last_name,
      role: 'student',
    }, { status: 201 });
  }),

  // Token Refresh
  http.post(`${API_URL}/auth/token/refresh/`, () => {
    return HttpResponse.json({
      access: 'new_mock_access_token',
    });
  }),

  // Password Reset Request
  http.post(`${API_URL}/auth/password-reset/`, () => {
    return HttpResponse.json({
      detail: 'Password reset email sent',
    });
  }),

  // Password Reset Confirm
  http.post(`${API_URL}/auth/password-reset/confirm/`, () => {
    return HttpResponse.json({
      detail: 'Password reset successful',
    });
  }),

  // ============================================================================
  // Students Endpoints
  // ============================================================================
  
  http.get(`${API_URL}/students/`, () => {
    return HttpResponse.json({
      count: 3,
      results: [
        {
          id: 1,
          email: 'student1@example.com',
          first_name: 'John',
          last_name: 'Doe',
          phone_number: '+2348012345678',
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 2,
          email: 'student2@example.com',
          first_name: 'Jane',
          last_name: 'Smith',
          phone_number: '+2348087654321',
          status: 'active',
          created_at: '2024-01-02T00:00:00Z',
        },
        {
          id: 3,
          email: 'student3@example.com',
          first_name: 'Bob',
          last_name: 'Johnson',
          phone_number: '+2348011111111',
          status: 'inactive',
          created_at: '2024-01-03T00:00:00Z',
        },
      ],
    });
  }),

  http.get(`${API_URL}/students/:id/`, ({ params }) => {
    const { id } = params;
    return HttpResponse.json({
      id: Number(id),
      email: 'student1@example.com',
      first_name: 'John',
      last_name: 'Doe',
      phone_number: '+2348012345678',
      status: 'active',
      created_at: '2024-01-01T00:00:00Z',
    });
  }),

  // ============================================================================
  // Enrollments Endpoints
  // ============================================================================
  
  http.get(`${API_URL}/enrollments/`, () => {
    return HttpResponse.json({
      count: 2,
      results: [
        {
          id: 1,
          student: 1,
          session: 1,
          level: 1,
          status: 'active',
          created_at: '2024-01-15T00:00:00Z',
        },
        {
          id: 2,
          student: 1,
          session: 2,
          level: 2,
          status: 'draft',
          created_at: '2024-02-01T00:00:00Z',
        },
      ],
    });
  }),

  http.post(`${API_URL}/enrollments/`, () => {
    return HttpResponse.json({
      id: 3,
      student: 1,
      session: 1,
      level: 1,
      status: 'draft',
      created_at: new Date().toISOString(),
    }, { status: 201 });
  }),

  // ============================================================================
  // Billing Endpoints
  // ============================================================================
  
  http.get(`${API_URL}/billing/invoices/`, () => {
    return HttpResponse.json({
      count: 2,
      results: [
        {
          id: 1,
          student: 1,
          enrollment: 1,
          invoice_number: 'INV-2024-001',
          amount: 50000.00,
          amount_paid: 30000.00,
          balance: 20000.00,
          status: 'partially_paid',
          due_date: '2024-12-31',
          created_at: '2024-01-15T00:00:00Z',
        },
        {
          id: 2,
          student: 1,
          enrollment: 2,
          invoice_number: 'INV-2024-002',
          amount: 60000.00,
          amount_paid: 60000.00,
          balance: 0.00,
          status: 'paid',
          due_date: '2024-06-30',
          created_at: '2024-02-01T00:00:00Z',
        },
      ],
    });
  }),

  http.get(`${API_URL}/billing/payments/`, () => {
    return HttpResponse.json({
      count: 2,
      results: [
        {
          id: 1,
          student: 1,
          amount: 30000.00,
          payment_method: 'paystack',
          reference: 'PAY-2024-001',
          status: 'completed',
          created_at: '2024-01-20T00:00:00Z',
        },
        {
          id: 2,
          student: 1,
          amount: 60000.00,
          payment_method: 'bank_transfer',
          reference: 'TRF-2024-001',
          status: 'completed',
          created_at: '2024-02-05T00:00:00Z',
        },
      ],
    });
  }),

  // ============================================================================
  // Academics Endpoints
  // ============================================================================
  
  http.get(`${API_URL}/academics/sessions/`, () => {
    return HttpResponse.json({
      count: 2,
      results: [
        {
          id: 1,
          name: '2024 Session',
          start_date: '2024-01-01',
          end_date: '2024-12-31',
          is_active: true,
        },
        {
          id: 2,
          name: '2025 Session',
          start_date: '2025-01-01',
          end_date: '2025-12-31',
          is_active: false,
        },
      ],
    });
  }),

  http.get(`${API_URL}/academics/levels/`, () => {
    return HttpResponse.json({
      count: 3,
      results: [
        { id: 1, name: 'Foundation', code: 'FOUND', order: 1 },
        { id: 2, name: 'Intermediate', code: 'INTER', order: 2 },
        { id: 3, name: 'Professional', code: 'PROF', order: 3 },
      ],
    });
  }),

  http.get(`${API_URL}/academics/courses/`, () => {
    return HttpResponse.json({
      count: 3,
      results: [
        {
          id: 1,
          code: 'ACC101',
          name: 'Financial Accounting',
          level: 1,
          credits: 3,
        },
        {
          id: 2,
          code: 'TAX201',
          name: 'Taxation',
          level: 2,
          credits: 4,
        },
        {
          id: 3,
          code: 'AUD301',
          name: 'Audit & Assurance',
          level: 3,
          credits: 4,
        },
      ],
    });
  }),

  // ============================================================================
  // Attendance Endpoints
  // ============================================================================
  
  http.get(`${API_URL}/attendance/my-attendance/`, () => {
    return HttpResponse.json({
      total_sessions: 40,
      present: 35,
      absent: 3,
      late: 2,
      excused: 0,
      attendance_rate: 87.5,
    });
  }),

  // ============================================================================
  // Reports Endpoints
  // ============================================================================
  
  http.get(`${API_URL}/reports/financial-summary/`, () => {
    return HttpResponse.json({
      total_invoiced: 5000000.00,
      total_paid: 4200000.00,
      total_pending: 600000.00,
      total_overdue: 200000.00,
      collection_rate: 84.0,
    });
  }),

  // ============================================================================
  // Error Scenarios (for testing error handling)
  // ============================================================================
  
  // Simulate 500 error
  http.get(`${API_URL}/error/500`, () => {
    return HttpResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }),

  // Simulate 403 error
  http.get(`${API_URL}/error/403`, () => {
    return HttpResponse.json(
      { detail: 'Permission denied' },
      { status: 403 }
    );
  }),

  // Simulate network error
  http.get(`${API_URL}/error/network`, () => {
    return HttpResponse.error();
  }),
];
