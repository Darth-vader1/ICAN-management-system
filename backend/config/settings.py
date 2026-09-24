"""
Django settings for the ICAN Tutorial Centre platform.
All secrets/config come from environment variables — never hard-coded.
"""
import os
from datetime import timedelta
from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env(
    DEBUG=(bool, False),
)
environ.Env.read_env(os.path.join(BASE_DIR, ".env"))

DEBUG = env("DEBUG", default=False)
SECRET_KEY = env("SECRET_KEY")
ALLOWED_HOSTS = env.list(
    "ALLOWED_HOSTS",
    default=[
        "localhost",
        "127.0.0.1",
    ],
)

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "cloudinary_storage",
    "cloudinary",
    # third-party
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "django_filters",
    "corsheaders",
    "django_celery_beat",
    # local apps
    "users",
    "students",
    "academics",
    "enrollments",
    "billing",
    "payments",
    "attendance",
    "notifications",
    "reports",
    "audit",
    "classroom",
]

# Check if WhiteNoise is available in the local environment.
# Use importlib so Pylance does not flag an unresolved optional import,
# then conditionally insert the middleware string at runtime.
import importlib.util as _importlib_util

HAS_WHITENOISE = _importlib_util.find_spec("whitenoise") is not None
del _importlib_util

MIDDLEWARE = [
    "config.request_id_middleware.RequestIDMiddleware",
    "django.middleware.security.SecurityMiddleware",
    *(["whitenoise.middleware.WhiteNoiseMiddleware"] if HAS_WHITENOISE else []),
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "audit.middleware.AuditLogMiddleware",
    'config.security_middleware.SecurityHeadersMiddleware',
    'config.security_middleware.SensitiveDataMiddleware',
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],  # Add project-level templates directory
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

DATABASES = {
    "default": env.db("DATABASE_URL", default="postgres://postgres:postgres@localhost:5432/ican_platform")
}

READ_REPLICA_URL = env("DATABASE_READ_REPLICA_URL", default="")
if READ_REPLICA_URL:
    DATABASES["replica"] = env.db_url_config(READ_REPLICA_URL)

AUTH_USER_MODEL = "users.User"

PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.Argon2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher",
]

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 10}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = env("TIME_ZONE", default="Africa/Lagos")
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# ---- Cloudinary Configuration ----
CLOUDINARY_STORAGE = {
    "CLOUD_NAME": env("CLOUDINARY_CLOUD_NAME", default=""),
    "API_KEY": env("CLOUDINARY_API_KEY", default=""),
    "API_SECRET": env("CLOUDINARY_API_SECRET", default=""),
    "PREFIX": env("CLOUDINARY_PREFIX", default="ican"),
}

HAS_CLOUDINARY = bool(
    CLOUDINARY_STORAGE["CLOUD_NAME"]
    and CLOUDINARY_STORAGE["API_KEY"]
    and CLOUDINARY_STORAGE["API_SECRET"]
)

WHITENOISE_MANIFEST_STRICT = False

STORAGES = {
    "default": {
        "BACKEND": "cloudinary_storage.storage.MediaCloudinaryStorage"
        if HAS_CLOUDINARY
        else "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedStaticFilesStorage"
        if (HAS_WHITENOISE and not DEBUG)
        else "django.contrib.staticfiles.storage.StaticFilesStorage",
    },
}

# Backward compatibility for django-cloudinary-storage (deprecated in Django 5.1+)
STATICFILES_STORAGE = STORAGES["staticfiles"]["BACKEND"]
DEFAULT_FILE_STORAGE = STORAGES["default"]["BACKEND"]

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ---- REST Framework ----
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "users.authentication.CookieOrHeaderJWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    "EXCEPTION_HANDLER": "users.exceptions.structured_exception_handler",
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_COOKIE": "access_token",
    "AUTH_COOKIE_REFRESH": "refresh_token",
    "AUTH_COOKIE_DOMAIN": None,
    "AUTH_COOKIE_SECURE": not DEBUG,
    "AUTH_COOKIE_HTTP_ONLY": True,
    "AUTH_COOKIE_PATH": "/",
    "AUTH_COOKIE_SAMESITE": "Lax",
}

# ---- CORS & CSRF ----
CORS_ALLOWED_ORIGINS = env.list(
    "CORS_ALLOWED_ORIGINS",
    default=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://widerangepro.vercel.app",
        "https://skinking-emeline-unappareled.ngrok-free.dev",
    ],
)
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGIN_REGEXES = env.list(
    "CORS_ALLOWED_ORIGIN_REGEXES",
    default=[],
)

CSRF_TRUSTED_ORIGINS = env.list(
    "CSRF_TRUSTED_ORIGINS",
    default=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://widerangepro.vercel.app",
        "https://skinking-emeline-unappareled.ngrok-free.dev",
    ],
)

# ---- Celery ----
CELERY_BROKER_URL = env("REDIS_URL", default="redis://localhost:6379/0")
CELERY_RESULT_BACKEND = env("REDIS_URL", default="redis://localhost:6379/0")
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_TIMEZONE = TIME_ZONE

# ---- Paystack ----
PAYSTACK_PUBLIC_KEY = env("PAYSTACK_PUBLIC_KEY", default="")
PAYSTACK_SECRET_KEY = env("PAYSTACK_SECRET_KEY", default="")
PAYSTACK_WEBHOOK_SECRET = env("PAYSTACK_WEBHOOK_SECRET", default="")

# ---- Email ----
EMAIL_PROVIDER = env("EMAIL_PROVIDER", default="console")  # Options: console, resend, sendgrid, ses
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="noreply@icantutorial.edu")

# Email template context URLs
PORTAL_URL = env("PORTAL_URL", default="http://localhost:5173")
SUPPORT_URL = env("SUPPORT_URL", default="http://localhost:5173/support")
PRIVACY_URL = env("PRIVACY_URL", default="http://localhost:5173/privacy")

# Resend
RESEND_API_KEY = env("RESEND_API_KEY", default="")

# SendGrid
SENDGRID_API_KEY = env("SENDGRID_API_KEY", default="")

# Amazon SES
AWS_SES_REGION = env("AWS_SES_REGION", default="us-east-1")
AWS_ACCESS_KEY_ID = env("AWS_ACCESS_KEY_ID", default="")
AWS_SECRET_ACCESS_KEY = env("AWS_SECRET_ACCESS_KEY", default="")

# ---- WhatsApp ----
WHATSAPP_API_KEY = env("WHATSAPP_API_KEY", default="")
WHATSAPP_PHONE_NUMBER_ID = env("WHATSAPP_PHONE_NUMBER_ID", default="")

# ---- LiveKit ----
LIVEKIT_URL = env("LIVEKIT_URL", default="ws://localhost:7880")
LIVEKIT_API_KEY = env("LIVEKIT_API_KEY", default="devkey")
LIVEKIT_API_SECRET = env("LIVEKIT_API_SECRET", default="secret")

# ---- File upload security ----
FILE_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_UPLOAD_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png"]

SECURE_SSL_REDIRECT = env.bool("SECURE_SSL_REDIRECT", default=not DEBUG)
if not DEBUG:
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000

def _ensure_logging_dirs(logging_cfg: dict) -> dict:
    """
    Ensure any filesystem directories referenced by LOGGING file handlers
    actually exist. Django's dictConfig applies handlers at import-time and
    crashes the entire process with `FileNotFoundError` when a parent
    directory is missing — which is guaranteed to happen on a fresh
    checkout. We create directories on the fly and, for any handler whose
    target file still can't be opened, demote it to a StreamHandler so the
    application stays bootable.
    """
    import os as _os
    import logging as _logging

    handlers = logging_cfg.get("handlers", {}) or {}
    for _handler_name, _handler_cfg in list(handlers.items()):
        _filename = _handler_cfg.get("filename")
        if not _filename:
            continue
        try:
            _dir_name = _os.path.dirname(_os.path.abspath(_filename))
            _os.makedirs(_dir_name, exist_ok=True)
        except OSError as _exc:
            _logging.getLogger(__name__).warning(
                "Failed to create log directory %s for handler %r (%s); "
                "demoting handler to console to keep application bootable.",
                _dir_name,
                _handler_name,
                _exc,
            )
            _fallback = {
                "level": _handler_cfg.get("level", "INFO"),
                "class": "logging.StreamHandler",
                "formatter": _handler_cfg.get("formatter", "simple"),
            }
            handlers[_handler_name] = _fallback
    return logging_cfg


if not DEBUG:
    # Import the security module as a plain object then copy every production
    # setting we care about into this module's globals(). Keeping a single
    # authoritative list of names here removes the Pylance "X is not accessed"
    # warnings that sprung from binding unused import names just to do a
    # globals() write afterward.
    from . import security_settings as _sec  # type: ignore[attr-defined]

    _SECURITY_KEYS = (
        "SECURE_HSTS_INCLUDE_SUBDOMAINS",
        "SECURE_HSTS_PRELOAD",
        "SECURE_PROXY_SSL_HEADER",
        "SESSION_COOKIE_HTTPONLY",
        "SESSION_COOKIE_SAMESITE",
        "SESSION_COOKIE_AGE",
        "CSRF_COOKIE_HTTPONLY",
        "CSRF_COOKIE_SAMESITE",
        "SECURE_CONTENT_TYPE_NOSNIFF",
        "SECURE_BROWSER_XSS_FILTER",
        "X_FRAME_OPTIONS",
        "CORS_EXPOSE_HEADERS",
        "CONN_MAX_AGE",
        "RATELIMIT_ENABLE",
        "RATELIMIT_USE_CACHE",
        "DATA_UPLOAD_MAX_MEMORY_SIZE",
        "FILE_UPLOAD_PERMISSIONS",
        "FILE_UPLOAD_DIRECTORY_PERMISSIONS",
        "CACHES",
        "AUTH_PASSWORD_VALIDATORS",
    )
    for _k in _SECURITY_KEYS:
        if hasattr(_sec, _k):
            globals()[_k] = getattr(_sec, _k)
    del _k

    if hasattr(_sec, "LOGGING"):
        globals()["LOGGING"] = _ensure_logging_dirs(_sec.LOGGING)
else:
    LOGGING = _ensure_logging_dirs({
        "version": 1,
        "disable_existing_loggers": False,
        "filters": {
            "request_id": {
                "()": "config.request_id_middleware.RequestIDFilter",
            },
        },
        "formatters": {
            "verbose": {
                "format": "{levelname} {asctime} {module} {process:d} {thread:d} [{request_id}] {message}",
                "style": "{",
            },
            "simple": {
                "format": "{levelname} [{request_id}] {name}: {message}",
                "style": "{",
            },
        },
        "handlers": {
            "console": {
                "level": "DEBUG",
                "filters": ["request_id"],
                "class": "logging.StreamHandler",
                "formatter": "verbose",
            },
            "file": {
                "level": "WARNING",
                "filters": ["request_id"],
                "class": "logging.FileHandler",
                "filename": os.path.join(str(BASE_DIR), "logs", "django.log"),
                "formatter": "verbose",
            },
        },
        "root": {
            "handlers": ["console", "file"],
            "level": "INFO",
        },
        "loggers": {
            "django.db.backends": {
                "level": "WARNING",
                "handlers": ["console"],
                "propagate": False,
            },
        },
    })

    if "CACHES" not in globals():
        CACHES = {
            "default": {
                "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            }
        }

# Sentry Error Tracking & APM Integration
SENTRY_DSN = env("SENTRY_DSN", default="")
if SENTRY_DSN:
    try:
        import sentry_sdk
        from sentry_sdk.integrations.django import DjangoIntegration
        from sentry_sdk.integrations.celery import CeleryIntegration

        sentry_sdk.init(
            dsn=SENTRY_DSN,
            integrations=[
                DjangoIntegration(),
                CeleryIntegration(),
            ],
            traces_sample_rate=env.float("SENTRY_TRACES_SAMPLE_RATE", default=0.1),
            send_default_pii=False,
            environment=env("ENVIRONMENT", default="development" if DEBUG else "production"),
        )
    except ImportError:
        pass