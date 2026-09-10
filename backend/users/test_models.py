"""
Unit tests for User models
"""
import pytest
from django.contrib.auth import get_user_model
from django.db import IntegrityError

User = get_user_model()


@pytest.mark.django_db
@pytest.mark.unit
class TestUserModel:
    """Test User model"""

    def test_create_user_with_email(self):
        """Test creating a user with email"""
        user = User.objects.create_user(
            email='test@ican.edu',
            password='testpass123',
            role='student'
        )
        assert user.email == 'test@ican.edu'
        assert user.check_password('testpass123')
        assert user.role == 'student'
        assert user.is_active is True
        assert user.is_staff is False
        assert user.is_superuser is False

    def test_create_superuser(self):
        """Test creating a superuser"""
        admin = User.objects.create_superuser(
            email='admin@ican.edu',
            password='adminpass123'
        )
        assert admin.email == 'admin@ican.edu'
        assert admin.is_staff is True
        assert admin.is_superuser is True
        assert admin.is_active is True
        assert admin.role == 'super_admin'

    def test_user_email_is_normalized(self):
        """Test that email is normalized"""
        user = User.objects.create_user(
            email='Test@ICAN.EDU',
            password='testpass123'
        )
        assert user.email == 'test@ican.edu'

    def test_user_email_is_required(self):
        """Test that email is required"""
        with pytest.raises(ValueError, match='Email is required'):
            User.objects.create_user(email='', password='testpass123')

    def test_user_email_is_unique(self):
        """Test that email must be unique"""
        User.objects.create_user(
            email='test@ican.edu',
            password='testpass123'
        )
        with pytest.raises(IntegrityError):
            User.objects.create_user(
                email='test@ican.edu',
                password='anotherpass'
            )

    def test_user_str_representation(self):
        """Test string representation of user"""
        user = User.objects.create_user(
            email='test@ican.edu',
            password='testpass123'
        )
        assert str(user) == 'test@ican.edu'

    def test_user_role_choices(self):
        """Test that role must be valid choice"""
        valid_roles = ['student', 'super_admin', 'manager', 'student_officer', 'finance_officer']
        
        for role in valid_roles:
            user = User.objects.create_user(
                email=f'{role}@ican.edu',
                password='testpass123',
                role=role
            )
            assert user.role == role

    def test_user_inactive_by_default_if_specified(self):
        """Test user can be created as inactive"""
        user = User.objects.create_user(
            email='inactive@ican.edu',
            password='testpass123',
            is_active=False
        )
        assert user.is_active is False


@pytest.mark.django_db
@pytest.mark.unit
class TestStaffProfile:
    """Test StaffProfile model"""

    def test_create_staff_profile(self, staff_user):
        """Test creating a staff profile"""
        from users.models import StaffProfile
        
        profile = StaffProfile.objects.create(
            user=staff_user,
            first_name='John',
            last_name='Doe',
            phone_number='+2348012345678',
            employee_id='EMP001'
        )
        
        assert profile.user == staff_user
        assert profile.first_name == 'John'
        assert profile.last_name == 'Doe'
        assert profile.employee_id == 'EMP001'
        assert str(profile) == f'Staff: {staff_user.email}'

    def test_staff_profile_one_to_one_with_user(self, staff_user):
        """Test staff profile has one-to-one relationship with user"""
        from users.models import StaffProfile
        
        StaffProfile.objects.create(
            user=staff_user,
            first_name='John',
            last_name='Doe',
            employee_id='EMP001'
        )
        
        # Trying to create another profile for same user should fail
        with pytest.raises(IntegrityError):
            StaffProfile.objects.create(
                user=staff_user,
                first_name='Jane',
                last_name='Smith',
                employee_id='EMP002'
            )
