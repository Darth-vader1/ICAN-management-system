from decimal import Decimal
from django.test import TestCase
from django.utils import timezone
from users.models import User
from students.models import StudentProfile
from academics.models import AcademicSession, Level, Course, CourseOffering
from enrollments.models import Enrollment, EnrollmentCourse
from billing.models import LevelTierPricing, Invoice, FeeType
from billing.services import InvoiceService


class LevelTierPricingServiceTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='student_tier_test@example.com',
            password='Password123!',
            role='student',
            first_name='Test',
            last_name='Student'
        )
        self.student = StudentProfile.objects.create(
            user=self.user,
            student_code='STU/2026/001'
        )
        self.session = AcademicSession.objects.create(
            label='2026/2027',
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + timezone.timedelta(days=365),
            is_active=True
        )
        self.level = Level.objects.create(
            name='Foundation',
            code='FND',
            order=1,
            is_active=True
        )
        # Create courses
        self.course1 = Course.objects.create(code='FND101', title='Financial Accounting', level=self.level)
        self.course2 = Course.objects.create(code='FND102', title='Management Information', level=self.level)
        self.course3 = Course.objects.create(code='FND103', title='Business Law', level=self.level)

        self.offering1 = CourseOffering.objects.create(course=self.course1, session=self.session, capacity=50)
        self.offering2 = CourseOffering.objects.create(course=self.course2, session=self.session, capacity=50)
        self.offering3 = CourseOffering.objects.create(course=self.course3, session=self.session, capacity=50)

        # Create tier pricing entries
        LevelTierPricing.objects.create(level=self.level, session=self.session, course_count=1, amount=Decimal('30000.00'), is_active=True)
        LevelTierPricing.objects.create(level=self.level, session=self.session, course_count=2, amount=Decimal('40000.00'), is_active=True)
        LevelTierPricing.objects.create(level=self.level, session=self.session, course_count=3, amount=Decimal('59000.00'), is_active=True)

    def test_single_course_pricing(self):
        enrollment = Enrollment.objects.create(
            student=self.student,
            session=self.session,
            level=self.level,
            status='active'
        )
        EnrollmentCourse.objects.create(enrollment=enrollment, course_offering=self.offering1)

        fees = InvoiceService.calculate_applicable_fees(enrollment)
        tuition_fee = next(f for f, q in fees if f.fee_type == FeeType.COURSE)
        self.assertEqual(tuition_fee.amount, Decimal('30000.00'))

        invoice = InvoiceService.create_invoice_for_enrollment(enrollment)
        self.assertEqual(invoice.total_amount, Decimal('30000.00'))

    def test_two_courses_pricing_flat_fee(self):
        enrollment = Enrollment.objects.create(
            student=self.student,
            session=self.session,
            level=self.level,
            status='active'
        )
        EnrollmentCourse.objects.create(enrollment=enrollment, course_offering=self.offering1)
        EnrollmentCourse.objects.create(enrollment=enrollment, course_offering=self.offering2)

        invoice = InvoiceService.create_invoice_for_enrollment(enrollment)
        # Should be flat fee of 40,000 (NOT 40,000 * 2 = 80,000)
        self.assertEqual(invoice.total_amount, Decimal('40000.00'))

    def test_dynamic_recalculation_on_adding_course(self):
        enrollment = Enrollment.objects.create(
            student=self.student,
            session=self.session,
            level=self.level,
            status='active'
        )
        ec1 = EnrollmentCourse.objects.create(enrollment=enrollment, course_offering=self.offering1)
        invoice1 = InvoiceService.create_invoice_for_enrollment(enrollment)
        self.assertEqual(invoice1.total_amount, Decimal('30000.00'))

        # Add 2nd course
        ec2 = EnrollmentCourse.objects.create(enrollment=enrollment, course_offering=self.offering2)
        invoice2 = InvoiceService.create_invoice_for_enrollment(enrollment)
        self.assertEqual(invoice2.id, invoice1.id)
        self.assertEqual(invoice2.total_amount, Decimal('40000.00'))
