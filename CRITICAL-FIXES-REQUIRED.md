# CRITICAL PRODUCTION-BLOCKING FIXES REQUIRED

## ⚠️ IMMEDIATE ACTION REQUIRED - DO NOT DEPLOY TO PRODUCTION

Based on the comprehensive security audit, the following CRITICAL issues must be fixed before production deployment:

---

## 🔴 CRITICAL-01: Live Secrets in Repository

**Status:** ❌ PRODUCTION BLOCKING  
**File:** `backend/.env`  
**Risk:** All production credentials are committed to git history

### Exposed Secrets:
- PostgreSQL database credentials
- Django SECRET_KEY
- Paystack Live API keys
- Cloudinary production credentials  
- LiveKit production API keys
- Resend Live API key
- Superuser password: `gbolahan258`

### Required Actions:

1. **Immediately rotate ALL credentials:**
   ```bash
   # Generate new Django SECRET_KEY
   python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
   
   # Rotate Paystack keys (go to Paystack dashboard)
   # Rotate Cloudinary credentials (go to Cloudinary dashboard)
   # Rotate LiveKit keys (go to LiveKit dashboard)
   # Rotate Resend API key (go to Resend dashboard)
   # Change database password
   # Change superuser password
   ```

2. **Remove .env from git history:**
   ```bash
   # Install BFG Repo Cleaner
   # Download from: https://rtyley.github.io/bfg-repo-cleaner/
   
   # Remove .env from all commits
   java -jar bfg.jar --delete-files .env
   
   # Clean up
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   
   # Force push (COORDINATE WITH TEAM FIRST)
   git push origin --force --all
   ```

3. **Verify .env is in .gitignore:**
   ```bash
   # Check if .env is properly ignored
   git check-ignore backend/.env
   # Should output: backend/.env
   ```

4. **Use environment variables in production:**
   - Never commit .env files
   - Use your hosting platform's environment variable system
   - Use secrets management (AWS Secrets Manager, Azure Key Vault, etc.)

---

## 🔴 CRITICAL-02: LiveKit Webhook Authentication Bypass

**Status:** ❌ PRODUCTION BLOCKING  
**File:** `backend/classroom/webhooks.py:36-46`  
**Risk:** Attackers can forge attendance records

### The Vulnerability:
```python
try:
    event = receiver.receive(body, authorization_header)
except Exception:
    # ❌ CRITICAL: Falls back to unauthenticated parsing
    event = json.loads(body)  # No signature verification!
```

### Fix Required:
```python
try:
    event = receiver.receive(body, authorization_header)
except Exception as exc:
    logger.error("LiveKit webhook signature validation failed: %s", exc)
    return JsonResponse(
        {"error": "Invalid webhook signature"},
        status=403
    )
```

### Action:
Replace the fallback with proper error handling that rejects invalid signatures.

---

## 🔴 CRITICAL-03: Hardcoded LiveKit Fallback Credentials

**Status:** ❌ PRODUCTION BLOCKING  
**Files:**
- `backend/classroom/webhooks.py:29-30`
- `backend/config/settings.py:288-289`
- `backend/.env:23-30` (duplicate keys)

### The Problem:
1. `.env` declares LiveKit keys TWICE (lines 23-25 and 28-30)
2. Last value wins → production keys are overwritten with `devkey/secret`
3. Settings.py has hardcoded fallback: `'devkey'` / `'secret'`

### Fix Required:

**1. Fix .env** (remove duplicate):
```bash
# Keep ONLY the production keys:
LIVEKIT_API_KEY=your_production_key
LIVEKIT_API_SECRET=your_production_secret
LIVEKIT_URL=wss://your-livekit-server.com

# DELETE the duplicate dev keys at lines 28-30
```

**2. Fix settings.py** (remove hardcoded fallbacks):
```python
# Change from:
LIVEKIT_API_KEY = env.str('LIVEKIT_API_KEY', default='devkey')
LIVEKIT_API_SECRET = env.str('LIVEKIT_API_SECRET', default='secret')

# To (fail fast if missing):
LIVEKIT_API_KEY = env.str('LIVEKIT_API_KEY')  # No default!
LIVEKIT_API_SECRET = env.str('LIVEKIT_API_SECRET')  # No default!
```

**3. Fix webhooks.py** (remove hardcoded credentials):
```python
# Delete these lines entirely:
api_key = os.environ.get('LIVEKIT_API_KEY', 'devkey')
api_secret = os.environ.get('LIVEKIT_API_SECRET', 'secret')

# Use settings instead:
from django.conf import settings
api_key = settings.LIVEKIT_API_KEY
api_secret = settings.LIVEKIT_API_SECRET
```

---

## 🔴 CRITICAL-04: Vulnerable Dependencies with Known CVEs

**Status:** ❌ PRODUCTION BLOCKING  
**File:** `backend/requirements.txt`

### Vulnerable Packages:

1. **requests==2.31.0**
   - CVE-2023-43804: Cookie leak via Cookie header
   - CVE-2024-35195: Proxy-Authorization header leak (MITM risk)
   - **Fix:** `requests==2.32.3` (or latest)

2. **urllib3==1.26.20**
   - CVE-2024-37891: HTTP request smuggling
   - CVE-2023-45803: Cookie leak on redirect
   - CVE-2024-43467: Chunked encoding DoS
   - **Fix:** `urllib3==2.2.3` (or latest)

3. **django-cloudinary-storage==0.3.0**
   - Abandoned package (last release 2020)
   - Incompatible with Django 5.1 STORAGES dict
   - **Fix:** Migrate to `cloudinary==1.41.0` directly

### Required Actions:

```bash
cd backend

# Update requirements.txt:
pip install --upgrade requests urllib3 cloudinary
pip uninstall django-cloudinary-storage

# Update requirements.txt
pip freeze | grep -E "requests|urllib3|cloudinary" > temp_versions.txt
# Manually update requirements.txt with new versions

# Test everything still works
python manage.py check
pytest
```

---

## 🟠 HIGH-PRIORITY FIXES

### H-01: Bare except: Clauses (4 locations)

**Fixed in billing/views.py**. Still need to fix:
- `backend/payments/paystack/client.py:106`
- `backend/reports/utils.py:131`

**Action:** Replace `except:` with `except Exception as exc:` + logging

---

### H-03: python-magic Never Called (MIME Validation Bypass)

**Risk:** Upload .exe renamed as .pdf.jpg bypasses validation

**Fix:** Add magic-byte validation in `config/file_validators.py`:

```python
import magic

def validate_file_upload(file_obj):
    """Validate file extension AND magic bytes"""
    
    # Check extension (existing)
    ext = os.path.splitext(file_obj.name)[1].lower()
    if ext not in ALLOWED_UPLOAD_EXTENSIONS:
        raise ValidationError(f"File type {ext} not allowed")
    
    # NEW: Check magic bytes
    file_obj.seek(0)
    mime = magic.from_buffer(file_obj.read(2048), mime=True)
    file_obj.seek(0)
    
    allowed_mimes = {
        '.pdf': 'application/pdf',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        # ... add more
    }
    
    expected_mime = allowed_mimes.get(ext)
    if expected_mime and mime != expected_mime:
        raise ValidationError(
            f"File content type {mime} does not match extension {ext}"
        )
```

---

### H-04: Dev LOGGING References request_id Without Filter

**File:** `backend/config/settings.py:387`

**Fix:** Either add RequestIDFilter to dev handlers OR remove %(request_id)s from formatter

---

### H-06: 7× datetime.now() Instead of timezone.now()

**Files:**
- `backend/reports/views.py` (lines 107, 235, 312, 383, 455)
- `backend/reports/utils.py:284`
- `backend/billing/services/invoice_service.py:27`

**Fix:** Replace all `datetime.now()` with `timezone.now()` from `django.utils import timezone`

---

### H-07: Hardcoded Database Password Fallback

**File:** `backend/config/settings.py:104`

**Fix:**
```python
# Remove default parameter entirely
DATABASE_URL = env.db_url('DATABASE_URL')  # Fail fast if missing
```

---

### H-08: Hardcoded ALLOWED_HOSTS / CORS Origins

**Files:**
- `backend/config/settings.py:20-27`
- `backend/config/settings.py:216-248`
- `backend/.env:38` (typo: `httpe://`)

**Issues:**
- `ican-management-system.onrender.com` hardcoded
- `https://widerangepro.vercel.app` hardcoded (unrelated domain!)
- `.env` has typo: `PORTAL_URL=httpe://widerangepro.vercel.app`

**Fix:**
1. Remove all hardcoded origins from settings.py
2. Read ALL origins from environment variables only
3. Fix typo in .env: `httpe:` → `https:`
4. Remove `widerangepro.vercel.app` if not needed

---

## 🟡 MEDIUM-PRIORITY FIXES

### M-01: Rate Limiting Not Distributed (per-worker)

**File:** `backend/config/security_settings.py:217-236`

**Fix:** Use `env()` instead of `os.environ.get()` for Redis URL

---

### M-03: Paystack Liveness Ping on Every Health Check

**Risk:** 17,280 API calls/day → rate limiting / ban

**Fix:** Cache the result for 60 seconds

---

## 📋 DEPLOYMENT CHECKLIST

Before deploying to production:

- [ ] Rotate ALL secrets (database, Django, Paystack, Cloudinary, LiveKit, Resend)
- [ ] Remove .env from git history (BFG Repo Cleaner)
- [ ] Fix LiveKit webhook authentication bypass
- [ ] Remove hardcoded LiveKit fallback credentials
- [ ] Upgrade vulnerable dependencies (requests, urllib3)
- [ ] Remove or replace django-cloudinary-storage
- [ ] Add python-magic MIME validation
- [ ] Replace datetime.now() with timezone.now()
- [ ] Remove hardcoded database password fallback
- [ ] Remove hardcoded ALLOWED_HOSTS/CORS origins
- [ ] Fix dev LOGGING request_id issue
- [ ] Test all fixes in staging environment
- [ ] Run full security audit again
- [ ] Load test with expected production traffic

---

## 🔒 Production Deployment Environment Variables

Set these in your production environment (DO NOT commit):

```bash
# Django
DEBUG=False
SECRET_KEY=<generate-new-50-char-secret>
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
CSRF_TRUSTED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com

# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Redis
REDIS_URL=redis://your-redis-host:6379/0

# Paystack
PAYSTACK_SECRET_KEY=sk_live_<your-new-key>
PAYSTACK_PUBLIC_KEY=pk_live_<your-new-key>

# Cloudinary
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-new-api-key>
CLOUDINARY_API_SECRET=<your-new-api-secret>

# LiveKit
LIVEKIT_API_KEY=<your-new-api-key>
LIVEKIT_API_SECRET=<your-new-api-secret>
LIVEKIT_URL=wss://your-livekit-server.com

# Email
RESEND_API_KEY=<your-new-api-key>

# Sentry (optional but recommended)
SENTRY_DSN=<your-sentry-dsn>
```

---

## 📞 Support

If you need help with any of these fixes:
1. Review the full audit report in the email
2. Consult Django security best practices: https://docs.djangoproject.com/en/stable/topics/security/
3. Review OWASP Top 10: https://owasp.org/www-project-top-ten/

**DO NOT deploy to production until ALL CRITICAL fixes are completed and tested.**
