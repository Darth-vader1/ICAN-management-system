"""
Unit tests for Enrollment models
"""
import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.utils import timezone
from enrollments.models import Enrollment, EnrollmentCourse, EnrollmentStatus
from factories import (
    EnrollmentFactory, StudentFactory, SessionFactory,
    LevelFactory, CourseOfferingFactory, CourseFactory
)


@pytest.mark.django_db
@pytest.mark.unit
@pytest.mark.enrollment
class TestEnrollmentModel:
    """Test Enrollment model"""

    def test_create_enrollment(self):
        """Test creating an enrollment"""
        student = StudentFactory()
        session = SessionFactory()
        level = LevelFactory()
        
        enrollment = EnrollmentFactory(
            student=student,
            session=session,
            level=level,
            status='draft'
        )
        
        assert enrollment.student == student
        assert enrollment.session == session
        assert enrollment.level == level
        assert enrollment.status == 'draft'
        assert enrollment.student.student_code is not None

    def test_enrollment_str_representation(self):
        """Test string representation of enrollment"""
        student = StudentFactory()
        session = SessionFactory(label='2024/2025')
        level = LevelFactory(name='Foundation', code='foundation')
        
        enrollment = EnrollmentFactory(
            student=student,
            session=session,
            level=level
        )
        
        assert student.user.email in str(enrollment)
        assert 'Foundation' in str(enrollment)
        assert '2024/2025' in str(enrollment)

    def test_enrollment_status_choices(self):
        """Test enrollment status choices"""
        valid_statuses = ['draft', 'active', 'completed', 'suspended', 'withdrawn']
        
        for status in valid_statuses:
            enrollment = EnrollmentFactory(status=status)
            assert enrollment.status == status

    def test_enrollment_timestamps(self):
        """Test that enrollment has timestamps"""
        enrollment = EnrollmentFactory()
        
        assert enrollment.created_at is not None
        assert enrollment.updated_at is not None
        assert enrollment.created_at <= enrollment.updated_at

    def test_enrollment_can_have_multiple_courses(self):
        """Test enrollment can have multiple courses"""
        enrollment = EnrollmentFactory()
        course1 = CourseFactory(level=enrollment.level)
        course2 = CourseFactory(level=enrollment.level)
        offering1 = CourseOfferingFactory(course=course1, session=enrollment.session)
        offering2 = CourseOfferingFactory(course=course2, session=enrollment.session)
        
        EnrollmentCourse.objects.create(
            enrollment=enrollment,
            course_offering=offering1
        )
        EnrollmentCourse.objects.create(
            enrollment=enrollment,
            course_offering=offering2
        )
        
        assert enrollment.enrollment_courses.count() == 2


@pytest.mark.django_db
@pytest.mark.unit
@pytest.mark.enrollment
class TestEnrollmentCourseModel:
    """Test EnrollmentCourse model"""

    def test_create_enrollment_course(self):
        """Test creating an enrollment course"""
        enrollment = EnrollmentFactory()
        course = CourseFactory(level=enrollment.level)
        offering = CourseOfferingFactory(course=course, session=enrollment.session)
        
        enrollment_course = EnrollmentCourse.objects.create(
            enrollment=enrollment,
            course_offering=offering
        )
        
        assert enrollment_course.enrollment == enrollment
        assert enrollment_course.course_offering == offering
        assert enrollment_course.dropped is False

    def test_enrollment_course_str_representation(self):
        """Test string representation of enrollment course"""
        student = StudentFactory()
        enrollment = EnrollmentFactory(student=student)
        course = CourseFactory(name='Financial Accounting', code='FA101', level=enrollment.level)
        offering = CourseOfferingFactory(course=course, session=enrollment.session)
        
        enrollment_course = EnrollmentCourse.objects.create(
            enrollment=enrollment,
            course_offering=offering
        )
        
        result = str(enrollment_course)
        assert student.user.email in result
        assert 'FA101' in result

    def test_enrollment_course_unique_together(self):
        """Test that enrollment+course_offering must be unique"""
        enrollment = EnrollmentFactory()
        course = CourseFactory(level=enrollment.level)
        offering = CourseOfferingFactory(course=course, session=enrollment.session)
        
        EnrollmentCourse.objects.create(
            enrollment=enrollment,
            course_offering=offering
        )
        
        with pytest.raises((IntegrityError, ValidationError)):
            EnrollmentCourse.objects.create(
                enrollment=enrollment,
                course_offering=offering
            )

    def test_enrollment_course_can_be_dropped(self):
        """Test that course can be marked as dropped"""
        enrollment = EnrollmentFactory()
        course = CourseFactory(level=enrollment.level)
        offering = CourseOfferingFactory(course=course, session=enrollment.session)
        
        enrollment_course = EnrollmentCourse.objects.create(
            enrollment=enrollment,
            course_offering=offering
        )
        
        assert enrollment_course.dropped is False
        
        enrollment_course.drop()
        
        assert enrollment_course.dropped is True
        assert enrollment_course.dropped_date is not None

    def test_enrollment_course_timestamps(self):
        """Test enrollment course has timestamps"""
        enrollment = EnrollmentFactory()
        course = CourseFactory(level=enrollment.level)
        offering = CourseOfferingFactory(course=course, session=enrollment.session)
        
        enrollment_course = EnrollmentCourse.objects.create(
            enrollment=enrollment,
            course_offering=offering
        )
        
        assert enrollment_course.enrolled_date is not None
