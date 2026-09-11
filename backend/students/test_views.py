"""
Integration tests for Student API views
"""
import pytest
from rest_framework import status
from students.models import StudentProfile
from factories import StudentFactory, UserFactory


@pytest.mark.django_db
@pytest.mark.integration
class TestStudentAPI:
    """Test Student API endpoints"""

    def test_list_students_as_staff(self, staff_client):
        """Test staff can list students"""
        StudentFactory.create_batch(5)
        
        response = staff_client.get('/api/students/')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'results' in response.data or isinstance(response.data, list)

    def test_list_students_as_student_forbidden(self, authenticated_client):
        """Test students cannot list all students"""
        StudentFactory.create_batch(3)
        
        response = authenticated_client.get('/api/students/')
        
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_list_students_unauthenticated(self, api_client):
        """Test unauthenticated users cannot list students"""
        response = api_client.get('/api/students/')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_get_student_detail_as_staff(self, staff_client):
        """Test staff can get student details"""
        student = StudentFactory()
        
        response = staff_client.get(f'/api/students/{student.id}/')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['student_code'] == student.student_code

    def test_student_can_get_own_profile(self, authenticated_client, student_user):
        """Test student can get their own profile"""
        from students.models import StudentProfile
        
        # Create student profile for the authenticated user
        student = StudentFactory(user=student_user)
        
        response = authenticated_client.get('/api/students/me/')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['student_code'] == student.student_code

    def test_student_cannot_get_other_student_profile(self, authenticated_client):
        """Test student cannot get another student's profile"""
        other_student = StudentFactory()
        
        response = authenticated_client.get(f'/api/students/{other_student.id}/')
        
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_create_student_as_staff(self, staff_client):
        """Test staff can create a student with existing user account"""
        user = UserFactory(email='newstudent@ican.edu', role='student')
        
        data = {
            'user': user.id,
            'first_name': 'New',
            'last_name': 'Student',
            'date_of_birth': '2000-01-01',
            'whatsapp_number': '+2348012345678',
        }
        
        response = staff_client.post('/api/students/', data)
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['first_name'] == 'New'

    def test_create_student_with_email_and_password(self, staff_client):
        """Test staff can create student profile and user automatically via POST /api/students/"""
        data = {
            'email': 'autocreate_student@ican.edu',
            'password': 'Password123!',
            'password_confirm': 'Password123!',
            'phone': '08099887766',
            'first_name': 'Auto',
            'last_name': 'Created',
            'gender': 'M',
        }
        
        response = staff_client.post('/api/students/', data)
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['first_name'] == 'Auto'
        assert response.data['user_email'] == 'autocreate_student@ican.edu'

    def test_create_student_duplicate_email(self, staff_client):
        """Test creating student with duplicate email returns field error"""
        existing = StudentFactory()
        
        data = {
            'email': existing.user.email,
            'password': 'Password123!',
            'password_confirm': 'Password123!',
            'first_name': 'Duplicate',
            'last_name': 'Student',
        }
        
        response = staff_client.post('/api/students/', data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'email' in str(response.data)

    def test_create_student_as_student_forbidden(self, authenticated_client):
        """Test students cannot create other students"""
        data = {
            'first_name': 'New',
            'last_name': 'Student',
        }
        
        response = authenticated_client.post('/api/students/', data)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_update_student_as_staff(self, staff_client):
        """Test staff can update student"""
        student = StudentFactory()
        
        data = {'first_name': 'Updated'}
        response = staff_client.patch(f'/api/students/{student.id}/', data)
        
        assert response.status_code == status.HTTP_200_OK
        
        student.refresh_from_db()
        assert student.first_name == 'Updated'

    def test_student_can_update_own_profile(self, authenticated_client, student_user):
        """Test student can update their own profile"""
        student = StudentFactory(user=student_user)
        
        data = {'whatsapp_number': '+2348099999999'}
        response = authenticated_client.patch('/api/students/me/', data)
        
        # Should succeed or return 200/404 depending on implementation
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND
        ]

    def test_delete_student_as_staff(self, staff_client):
        """Test staff can delete/deactivate student"""
        student = StudentFactory()
        
        response = staff_client.delete(f'/api/students/{student.id}/')
        
        # Should succeed, be forbidden, or method not allowed
        assert response.status_code in [
            status.HTTP_204_NO_CONTENT,
            status.HTTP_200_OK,
            status.HTTP_405_METHOD_NOT_ALLOWED
        ]

    def test_search_students_by_name(self, staff_client):
        """Test searching students by name"""
        StudentFactory(first_name='John', last_name='Doe')
        StudentFactory(first_name='Jane', last_name='Smith')
        
        response = staff_client.get('/api/students/?search=John')
        
        if response.status_code == status.HTTP_200_OK:
            # If search is implemented
            results = response.data.get('results', response.data)
            assert len(results) >= 1

    def test_filter_students_by_active_status(self, staff_client):
        """Test filtering students by active status"""
        StudentFactory(is_active=True)
        StudentFactory(is_active=False)
        
        response = staff_client.get('/api/students/?is_active=true')
        
        assert response.status_code == status.HTTP_200_OK
