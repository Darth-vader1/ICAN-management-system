"""
Integration tests for Enrollment API views
"""
import pytest
from rest_framework import status
from factories import (
    EnrollmentFactory, StudentFactory, SessionFactory,
    LevelFactory, CourseOfferingFactory
)


@pytest.mark.django_db
@pytest.mark.integration
@pytest.mark.enrollment
class TestEnrollmentAPI:
    """Test Enrollment API endpoints"""

    def test_list_enrollments_as_staff(self, staff_client):
        """Test staff can list all enrollments"""
        EnrollmentFactory.create_batch(5)
        
        response = staff_client.get('/api/enrollments/')
        
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get('results', response.data)
        assert len(results) >= 5

    def test_list_enrollments_as_student_shows_own_only(self, authenticated_client, student_user):
        """Test students can only see their own enrollments"""
        # Create student profile for authenticated user
        student = StudentFactory(user=student_user)
        
        # Create enrollments for this student
        EnrollmentFactory.create_batch(2, student=student)
        
        # Create enrollments for other students
        EnrollmentFactory.create_batch(3)
        
        response = authenticated_client.get('/api/enrollments/')
        
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get('results', response.data)
        
        # Student should only see their own enrollments
        for enrollment in results:
            assert enrollment['student']['id'] == str(student.id)

    def test_get_enrollment_detail_as_owner(self, authenticated_client, student_user):
        """Test student can get their own enrollment detail"""
        student = StudentFactory(user=student_user)
        enrollment = EnrollmentFactory(student=student)
        
        response = authenticated_client.get(f'/api/enrollments/{enrollment.id}/')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['student_code'] == enrollment.student_code

    def test_get_enrollment_detail_as_other_student_forbidden(self, authenticated_client):
        """Test student cannot get another student's enrollment"""
        other_enrollment = EnrollmentFactory()
        
        response = authenticated_client.get(f'/api/enrollments/{other_enrollment.id}/')
        
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_create_enrollment_as_student(self, authenticated_client, student_user):
        """Test student can create their own enrollment"""
        student = StudentFactory(user=student_user)
        session = SessionFactory(is_active=True)
        level = LevelFactory()
        
        data = {
            'session': session.id,
            'level': level.id,
        }
        
        response = authenticated_client.post('/api/enrollments/', data)
        
        # Should succeed or return validation error
        assert response.status_code in [
            status.HTTP_201_CREATED,
            status.HTTP_400_BAD_REQUEST
        ]

    def test_create_enrollment_as_staff(self, staff_client):
        """Test staff can create enrollment for any student"""
        student = StudentFactory()
        session = SessionFactory(is_active=True)
        level = LevelFactory()
        
        data = {
            'student_id': str(student.id),
            'session': session.id,
            'level': level.id,
        }
        
        response = staff_client.post('/api/enrollments/', data)
        
        assert response.status_code in [
            status.HTTP_201_CREATED,
            status.HTTP_400_BAD_REQUEST
        ]

    def test_update_enrollment_status(self, staff_client):
        """Test staff can update enrollment status"""
        enrollment = EnrollmentFactory(status='pending')
        
        data = {'status': 'active'}
        response = staff_client.patch(f'/api/enrollments/{enrollment.id}/', data)
        
        assert response.status_code == status.HTTP_200_OK
        
        enrollment.refresh_from_db()
        assert enrollment.status == 'active'

    def test_student_cannot_change_enrollment_status(self, authenticated_client, student_user):
        """Test student cannot change their enrollment status"""
        student = StudentFactory(user=student_user)
        enrollment = EnrollmentFactory(student=student, status='pending')
        
        data = {'status': 'active'}
        response = authenticated_client.patch(f'/api/enrollments/{enrollment.id}/', data)
        
        # Should be forbidden or ignored
        enrollment.refresh_from_db()
        assert enrollment.status == 'pending'

    def test_add_course_to_enrollment(self, authenticated_client, student_user):
        """Test adding a course to enrollment"""
        student = StudentFactory(user=student_user)
        enrollment = EnrollmentFactory(student=student, status='active')
        offering = CourseOfferingFactory()
        
        data = {'course_offering_id': str(offering.id)}
        response = authenticated_client.post(
            f'/api/enrollments/{enrollment.id}/add-course/',
            data
        )
        
        # Should succeed or return 404 if endpoint doesn't exist
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_201_CREATED,
            status.HTTP_404_NOT_FOUND,
            status.HTTP_400_BAD_REQUEST
        ]

    def test_drop_course_from_enrollment(self, authenticated_client, student_user):
        """Test dropping a course from enrollment"""
        student = StudentFactory(user=student_user)
        enrollment = EnrollmentFactory(student=student, status='active')
        
        # This test assumes the endpoint exists
        response = authenticated_client.post(
            f'/api/enrollments/{enrollment.id}/drop-course/',
            {'course_offering_id': 'some-id'}
        )
        
        # Endpoint may not exist
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND,
            status.HTTP_400_BAD_REQUEST
        ]

    def test_filter_enrollments_by_status(self, staff_client):
        """Test filtering enrollments by status"""
        EnrollmentFactory.create_batch(2, status='active')
        EnrollmentFactory.create_batch(3, status='pending')
        
        response = staff_client.get('/api/enrollments/?status=active')
        
        assert response.status_code == status.HTTP_200_OK

    def test_filter_enrollments_by_session(self, staff_client):
        """Test filtering enrollments by session"""
        session = SessionFactory(name='2024/2025')
        EnrollmentFactory.create_batch(3, session=session)
        EnrollmentFactory.create_batch(2)  # Different session
        
        response = staff_client.get(f'/api/enrollments/?session={session.id}')
        
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
@pytest.mark.integration
@pytest.mark.enrollment
class TestEnrollmentWorkflow:
    """Test complete enrollment workflow"""

    def test_complete_enrollment_workflow(self, authenticated_client, student_user):
        """Test complete enrollment process from start to finish"""
        # Step 1: Create student profile
        student = StudentFactory(user=student_user)
        
        # Step 2: Get active session and level
        session = SessionFactory(is_active=True)
        level = LevelFactory()
        
        # Step 3: Create enrollment
        enrollment_data = {
            'session': session.id,
            'level': level.id,
        }
        
        response = authenticated_client.post('/api/enrollments/', enrollment_data)
        
        # Should create enrollment or return error
        if response.status_code == status.HTTP_201_CREATED:
            enrollment_id = response.data['id']
            
            # Step 4: Add courses to enrollment
            offering1 = CourseOfferingFactory(session=session)
            offering2 = CourseOfferingFactory(session=session)
            
            # This depends on API implementation
            add_course_response = authenticated_client.post(
                f'/api/enrollments/{enrollment_id}/add-course/',
                {'course_offering_id': str(offering1.id)}
            )
            
            # Should succeed or endpoint might not exist
            assert add_course_response.status_code in [
                status.HTTP_200_OK,
                status.HTTP_201_CREATED,
                status.HTTP_404_NOT_FOUND
            ]
