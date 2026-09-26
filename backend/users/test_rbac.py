"""
Comprehensive Automated RBAC & Security Test Suite

Tests:
1. Unauthenticated request access controls (Deny by default).
2. Student role isolation & Self-Service permissions.
3. Horizontal Privilege Escalation (IDOR / BOLA) prevention between students.
4. Vertical Privilege Escalation prevention (Student -> Staff / Finance / IT Admin endpoints).
5. Role-based endpoint authorization across Finance, Student Officer, IT Admin, Super Admin.
"""

import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from students.models import StudentProfile
from billing.models import Invoice, Payment
from users.models import Role
from datetime import date, timedelta
User = get_user_model()


def get_client_for_user(user):
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return client


@pytest.mark.django_db
class TestRBACPermissions:

    @pytest.fixture(autouse=True)
    def setup_users(self):
        # Create Users
        self.super_admin = User.objects.create_superuser(
            email="superadmin@ican.edu", password="password123"
        )
        self.it_admin = User.objects.create_user(
            email="itadmin@ican.edu", password="password123", role=Role.IT_ADMIN
        )
        self.manager = User.objects.create_user(
            email="manager@ican.edu", password="password123", role=Role.MANAGER
        )
        self.finance = User.objects.create_user(
            email="finance@ican.edu", password="password123", role=Role.FINANCE
        )
        self.student_officer = User.objects.create_user(
            email="officer@ican.edu", password="password123", role=Role.STUDENT_OFFICER
        )

        # Student A
        self.student_a_user = User.objects.create_user(
            email="student_a@ican.edu", password="password123", role=Role.STUDENT
        )
        self.student_a_profile = StudentProfile.objects.create(
            user=self.student_a_user,
            student_code="STU-00A",
            first_name="Student",
            last_name="Alpha",
            gender="M",
            phone_number="08011111111",
        )

        # Student B
        self.student_b_user = User.objects.create_user(
            email="student_b@ican.edu", password="password123", role=Role.STUDENT
        )
        self.student_b_profile = StudentProfile.objects.create(
            user=self.student_b_user,
            student_code="STU-00B",
            first_name="Student",
            last_name="Beta",
            gender="F",
            phone_number="08022222222",
        )

        from academics.models import AcademicSession, Level
        from enrollments.models import Enrollment

        session, _ = AcademicSession.objects.get_or_create(
            label="2026/2027",
            defaults={
                "start_date": "2026-01-01",
                "end_date": "2026-12-31",
                "is_active": True,
            }
        )
        level, _ = Level.objects.get_or_create(
            code="foundation",
            defaults={"name": "Foundation", "order": 1}
        )

        self.enrollment_a = Enrollment.objects.create(
            student=self.student_a_profile,
            session=session,
            level=level,
            status="draft",
        )
        self.enrollment_b = Enrollment.objects.create(
            student=self.student_b_profile,
            session=session,
            level=level,
            status="draft",
        )

        # Invoices
        self.invoice_a = Invoice.objects.create(
            enrollment=self.enrollment_a,
            student=self.student_a_profile,
            invoice_number="INV-TEST-00A",
            total_amount=100000,
            amount_paid=0,
            status="pending",
            due_date=date.today() + timedelta(days=30), 
        )
        self.invoice_b = Invoice.objects.create(
            enrollment=self.enrollment_b,
            student=self.student_b_profile,
            invoice_number="INV-TEST-00B",
            total_amount=150000,
            amount_paid=0,
            status="pending",
            due_date=date.today() + timedelta(days=30), 
        )

    # -------------------------------------------------------------------------
    # 1. Unauthenticated Requests
    # -------------------------------------------------------------------------
    def test_unauthenticated_requests_denied(self):
        client = APIClient()

        # Try protected endpoints
        res1 = client.get("/api/students/me/")
        assert res1.status_code == status.HTTP_401_UNAUTHORIZED

        res2 = client.get("/api/reports/financial-summary/")
        assert res2.status_code == status.HTTP_401_UNAUTHORIZED

        res3 = client.get("/api/audit/logs/")
        assert res3.status_code == status.HTTP_401_UNAUTHORIZED

        res4 = client.post(
            "/api/auth/staff/provision/",
            {"email": "fake@ican.edu", "password": "pass", "role": "finance"},
        )
        assert res4.status_code == status.HTTP_401_UNAUTHORIZED

    # -------------------------------------------------------------------------
    # 2. Horizontal Privilege Escalation (IDOR / BOLA) Prevention
    # -------------------------------------------------------------------------
    def test_student_cannot_access_other_student_profile(self):
        client_a = get_client_for_user(self.student_a_user)

        # Student A gets own profile
        res_me = client_a.get("/api/students/me/")
        assert res_me.status_code == status.HTTP_200_OK
        assert res_me.data["student_code"] == "STU-00A"

        # Student A tries to get Student B's profile directly by ID
        res_other = client_a.get(f"/api/students/{self.student_b_profile.id}/")
        assert res_other.status_code in [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND,
        ]

    def test_student_cannot_access_other_student_invoices(self):
        client_a = get_client_for_user(self.student_a_user)

        # List invoices: Student A sees only own invoice
        res_list = client_a.get("/api/billing/invoices/")
        assert res_list.status_code == status.HTTP_200_OK
        invoice_ids = [inv["id"] for inv in res_list.data.get("results", res_list.data)]
        assert str(self.invoice_a.id) in invoice_ids
        assert str(self.invoice_b.id) not in invoice_ids

    # -------------------------------------------------------------------------
    # 3. Vertical Privilege Escalation Prevention
    # -------------------------------------------------------------------------
    def test_student_cannot_access_staff_endpoints(self):
        client_a = get_client_for_user(self.student_a_user)

        # Financial summary report
        res_report = client_a.get("/api/reports/financial-summary/")
        assert res_report.status_code == status.HTTP_403_FORBIDDEN

        # Provision staff account
        res_staff = client_a.post(
            "/api/auth/staff/provision/",
            {"email": "attacker@ican.edu", "password": "Password123!", "role": "manager"},
        )
        assert res_staff.status_code == status.HTTP_403_FORBIDDEN

        # Audit logs
        res_audit = client_a.get("/api/audit/logs/")
        assert res_audit.status_code == status.HTTP_403_FORBIDDEN

    # -------------------------------------------------------------------------
    # 4. Finance & IT Admin Role Restrictions
    # -------------------------------------------------------------------------
    def test_finance_staff_access_limits(self):
        client_fin = get_client_for_user(self.finance)

        # Finance can view financial summary report
        res_report = client_fin.get("/api/reports/financial-summary/")
        assert res_report.status_code == status.HTTP_200_OK

        # Finance cannot provision staff accounts (IT Admin / Super Admin only)
        res_prov = client_fin.post(
            "/api/auth/staff/provision/",
            {"email": "newstaff@ican.edu", "password": "Password123!", "role": "manager"},
        )
        assert res_prov.status_code == status.HTTP_403_FORBIDDEN

        # Finance cannot access audit logs
        res_audit = client_fin.get("/api/audit/logs/")
        assert res_audit.status_code == status.HTTP_403_FORBIDDEN

    def test_it_admin_provisioning_and_audit(self):
        client_it = get_client_for_user(self.it_admin)

        # IT Admin can access audit logs
        res_audit = client_it.get("/api/audit/logs/")
        assert res_audit.status_code == status.HTTP_200_OK

        # IT Admin can provision staff accounts
        res_prov = client_it.post(
            "/api/auth/staff/provision/",
            {
                "email": "new_officer@ican.edu",
                "password": "Password123!",
                "role": "student_officer",
                "first_name": "New",
                "last_name": "Officer",
            },
        )
        assert res_prov.status_code == status.HTTP_201_CREATED
