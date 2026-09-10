"""
Pytest configuration and shared fixtures
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


@pytest.fixture
def api_client():
    """Return DRF API client"""
    return APIClient()


@pytest.fixture
def user_factory(db):
    """Factory for creating users"""
    def create_user(
        email='test@ican.edu',
        password='testpass123',
        role='student',
        is_active=True,
        **kwargs
    ):
        user = User.objects.create_user(
            email=email,
            password=password,
            role=role,
            is_active=is_active,
            **kwargs
        )
        return user
    return create_user


@pytest.fixture
def student_user(user_factory):
    """Create a student user"""
    return user_factory(email='student@ican.edu', role='student')


@pytest.fixture
def staff_user(user_factory):
    """Create a staff user with student_officer role"""
    return user_factory(email='staff@ican.edu', role='student_officer')


@pytest.fixture
def admin_user(user_factory):
    """Create an admin user"""
    return user_factory(email='admin@ican.edu', role='super_admin', is_staff=True)


@pytest.fixture
def finance_user(user_factory):
    """Create a finance user"""
    return user_factory(email='finance@ican.edu', role='finance_officer')


@pytest.fixture
def authenticated_client(api_client, student_user):
    """Return API client authenticated as student"""
    refresh = RefreshToken.for_user(student_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client


@pytest.fixture
def staff_client(api_client, staff_user):
    """Return API client authenticated as staff"""
    refresh = RefreshToken.for_user(staff_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client


@pytest.fixture
def admin_client(api_client, admin_user):
    """Return API client authenticated as admin"""
    refresh = RefreshToken.for_user(admin_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client


@pytest.fixture
def finance_client(api_client, finance_user):
    """Return API client authenticated as finance officer"""
    refresh = RefreshToken.for_user(finance_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client
