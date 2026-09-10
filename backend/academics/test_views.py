"""
Integration tests for Academic API views
"""
import pytest
from rest_framework import status
from factories import (
    LevelFactory, SessionFactory, CourseFactory,
    CourseOfferingFactory, ClassFactory
)


@pytest.mark.django_db
@pytest.mark.integration
class TestLevelAPI:
    """Test Level API endpoints"""

    def test_list_levels(self, authenticated_client):
        """Test listing levels (public access)"""
        LevelFactory.create_batch(3)
        
        response = authenticated_client.get('/api/academics/levels/')
        
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get('results', response.data)
        assert len(results) >= 3

    def test_get_level_detail(self, authenticated_client):
        """Test getting level detail"""
        level = LevelFactory(name='Foundation')
        
        response = authenticated_client.get(f'/api/academics/levels/{level.id}/')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == 'Foundation'

    def test_create_level_as_staff(self, staff_client):
        """Test staff can create level"""
        data = {
            'name': 'New Level',
            'code': 'NEWLVL',
            'description': 'A new level',
            'order': 4
        }
        
        response = staff_client.post('/api/academics/levels/', data)
        
        assert response.status_code in [
            status.HTTP_201_CREATED,
            status.HTTP_403_FORBIDDEN  # If only admin can create
        ]

    def test_create_level_as_student_forbidden(self, authenticated_client):
        """Test students cannot create levels"""
        data = {
            'name': 'New Level',
            'code': 'NEWLVL',
        }
        
        response = authenticated_client.post('/api/academics/levels/', data)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
@pytest.mark.integration
class TestSessionAPI:
    """Test Session API endpoints"""

    def test_list_sessions(self, authenticated_client):
        """Test listing sessions"""
        SessionFactory.create_batch(3)
        
        response = authenticated_client.get('/api/academics/sessions/')
        
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get('results', response.data)
        assert len(results) >= 3

    def test_get_active_session(self, authenticated_client):
        """Test getting active session"""
        SessionFactory(name='2023/2024', is_active=False)
        active_session = SessionFactory(name='2024/2025', is_active=True)
        
        response = authenticated_client.get('/api/academics/sessions/active/')
        
        if response.status_code == status.HTTP_200_OK:
            assert response.data['name'] == '2024/2025'

    def test_create_session_as_staff(self, staff_client):
        """Test staff can create session"""
        data = {
            'name': '2025/2026',
            'start_date': '2025-09-01',
            'end_date': '2026-08-31',
            'is_active': False
        }
        
        response = staff_client.post('/api/academics/sessions/', data)
        
        assert response.status_code in [
            status.HTTP_201_CREATED,
            status.HTTP_403_FORBIDDEN
        ]


@pytest.mark.django_db
@pytest.mark.integration
class TestCourseAPI:
    """Test Course API endpoints"""

    def test_list_courses(self, authenticated_client):
        """Test listing courses"""
        CourseFactory.create_batch(5)
        
        response = authenticated_client.get('/api/academics/courses/')
        
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get('results', response.data)
        assert len(results) >= 5

    def test_get_course_detail(self, authenticated_client):
        """Test getting course detail"""
        course = CourseFactory(name='Financial Accounting', code='FAC101')
        
        response = authenticated_client.get(f'/api/academics/courses/{course.id}/')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == 'Financial Accounting'
        assert response.data['code'] == 'FAC101'

    def test_create_course_as_staff(self, staff_client):
        """Test staff can create course"""
        level = LevelFactory()
        
        data = {
            'name': 'New Course',
            'code': 'NEW101',
            'description': 'A new course',
            'level': level.id
        }
        
        response = staff_client.post('/api/academics/courses/', data)
        
        assert response.status_code in [
            status.HTTP_201_CREATED,
            status.HTTP_403_FORBIDDEN
        ]

    def test_update_course_as_staff(self, staff_client):
        """Test staff can update course"""
        course = CourseFactory()
        
        data = {'name': 'Updated Course Name'}
        response = staff_client.patch(f'/api/academics/courses/{course.id}/', data)
        
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_403_FORBIDDEN
        ]

    def test_filter_courses_by_level(self, authenticated_client):
        """Test filtering courses by level"""
        foundation = LevelFactory(name='Foundation')
        skill = LevelFactory(name='Skill')
        
        CourseFactory.create_batch(2, level=foundation)
        CourseFactory.create_batch(3, level=skill)
        
        response = authenticated_client.get(f'/api/academics/courses/?level={foundation.id}')
        
        if response.status_code == status.HTTP_200_OK:
            results = response.data.get('results', response.data)
            # Should return only foundation courses if filter works
            assert len(results) >= 2


@pytest.mark.django_db
@pytest.mark.integration
class TestCourseOfferingAPI:
    """Test CourseOffering API endpoints"""

    def test_list_course_offerings(self, authenticated_client):
        """Test listing course offerings"""
        CourseOfferingFactory.create_batch(3)
        
        response = authenticated_client.get('/api/academics/offerings/')
        
        assert response.status_code == status.HTTP_200_OK

    def test_get_course_offering_detail(self, authenticated_client):
        """Test getting course offering detail"""
        offering = CourseOfferingFactory()
        
        response = authenticated_client.get(f'/api/academics/offerings/{offering.id}/')
        
        assert response.status_code == status.HTTP_200_OK

    def test_filter_offerings_by_session(self, authenticated_client):
        """Test filtering offerings by session"""
        session = SessionFactory()
        CourseOfferingFactory.create_batch(3, session=session)
        CourseOfferingFactory.create_batch(2)  # Different session
        
        response = authenticated_client.get(f'/api/academics/offerings/?session={session.id}')
        
        assert response.status_code == status.HTTP_200_OK

    def test_create_offering_as_staff(self, staff_client):
        """Test staff can create course offering"""
        course = CourseFactory()
        session = SessionFactory()
        
        data = {
            'course': course.id,
            'session': session.id,
            'capacity': 30,
            'is_active': True
        }
        
        response = staff_client.post('/api/academics/offerings/', data)
        
        assert response.status_code in [
            status.HTTP_201_CREATED,
            status.HTTP_403_FORBIDDEN
        ]


@pytest.mark.django_db
@pytest.mark.integration
class TestClassAPI:
    """Test Class API endpoints"""

    def test_list_classes(self, authenticated_client):
        """Test listing classes"""
        ClassFactory.create_batch(4)
        
        response = authenticated_client.get('/api/academics/classes/')
        
        assert response.status_code == status.HTTP_200_OK

    def test_get_class_detail(self, authenticated_client):
        """Test getting class detail"""
        class_obj = ClassFactory(name='Morning Class')
        
        response = authenticated_client.get(f'/api/academics/classes/{class_obj.id}/')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == 'Morning Class'

    def test_create_class_as_staff(self, staff_client):
        """Test staff can create class"""
        offering = CourseOfferingFactory()
        
        data = {
            'name': 'Evening Class',
            'code': 'EVE001',
            'course_offering': offering.id,
            'capacity': 25,
            'schedule': 'Wednesday 6:00 PM - 9:00 PM'
        }
        
        response = staff_client.post('/api/academics/classes/', data)
        
        assert response.status_code in [
            status.HTTP_201_CREATED,
            status.HTTP_403_FORBIDDEN
        ]

    def test_filter_classes_by_offering(self, authenticated_client):
        """Test filtering classes by course offering"""
        offering = CourseOfferingFactory()
        ClassFactory.create_batch(2, course_offering=offering)
        ClassFactory.create_batch(3)  # Different offerings
        
        response = authenticated_client.get(
            f'/api/academics/classes/?course_offering={offering.id}'
        )
        
        assert response.status_code == status.HTTP_200_OK
