# Testing Guide for ICAN Platform Backend

## Overview

This document provides guidance on running tests, writing new tests, and understanding the test infrastructure for the ICAN Tutorial Centre Management Platform backend.

## Testing Stack

- **pytest**: Test framework
- **pytest-django**: Django integration for pytest
- **pytest-cov**: Coverage reporting
- **pytest-mock**: Mocking utilities
- **factory-boy**: Test data factories
- **faker**: Fake data generation

## Installation

All testing dependencies are in `requirements.txt`:

```bash
pip install -r requirements.txt
```

## Running Tests

### Run all tests
```bash
pytest
```

### Run with coverage report
```bash
pytest --cov
```

### Run specific test file
```bash
pytest users/test_models.py
```

### Run specific test class
```bash
pytest users/test_models.py::TestUserModel
```

### Run specific test function
```bash
pytest users/test_models.py::TestUserModel::test_create_user_with_email
```

### Run tests by marker
```bash
# Run only unit tests
pytest -m unit

# Run only integration tests
pytest -m integration

# Run auth tests
pytest -m auth

# Run enrollment tests
pytest -m enrollment
```

### Run tests in parallel (faster)
```bash
pip install pytest-xdist
pytest -n auto
```

### Generate HTML coverage report
```bash
pytest --cov --cov-report=html
# Open htmlcov/index.html in browser
```

## Test Markers

Tests can be marked with the following markers (defined in `pytest.ini`):

- `@pytest.mark.unit` - Unit tests (models, utilities)
- `@pytest.mark.integration` - Integration tests (API endpoints)
- `@pytest.mark.slow` - Slow running tests
- `@pytest.mark.auth` - Authentication tests
- `@pytest.mark.enrollment` - Enrollment workflow tests
- `@pytest.mark.billing` - Billing tests
- `@pytest.mark.payments` - Payment integration tests
- `@pytest.mark.notifications` - Notification tests

## Project Structure

```
backend/
├── conftest.py              # Shared fixtures
├── factories.py             # Test data factories
├── pytest.ini               # Pytest configuration
├── .coveragerc              # Coverage configuration
├── TESTING.md               # This file
│
├── users/
│   ├── test_models.py       # User model tests
│   ├── test_views.py        # User API tests
│   └── test_permissions.py  # Permission tests
│
├── students/
│   ├── test_models.py
│   └── test_views.py
│
├── academics/
│   ├── test_models.py
│   └── test_views.py
│
├── enrollments/
│   ├── test_models.py
│   ├── test_views.py
│   └── test_workflows.py    # Enrollment workflow tests
│
├── billing/
│   ├── test_models.py
│   ├── test_views.py
│   └── test_services.py     # Service layer tests
│
└── payments/
    ├── test_models.py
    ├── test_views.py
    └── test_paystack.py     # Paystack integration tests
```

## Shared Fixtures

Common fixtures are defined in `conftest.py`:

### User Fixtures
```python
def test_with_student(student_user):
    """student_user fixture creates a student"""
    assert student_user.role == 'student'

def test_with_staff(staff_user):
    """staff_user fixture creates a staff member"""
    assert staff_user.role == 'student_officer'

def test_with_admin(admin_user):
    """admin_user fixture creates an admin"""
    assert admin_user.role == 'super_admin'
```

### API Client Fixtures
```python
def test_authenticated_endpoint(authenticated_client):
    """authenticated_client is logged in as student"""
    response = authenticated_client.get('/api/students/me/')
    assert response.status_code == 200

def test_staff_endpoint(staff_client):
    """staff_client is logged in as staff"""
    response = staff_client.get('/api/students/')
    assert response.status_code == 200

def test_admin_endpoint(admin_client):
    """admin_client is logged in as admin"""
    response = admin_client.get('/api/users/')
    assert response.status_code == 200
```

## Test Data Factories

Use factories from `factories.py` to create test data:

```python
from factories import StudentFactory, EnrollmentFactory, InvoiceFactory

def test_with_factories():
    # Create a student with all related objects
    student = StudentFactory()
    
    # Create enrollment for student
    enrollment = EnrollmentFactory(student=student)
    
    # Create invoice for enrollment
    invoice = InvoiceFactory(enrollment=enrollment, amount=50000)
    
    assert invoice.enrollment.student == student
```

## Writing Tests

### Unit Test Example (Models)
```python
import pytest
from django.db import IntegrityError
from students.models import Student

@pytest.mark.django_db
@pytest.mark.unit
class TestStudentModel:
    
    def test_create_student(self):
        """Test creating a student"""
        from factories import StudentFactory
        student = StudentFactory(first_name='John', last_name='Doe')
        
        assert student.first_name == 'John'
        assert student.last_name == 'Doe'
        assert student.student_id is not None
    
    def test_student_full_name(self):
        """Test student full_name property"""
        from factories import StudentFactory
        student = StudentFactory(first_name='Jane', last_name='Smith')
        
        assert student.full_name == 'Jane Smith'
```

### Integration Test Example (API)
```python
import pytest
from rest_framework import status

@pytest.mark.django_db
@pytest.mark.integration
class TestStudentAPI:
    
    def test_list_students_as_staff(self, staff_client):
        """Test staff can list students"""
        from factories import StudentFactory
        StudentFactory.create_batch(3)
        
        response = staff_client.get('/api/students/')
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 3
    
    def test_list_students_as_student_forbidden(self, authenticated_client):
        """Test students cannot list all students"""
        response = authenticated_client.get('/api/students/')
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_create_student(self, staff_client):
        """Test creating a student via API"""
        data = {
            'email': 'newstudent@ican.edu',
            'first_name': 'New',
            'last_name': 'Student',
            'date_of_birth': '2000-01-01',
            'phone_number': '+2348012345678',
        }
        
        response = staff_client.post('/api/students/', data)
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['email'] == 'newstudent@ican.edu'
```

### Mocking External Services
```python
import pytest
from unittest.mock import patch, MagicMock

@pytest.mark.django_db
@pytest.mark.integration
@pytest.mark.payments
class TestPaystackIntegration:
    
    @patch('payments.services.paystack_service.requests.post')
    def test_initialize_payment(self, mock_post, authenticated_client):
        """Test payment initialization with mocked Paystack"""
        # Mock Paystack response
        mock_response = MagicMock()
        mock_response.json.return_value = {
            'status': True,
            'data': {
                'authorization_url': 'https://paystack.com/pay/abc123',
                'reference': 'ref_123456'
            }
        }
        mock_post.return_value = mock_response
        
        # Make request
        data = {'invoice_id': 1, 'amount': 50000}
        response = authenticated_client.post('/api/payments/initialize/', data)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'authorization_url' in response.data
```

## Best Practices

### 1. Use Fixtures and Factories
✅ **Good**:
```python
def test_enrollment(enrollment):  # Use fixture
    assert enrollment.status == 'pending'

def test_with_student():
    student = StudentFactory()  # Use factory
    assert student.student_id is not None
```

❌ **Bad**:
```python
def test_enrollment():
    # Don't create objects manually
    user = User.objects.create(email='test@ican.edu')
    student = Student.objects.create(user=user, ...)
```

### 2. Test One Thing Per Test
✅ **Good**:
```python
def test_student_creation():
    """Test creating a student"""
    student = StudentFactory()
    assert student.student_id is not None

def test_student_full_name():
    """Test student full_name property"""
    student = StudentFactory(first_name='John', last_name='Doe')
    assert student.full_name == 'John Doe'
```

❌ **Bad**:
```python
def test_student():
    """Test everything about students"""
    student = StudentFactory()
    assert student.student_id is not None
    assert student.full_name == 'John Doe'
    assert student.email is not None
    # Too many assertions
```

### 3. Use Descriptive Test Names
✅ **Good**:
```python
def test_student_cannot_enroll_without_payment():
    """Test that enrollment requires payment"""
    pass

def test_staff_can_view_all_students():
    """Test staff have permission to list students"""
    pass
```

❌ **Bad**:
```python
def test_enrollment():
    """Test enrollment"""
    pass

def test_students():
    """Test students"""
    pass
```

### 4. Mark Tests Appropriately
```python
@pytest.mark.unit
def test_model_method():
    """Unit tests for isolated functionality"""
    pass

@pytest.mark.integration
def test_api_endpoint():
    """Integration tests for API"""
    pass

@pytest.mark.slow
@pytest.mark.integration
def test_complex_workflow():
    """Mark slow tests to run separately"""
    pass
```

### 5. Use pytest.raises for Exceptions
```python
def test_invalid_email_raises_error():
    """Test that invalid email raises ValueError"""
    with pytest.raises(ValueError, match='Email is required'):
        User.objects.create_user(email='', password='test')
```

### 6. Clean Test Data
Tests using `@pytest.mark.django_db` automatically rollback database changes. No manual cleanup needed.

## Coverage Goals

- **Overall**: > 80%
- **Models**: > 90%
- **Views**: > 80%
- **Services**: > 85%
- **Utilities**: > 90%

## CI/CD Integration

Tests run automatically on push via GitHub Actions (to be configured):

```yaml
# .github/workflows/tests.yml
name: Run Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: |
          pip install -r requirements.txt
          pytest --cov --cov-report=xml
      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

## Troubleshooting

### Tests fail with "django.db.utils.OperationalError"
**Solution**: Ensure test database is created. Pytest should handle this automatically.

### "ImportError: No module named pytest"
**Solution**: Install test dependencies:
```bash
pip install -r requirements.txt
```

### Tests are very slow
**Solution**: 
1. Use `--reuse-db` flag (already in pytest.ini)
2. Use `--nomigrations` flag (already in pytest.ini)
3. Run in parallel: `pytest -n auto`

### Coverage report not generating
**Solution**: Check `.coveragerc` configuration and ensure pytest-cov is installed.

## Resources

- [pytest documentation](https://docs.pytest.org/)
- [pytest-django documentation](https://pytest-django.readthedocs.io/)
- [factory-boy documentation](https://factoryboy.readthedocs.io/)
- [Django testing documentation](https://docs.djangoproject.com/en/5.1/topics/testing/)

---

**Last Updated**: September 9, 2026  
**Maintained By**: Development Team
