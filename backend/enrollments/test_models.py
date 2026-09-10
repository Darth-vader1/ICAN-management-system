"""
Unit tests for Enrollment models
"""
import pytest
from django.db import IntegrityError
from django.utils import timezone
from enrollments.models import Enrollment, EnrollmentCourse
from factories import (
    EnrollmentFactory, StudentFactory, SessionFactory,
    LevelFactory, CourseOfferingFactory
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
            status='pending'
        )
        
        assert enrollment.student == student
        assert enrollment.session == session
        assert enrollment.level == level
        assert enrollment.status == 'pending'
        assert enrollment.student_code is not None

    def test_enrollment_str_representation(self):
        """Test string representation of enrollment"""
        student = StudentFactory(student_id='STU00001')
        session = SessionFactory(name='2024/2025')
        level = LevelFactory(name='Foundation')
        
        enrollment = EnrollmentFactory(
            student=student,
            session=session,
            level=level
        )
        
        assert 'STU00001' in str(enrollment)
        assert '2024/2025' in str(enrollment)

    def test_enrollment_status_choices(self):
        """Test enrollment status choices"""
        valid_statuses = ['pending', 'active', 'completed', 'suspended', 'withdrawn']
        
        for status in valid_statuses:
            enrollment = EnrollmentFactory(status=status)
            assert enrollment.status == status

    def test_enrollment_unique_student_session(self):
        """Test that student can only have one enrollment per session"""
        student = StudentFactory()
        session = SessionFactory()
        level = LevelFactory()
        
        EnrollmentFactory(student=student, session=session, level=level)
        
        # Second enrollment for same student and session should fail
        with pytest.raises(IntegrityError):
            EnrollmentFactory(student=student, session=session, level=level)

    def test_enrollment_auto_generates_student_code(self):
        """Test that student_code is auto-generated"""
        enrollment = EnrollmentFactory()
        
        assert enrollment.student_code is not None
        assert len(enrollment.student_code) > 0

    def test_enrollment_timestamps(self):
        """Test that enrollment has timestamps"""
        enrollment = EnrollmentFactory()
        
        assert enrollment.created_at is not None
        assert enrollment.updated_at is not None
        assert enrollment.created_at <= enrollment.updated_at

    def test_enrollment_can_have_multiple_courses(self):
        """Test enrollment can have multiple courses"""
        enrollment = EnrollmentFactory()
        offering1 = CourseOfferingFactory()
        offering2 = CourseOfferingFactory()
        
        EnrollmentCourse.objects.create(
            enrollment=enrollment,
            course_offering=offering1
        )
        EnrollmentCourse.objects.create(
            enrollment=enrollment,
            course_offering=offering2
        )
        
        assert enrollment.courses.count() == 2


@pytest.mark.django_db
@pytest.mark.unit
@pytest.mark.enrollment
class TestEnrollmentCourseModel:
    """Test EnrollmentCourse model"""

    def test_create_enrollment_course(self):
        """Test creating an enrollment course"""
        enrollment = EnrollmentFactory()
        offering = CourseOfferingFactory()
        
        enrollment_course = EnrollmentCourse.objects.create(
            enrollment=enrollment,
            course_offering=offering
        )
        
        assert enrollment_course.enrollment == enrollment
        assert enrollment_course.course_offering == offering
        assert enrollment_course.dropped is False
        assert enrollment_course.grade is None

    def test_enrollment_course_str_representation(self):
        """Test string representation of enrollment course"""
        student = StudentFactory(student_id='STU00001')
        enrollment = EnrollmentFactory(student=student)
        course = CourseFactory(name='Financial Accounting')
        session = SessionFactory()
        offering = CourseOfferingFactory(course=course, session=session)
        
        enrollment_course = EnrollmentCourse.objects.create(
            enrollment=enrollment,
            course_offering=offering
        )
        
        result = str(enrollment_course)
        assert 'STU00001' in result or 'Financial Accounting' in result

    def test_enrollment_course_unique_together(self):
        """Test that enrollment+course_offering must be unique"""
        enrollment = EnrollmentFactory()
        offering = CourseOfferingFactory()
        
        EnrollmentCourse.objects.create(
            enrollment=enrollment,
            course_offering=offering
        )
        
        with pytest.raises(IntegrityError):
            EnrollmentCourse.objects.create(
                enrollment=enrollment,
                course_offering=offering
            )

    def test_enrollment_course_can_be_dropped(self):
        """Test that course can be marked as dropped"""
        enrollment = EnrollmentFactory()
        offering = CourseOfferingFactory()
        
        enrollment_course = EnrollmentCourse.objects.create(
            enrollment=enrollment,
            course_offering=offering
        )
        
        assert enrollment_course.dropped is False
        
        enrollment_course.dropped = True
        enrollment_course.dropped_date = timezone.now()
        enrollment_course.save()
        
        assert enrollment_course.dropped is True
        assert enrollment_course.dropped_date is not None

    def test_enrollment_course_grade_optional(self):
        """Test that grade is optional"""
        enrollment = EnrollmentFactory()
        offering = CourseOfferingFactory()
        
        enrollment_course = EnrollmentCourse.objects.create(
            enrollment=enrollment,
            course_offering=offering
        )
        
        assert enrollment_course.grade is None

    def test_enrollment_course_can_have_grade(self):
        """Test that course can have a grade"""
        enrollment = EnrollmentFactory()
        offering = CourseOfferingFactory()
        
        enrollment_course = EnrollmentCourse.objects.create(
            enrollment=enrollment,
            course_offering=offering,
            grade='A'
        )
        
        assert enrollment_course.grade == 'A'

    def test_enrollment_course_timestamps(self):
        """Test enrollment course has timestamps"""
        enrollment = EnrollmentFactory()
        offering = CourseOfferingFactory()
        
        enrollment_course = EnrollmentCourse.objects.create(
            enrollment=enrollment,
            course_offering=offering
        )
        
        assert enrollment_course.enrolled_date is not None
