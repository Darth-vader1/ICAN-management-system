# Security: Seed Script Credential Exposure

## Issue: MEDIUM 🟡

**File:** `backend/create_seed_data.py` (Lines 1013-1023)

### Problem
The seed data script prints all default account credentials in plaintext ASCII table format:

```python
print("\n📋 Summary of Created Accounts:")
print("=" * 60)
print(f"{'Role':<20} {'Email':<30} {'Password':<20}")
print("=" * 60)
print(f"{'Super Admin':<20} {'admin@ican.edu':<30} {'admin123456':<20}")
print(f"{'Manager':<20} {'manager@ican.edu':<30} {'manager123456':<20}")
# ... more accounts
```

### Security Risk
- **Risk Level:** MEDIUM (not HIGH because it's a one-off development script)
- **Impact:** If this script runs in production (by mistake), it exposes all default credentials
- **Likelihood:** Low (dev artifact), but possible if accidentally deployed

### Mitigation Applied

1. **Added to `.gitignore`**
   - File: `.gitignore`
   - Pattern: `backend/create_seed_data.py` and `create_seed_data.py`
   - Prevents future commits of the seed script

2. **Removed from git tracking**
   - Command: `git rm --cached backend/create_seed_data.py`
   - File remains locally but won't be committed to repository
   - Prevents script from reaching production deployments

### Recommendations

#### For Development
1. **Use environment-specific seed data:**
   ```python
   # Only run in development
   if not settings.DEBUG:
       raise CommandError("Seed script must not run in production")
   ```

2. **Don't print passwords:**
   ```python
   # Instead of printing passwords:
   print(f"{'Super Admin':<20} {'admin@ican.edu':<30} {'[HIDDEN]':<20}")
   ```

3. **Generate random passwords:**
   ```python
   import secrets
   password = secrets.token_urlsafe(16)
   # Store in environment variable or secrets manager
   ```

#### For Production
1. **Never use default credentials in production**
2. **Use Django management commands instead:**
   ```bash
   python manage.py createsuperuser
   ```
3. **Use environment variables for initial credentials**
4. **Implement password rotation policies**

### Alternative Approach

Create a safer seed command:

```python
# backend/users/management/commands/seed_dev_data.py
from django.core.management.base import BaseCommand
from django.conf import settings

class Command(BaseCommand):
    help = 'Seed development data (DEV ONLY)'

    def handle(self, *args, **options):
        if not settings.DEBUG:
            raise CommandError("This command can only run in DEBUG mode")
        
        # Create seed data without printing passwords
        self.stdout.write(self.style.SUCCESS('Seed data created'))
        self.stdout.write('Check README.md for default credentials')
```

### Status
- ✅ File added to `.gitignore`
- ✅ File removed from git tracking
- ✅ File remains locally for development use
- ⚠️ Consider refactoring to use Django management command
- ⚠️ Consider generating random passwords and storing securely

### Notes
- This is a **development-only script** and should never run in production
- Default passwords should be changed immediately after first login
- Consider implementing forced password change on first login for seed accounts
