"""
Unit tests for Student models
"""
import pytest
from django.db import IntegrityError
from students.models import StudentProfile
from factories import StudentFactory, UserFactory


@pytest.mark.django_db
@pytest.mark.unit
class TestStudentProfileModel:
    """Test StudentProfile model"""

    def test_create_student(self):
        """Test creating a student"""
        student = StudentFactory(
            first_name='John',
            last_name='Doe',
            whatsapp_number='+2348012345678'
        )
        
        assert student.first_name == 'John'
        assert student.last_name == 'Doe'
        assert student.whatsapp_number == '+2348012345678'
        assert student.student_code is not None
        assert student.user is not None
        assert student.user.role == 'student'

    def test_student_full_name_property(self):
        """Test student full_name property"""
        student = StudentFactory(first_name='Jane', last_name='Smith', other_name='')
        assert student.full_name == 'Jane Smith'
        
        student_with_other = StudentFactory(
            first_name='Jane',
            other_name='Marie',
            last_name='Smith'
        )
        assert student_with_other.full_name == 'Jane Marie Smith'

    def test_student_student_id_property(self):
        """Test student_id property returns student_code"""
        student = StudentFactory(student_code='ICAN-000001')
        assert student.student_id == 'ICAN-000001'

    def test_student_str_representation(self):
        """Test string representation of student"""
        student = StudentFactory(
            first_name='John',
            last_name='Doe',
            student_code='ICAN-000001'
        )
        
        assert str(student) == 'ICAN-000001 - John Doe'

    def test_student_one_to_one_with_user(self):
        """Test student has one-to-one relationship with user"""
        user = UserFactory(role='student')
        student1 = StudentFactory(user=user)
        
        # Trying to create another student with same user should fail
        with pytest.raises(IntegrityError):
            StudentProfile.objects.create(
                user=user,
                first_name='Another',
                last_name='Student',
                student_code='ICAN-000002'
            )

    def test_student_unique_student_code(self):
        """Test that student_code must be unique"""
        StudentFactory(student_code='ICAN-000001')
        
        with pytest.raises(IntegrityError):
            StudentFactory(student_code='ICAN-000001')

    def test_student_emergency_contact_optional(self):
        """Test that emergency contact fields are optional"""
        student = StudentFactory(
            emergency_contact_name='',
            emergency_contact_phone='',
            emergency_contact_relationship=''
        )
        
        assert student.emergency_contact_name == ''
        assert student.emergency_contact_phone == ''
        assert student.emergency_contact_relationship == ''

    def test_student_with_emergency_contact(self):
        """Test student with emergency contact information"""
        student = StudentFactory(
            emergency_contact_name='Mary Doe',
            emergency_contact_phone='+2348087654321',
            emergency_contact_relationship='Mother'
        )
        
        assert student.emergency_contact_name == 'Mary Doe'
        assert student.emergency_contact_phone == '+2348087654321'
        assert student.emergency_contact_relationship == 'Mother'

    def test_student_ordering(self):
        """Test students are ordered by created_at descending"""
        import time
        student1 = StudentFactory(student_code='ICAN-000001')
        time.sleep(0.1)
        student2 = StudentFactory(student_code='ICAN-000002')
        time.sleep(0.1)
        student3 = StudentFactory(student_code='ICAN-000003')
        
        students = list(StudentProfile.objects.all())
        # Most recent first
        assert students[0] == student3
        assert students[1] == student2
        assert students[2] == student1

    def test_student_auto_generates_student_code(self):
        """Test that student_code is auto-generated if not provided"""
        user = UserFactory(role='student')
        student = StudentProfile.objects.create(
            user=user,
            first_name='Auto',
            last_name='Generated'
        )
        
        assert student.student_code is not None
        assert student.student_code.startswith('ICAN-')

    def test_student_gender_choices(self):
        """Test student gender field choices"""
        valid_genders = ['M', 'F', 'O', '']
        
        for gender in valid_genders:
            student = StudentFactory(gender=gender)
            assert student.gender == gender

    def test_student_is_active_default_true(self):
        """Test student is_active defaults to True"""
        student = StudentFactory()
        assert student.is_active is True

    def test_student_ican_exam_id_optional(self):
        """Test that ican_exam_id is optional"""
        student = StudentFactory(ican_exam_id='')
        assert student.ican_exam_id == ''

    def test_student_with_ican_exam_id(self):
        """Test student with ICAN exam ID"""
        student = StudentFactory(ican_exam_id='ICAN/EXAM/2024/001234')
        assert student.ican_exam_id == 'ICAN/EXAM/2024/001234'
