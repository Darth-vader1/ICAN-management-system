"""
Test data factories using factory_boy
"""
import factory
from factory.django import DjangoModelFactory
from faker import Faker
from django.contrib.auth import get_user_model
from academics.models import Level, AcademicSession, Session, Course, CourseOffering, Class
from students.models import StudentProfile
from enrollments.models import Enrollment, EnrollmentStatus
from billing.models import Invoice, Payment

fake = Faker()
User = get_user_model()


class UserFactory(DjangoModelFactory):
    """Factory for User model"""
    class Meta:
        model = User
        django_get_or_create = ('email',)

    email = factory.Sequence(lambda n: f'user{n}@ican.edu')
    role = 'student'
    is_active = True

    @factory.post_generation
    def password(obj, create, extracted, **kwargs):
        if create:
            obj.set_password(extracted or 'testpass123')
            obj.save()


class StudentUserFactory(UserFactory):
    """Factory for Student user"""
    role = 'student'


class StaffUserFactory(UserFactory):
    """Factory for Staff user"""
    role = 'student_officer'
    is_staff = True


class AdminUserFactory(UserFactory):
    """Factory for Admin user"""
    role = 'super_admin'
    is_staff = True


class LevelFactory(DjangoModelFactory):
    """Factory for Level model"""
    class Meta:
        model = Level
        django_get_or_create = ('code',)

    code = factory.Iterator(['foundation', 'skills', 'professional'])
    name = factory.Iterator(['Foundation', 'Skills', 'Professional'])
    description = factory.LazyAttribute(lambda obj: f'Description for {obj.name}')
    order = factory.Sequence(lambda n: (n % 3) + 1)


class SessionFactory(DjangoModelFactory):
    """Factory for Session model"""
    class Meta:
        model = AcademicSession
        django_get_or_create = ('label',)

    label = factory.Sequence(lambda n: f'202{4+n}/202{5+n}')
    start_date = factory.Faker('date_this_year', before_today=True, after_today=False)
    end_date = factory.Faker('date_this_year', before_today=False, after_today=True)
    is_active = True


class CourseFactory(DjangoModelFactory):
    """Factory for Course model"""
    class Meta:
        model = Course
        django_get_or_create = ('code',)

    name = factory.Sequence(lambda n: f'Course {n}')
    code = factory.Sequence(lambda n: f'CRS{n:03d}')
    description = factory.LazyAttribute(lambda obj: f'Description for {obj.name}')
    level = factory.SubFactory(LevelFactory)


class CourseOfferingFactory(DjangoModelFactory):
    """Factory for CourseOffering model"""
    class Meta:
        model = CourseOffering
        django_get_or_create = ('course', 'session')

    course = factory.SubFactory(CourseFactory)
    session = factory.SubFactory(SessionFactory)
    capacity = 30
    is_active = True


class ClassFactory(DjangoModelFactory):
    """Factory for Class model"""
    class Meta:
        model = Class

    name = factory.Sequence(lambda n: f'Class {n}')
    course_offering = factory.SubFactory(CourseOfferingFactory)


class StudentFactory(DjangoModelFactory):
    """Factory for StudentProfile model"""
    class Meta:
        model = StudentProfile
        django_get_or_create = ('user',)

    user = factory.SubFactory(StudentUserFactory)
    student_code = factory.Sequence(lambda n: f'ICAN-{n:06d}')
    first_name = factory.Faker('first_name')
    last_name = factory.Faker('last_name')
    date_of_birth = factory.Faker('date_of_birth', minimum_age=16, maximum_age=60)
    whatsapp_number = factory.Faker('phone_number')
    address = factory.Faker('address')


class EnrollmentFactory(DjangoModelFactory):
    """Factory for Enrollment model"""
    class Meta:
        model = Enrollment

    student = factory.SubFactory(StudentFactory)
    session = factory.SubFactory(SessionFactory)
    level = factory.SubFactory(LevelFactory)
    status = 'draft'


class InvoiceFactory(DjangoModelFactory):
    """Factory for Invoice model"""
    class Meta:
        model = Invoice
        django_get_or_create = ('invoice_number',)

    enrollment = factory.SubFactory(EnrollmentFactory)
    student = factory.SelfAttribute('enrollment.student')
    invoice_number = factory.Sequence(lambda n: f'INV{n:06d}')
    total_amount = factory.Faker('pydecimal', left_digits=5, right_digits=2, positive=True)
    due_date = factory.Faker('future_date', end_date='+30d')
    status = 'pending'


class PaymentFactory(DjangoModelFactory):
    """Factory for Payment model"""
    class Meta:
        model = Payment

    invoice = factory.SubFactory(InvoiceFactory)
    student = factory.SelfAttribute('invoice.student')
    reference = factory.Sequence(lambda n: f'PAY{n:08d}')
    amount = factory.LazyAttribute(lambda obj: obj.invoice.total_amount)
    payment_method = 'paystack'
    status = 'successful'
