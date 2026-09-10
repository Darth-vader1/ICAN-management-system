"""
Unit tests for Academic models
"""
import pytest
from django.db import IntegrityError
from django.utils import timezone
from datetime import timedelta
from academics.models import Level, Session, Course, CourseOffering, Class
from factories import (
    LevelFactory, SessionFactory, CourseFactory,
    CourseOfferingFactory, ClassFactory
)


@pytest.mark.django_db
@pytest.mark.unit
class TestLevelModel:
    """Test Level model"""

    def test_create_level(self):
        """Test creating a level"""
        level = LevelFactory(
            name='Foundation',
            code='FOUND',
            order=1
        )
        
        assert level.name == 'Foundation'
        assert level.code == 'FOUND'
        assert level.order == 1

    def test_level_str_representation(self):
        """Test string representation of level"""
        level = LevelFactory(name='Foundation')
        assert str(level) == 'Foundation'

    def test_level_unique_code(self):
        """Test that level code must be unique"""
        LevelFactory(code='FOUND')
        
        with pytest.raises(IntegrityError):
            LevelFactory(code='FOUND')

    def test_level_ordering(self):
        """Test levels are ordered by order field"""
        level3 = LevelFactory(name='Professional', order=3)
        level1 = LevelFactory(name='Foundation', order=1)
        level2 = LevelFactory(name='Skill', order=2)
        
        levels = list(Level.objects.all())
        assert levels[0] == level1
        assert levels[1] == level2
        assert levels[2] == level3


@pytest.mark.django_db
@pytest.mark.unit
class TestSessionModel:
    """Test Session model"""

    def test_create_session(self):
        """Test creating a session"""
        from datetime import date
        session = SessionFactory(
            name='2024/2025',
            start_date=date(2024, 9, 1),
            end_date=date(2025, 8, 31),
            is_active=True
        )
        
        assert session.name == '2024/2025'
        assert session.is_active is True

    def test_session_str_representation(self):
        """Test string representation of session"""
        session = SessionFactory(name='2024/2025')
        assert str(session) == '2024/2025'

    def test_only_one_active_session(self):
        """Test that only one session can be active at a time"""
        session1 = SessionFactory(name='2023/2024', is_active=True)
        assert session1.is_active is True
        
        # Creating another active session should deactivate the first
        session2 = SessionFactory(name='2024/2025', is_active=True)
        
        session1.refresh_from_db()
        assert session1.is_active is False
        assert session2.is_active is True

    def test_session_date_validation(self):
        """Test that end_date must be after start_date"""
        from datetime import date
        from django.core.exceptions import ValidationError
        
        session = SessionFactory.build(
            start_date=date(2025, 1, 1),
            end_date=date(2024, 1, 1)  # End before start
        )
        
        with pytest.raises(ValidationError):
            session.full_clean()


@pytest.mark.django_db
@pytest.mark.unit
class TestCourseModel:
    """Test Course model"""

    def test_create_course(self):
        """Test creating a course"""
        level = LevelFactory(name='Foundation')
        course = CourseFactory(
            name='Financial Accounting',
            code='FAC101',
            level=level
        )
        
        assert course.name == 'Financial Accounting'
        assert course.code == 'FAC101'
        assert course.level == level

    def test_course_str_representation(self):
        """Test string representation of course"""
        course = CourseFactory(code='FAC101', name='Financial Accounting')
        assert str(course) == 'FAC101 - Financial Accounting'

    def test_course_unique_code(self):
        """Test that course code must be unique"""
        CourseFactory(code='FAC101')
        
        with pytest.raises(IntegrityError):
            CourseFactory(code='FAC101')

    def test_course_cascade_delete_with_level(self):
        """Test that deleting level doesn't delete courses (PROTECT)"""
        level = LevelFactory()
        course = CourseFactory(level=level)
        
        # Should raise ProtectedError when trying to delete level with courses
        from django.db.models import ProtectedError
        with pytest.raises(ProtectedError):
            level.delete()


@pytest.mark.django_db
@pytest.mark.unit
class TestCourseOfferingModel:
    """Test CourseOffering model"""

    def test_create_course_offering(self):
        """Test creating a course offering"""
        course = CourseFactory(name='Financial Accounting')
        session = SessionFactory(name='2024/2025')
        
        offering = CourseOfferingFactory(
            course=course,
            session=session,
            capacity=30,
            is_active=True
        )
        
        assert offering.course == course
        assert offering.session == session
        assert offering.capacity == 30
        assert offering.is_active is True

    def test_course_offering_str_representation(self):
        """Test string representation of course offering"""
        course = CourseFactory(name='Financial Accounting')
        session = SessionFactory(name='2024/2025')
        offering = CourseOfferingFactory(course=course, session=session)
        
        assert str(offering) == 'Financial Accounting - 2024/2025'

    def test_course_offering_unique_together(self):
        """Test that course+session must be unique"""
        course = CourseFactory()
        session = SessionFactory()
        CourseOfferingFactory(course=course, session=session)
        
        with pytest.raises(IntegrityError):
            CourseOfferingFactory(course=course, session=session)

    def test_course_offering_default_capacity(self):
        """Test default capacity is set"""
        offering = CourseOfferingFactory()
        assert offering.capacity > 0


@pytest.mark.django_db
@pytest.mark.unit
class TestClassModel:
    """Test Class model"""

    def test_create_class(self):
        """Test creating a class"""
        offering = CourseOfferingFactory()
        class_obj = ClassFactory(
            name='Morning Class',
            code='CLS001',
            course_offering=offering,
            capacity=30,
            schedule='Monday 9:00 AM - 12:00 PM'
        )
        
        assert class_obj.name == 'Morning Class'
        assert class_obj.code == 'CLS001'
        assert class_obj.course_offering == offering
        assert class_obj.capacity == 30
        assert class_obj.schedule == 'Monday 9:00 AM - 12:00 PM'

    def test_class_str_representation(self):
        """Test string representation of class"""
        course = CourseFactory(name='Financial Accounting')
        session = SessionFactory(name='2024/2025')
        offering = CourseOfferingFactory(course=course, session=session)
        class_obj = ClassFactory(name='Morning Class', course_offering=offering)
        
        assert 'Morning Class' in str(class_obj)
        assert 'Financial Accounting' in str(class_obj)

    def test_class_unique_code(self):
        """Test that class code must be unique"""
        ClassFactory(code='CLS001')
        
        with pytest.raises(IntegrityError):
            ClassFactory(code='CLS001')

    def test_class_room_optional(self):
        """Test that room assignment is optional"""
        class_obj = ClassFactory(room=None)
        assert class_obj.room is None

    def test_class_instructor_optional(self):
        """Test that instructor assignment is optional"""
        class_obj = ClassFactory(instructor=None)
        assert class_obj.instructor is None
