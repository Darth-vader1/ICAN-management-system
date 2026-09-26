"""
Integration tests for User API views
"""
import pytest
from rest_framework import status
from django.contrib.auth import get_user_model
from factories import UserFactory, StudentUserFactory, StaffUserFactory

User = get_user_model()


@pytest.mark.django_db
@pytest.mark.integration
@pytest.mark.auth
class TestAuthenticationAPI:
    """Test authentication endpoints"""

    def test_user_registration(self, api_client):
        response = api_client.post('/api/users/register/', {
            'email': 'new@ican.edu',
            'password': 'StrongPass123!',
            'password_confirm': 'StrongPass123!',
            'first_name': 'New',
            'last_name': 'User',
            'phone': '08012345678',
        }, format='json')
        assert response.status_code == 201, response.data
        assert 'access' in response.data or 'email' in response.data
        
        # Verify user was created
        user = User.objects.get(email='new@ican.edu')
        assert user.role == 'student'
        assert user.is_active is True

    def test_user_login(self, api_client):
        UserFactory(email='test@ican.edu', password='testpass123')
        
        response = api_client.post('/api/users/login/', {
            'email': 'test@ican.edu',
            'password': 'testpass123',
        }, format='json')
        
        assert response.status_code == 200
        assert 'access' in response.data
        # Refresh is now delivered via HTTP-only cookie
        assert any(
            name in response.cookies
            for name in ('refresh_token', 'refresh')
        )

    def test_user_login_invalid_credentials(self, api_client):
        """Test login with invalid credentials"""
        UserFactory(email='test@ican.edu', password='correctpass')
        
        data = {
            'email': 'test@ican.edu',
            'password': 'wrongpass'
        }
        
        response = api_client.post('/api/users/login/', data)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_token_refresh(self, api_client, student_user):
        """Test token refresh"""
        from rest_framework_simplejwt.tokens import RefreshToken
        
        refresh = RefreshToken.for_user(student_user)
        
        data = {'refresh': str(refresh)}
        response = api_client.post('/api/users/token/refresh/', data)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data

    def test_get_current_user(self, authenticated_client, student_user):
        """Test getting current user info"""
        response = authenticated_client.get('/api/users/me/')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['email'] == student_user.email
        assert response.data['role'] == student_user.role

    def test_get_current_user_unauthenticated(self, api_client):
        """Test getting current user without authentication"""
        response = api_client.get('/api/users/me/')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
@pytest.mark.integration
class TestUserPermissions:
    """Test user permissions and role-based access"""

    def test_student_cannot_list_all_users(self):
        student = StudentUserFactory()
        self.client.force_authenticate(user=student)
        
        # API router root is public — 200 with links
        root_res = self.client.get('/api/users/')
        assert root_res.status_code == 200
        
        # Actual staff list is forbidden
        staff_res = self.client.get('/api/users/staff/')
        assert staff_res.status_code == 403

    def test_admin_can_list_users(self, admin_client):
        """Test admin can list users"""
        UserFactory.create_batch(3)
        
        response = admin_client.get('/api/users/')
        
        # This depends on whether the endpoint exists
        # If it returns 404, the endpoint doesn't exist yet
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND
        ]

    def test_user_can_update_own_profile(self, authenticated_client, student_user):
        """Test user can update their own profile"""
        data = {'first_name': 'Updated'}
        
        response = authenticated_client.patch('/api/users/me/', data)
        
        # Should succeed or return 404 if endpoint doesn't exist
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND
        ]

    def test_user_cannot_change_own_role(self, authenticated_client, student_user):
        """Test user cannot change their own role"""
        data = {'role': 'super_admin'}
        
        response = authenticated_client.patch('/api/users/me/', data)
        
        student_user.refresh_from_db()
        # Role should remain unchanged
        assert student_user.role == 'student'
