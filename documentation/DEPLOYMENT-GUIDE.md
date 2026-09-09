# ICAN Platform - Deployment Guide

Complete deployment guide for production environment.

## 📋 Pre-Deployment Checklist

### Backend
- [ ] All migrations created and tested
- [ ] Environment variables documented
- [ ] Static files collected
- [ ] Debug mode disabled
- [ ] Secret key changed
- [ ] Allowed hosts configured
- [ ] CORS settings updated
- [ ] Database backed up
- [ ] Email service configured
- [ ] Paystack keys added
- [ ] Celery configured
- [ ] Redis configured

### Frontend
- [ ] API URL updated
- [ ] Build tested locally
- [ ] Environment variables set
- [ ] Paystack public key added
- [ ] Error boundaries added
- [ ] Analytics configured (optional)

## 🐳 Docker Deployment (Recommended)

### 1. Backend Dockerfile

Create `backend/Dockerfile`:

```dockerfile
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install dependencies
COPY requirements.txt /app/
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Copy project
COPY . /app/

# Collect static files
RUN python manage.py collectstatic --noinput

# Run gunicorn
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "4"]
```

### 2. Frontend Dockerfile

Create `frontend/Dockerfile`:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 3. Nginx Configuration

Create `frontend/nginx.conf`:

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 4. Docker Compose

Create `docker-compose.yml` at project root:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: ican_db
      POSTGRES_USER: ican_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build: ./backend
    command: gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 4
    volumes:
      - ./backend:/app
      - static_volume:/app/staticfiles
      - media_volume:/app/media
    ports:
      - "8000:8000"
    env_file:
      - ./backend/.env
    depends_on:
      - postgres
      - redis
    environment:
      - DATABASE_URL=postgresql://ican_user:${DB_PASSWORD}@postgres:5432/ican_db
      - REDIS_URL=redis://redis:6379/0

  celery:
    build: ./backend
    command: celery -A config worker -l info
    volumes:
      - ./backend:/app
    env_file:
      - ./backend/.env
    depends_on:
      - postgres
      - redis
      - backend
    environment:
      - DATABASE_URL=postgresql://ican_user:${DB_PASSWORD}@postgres:5432/ican_db
      - REDIS_URL=redis://redis:6379/0

  celery-beat:
    build: ./backend
    command: celery -A config beat -l info
    volumes:
      - ./backend:/app
    env_file:
      - ./backend/.env
    depends_on:
      - postgres
      - redis
      - backend
    environment:
      - DATABASE_URL=postgresql://ican_user:${DB_PASSWORD}@postgres:5432/ican_db
      - REDIS_URL=redis://redis:6379/0

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
  redis_data:
  static_volume:
  media_volume:
```

### 5. Deploy with Docker Compose

```bash
# Create .env file with secrets
cp backend/.env.example backend/.env
# Edit backend/.env with production values

# Build and start
docker-compose up -d --build

# Run migrations
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## ☁️ Cloud Deployment Options

### Option 1: AWS (Recommended for Production)

#### Architecture
```
                          ┌─────────────┐
                          │   Route 53  │
                          │   (Domain)  │
                          └──────┬──────┘
                                 │
                          ┌──────▼──────┐
                          │ CloudFront  │
                          │    (CDN)    │
                          └──────┬──────┘
                ┌────────────────┴────────────────┐
                │                                  │
         ┌──────▼──────┐                  ┌───────▼──────┐
         │     S3      │                  │  ALB/API GW  │
         │  (Frontend) │                  │  (Load Bal)  │
         └─────────────┘                  └───────┬──────┘
                                                   │
                                          ┌────────▼────────┐
                                          │   ECS/EC2/EB    │
                                          │   (Backend)     │
                                          └────────┬────────┘
                                ┌─────────────────┼─────────────────┐
                                │                 │                 │
                         ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
                         │     RDS     │  │  ElastiCache│  │     S3      │
                         │ (PostgreSQL)│  │   (Redis)   │  │   (Media)   │
                         └─────────────┘  └─────────────┘  └─────────────┘
```

#### Backend: Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize
cd backend
eb init -p python-3.11 ican-platform

# Create environment
eb create ican-production --database.engine postgres

# Deploy
eb deploy

# Set environment variables
eb setenv DEBUG=False SECRET_KEY=your-secret-key ALLOWED_HOSTS=.elasticbeanstalk.com

# View logs
eb logs

# Open app
eb open
```

#### Frontend: S3 + CloudFront

```bash
# Build frontend
cd frontend
npm run build

# Create S3 bucket
aws s3 mb s3://ican-platform-frontend

# Enable static website hosting
aws s3 website s3://ican-platform-frontend --index-document index.html

# Upload build
aws s3 sync dist/ s3://ican-platform-frontend --acl public-read

# Create CloudFront distribution (via AWS Console or CLI)
# Point to S3 bucket
# Enable HTTPS
# Add custom domain
```

#### Database: RDS PostgreSQL

```bash
# Create via AWS Console:
# - Engine: PostgreSQL 15
# - Instance: db.t3.small (or larger)
# - Storage: 20GB SSD
# - Multi-AZ: Yes (for HA)
# - Backup retention: 7 days

# Update backend .env
DATABASE_URL=postgresql://user:pass@rds-endpoint:5432/ican_db
```

#### Cache: ElastiCache Redis

```bash
# Create via AWS Console:
# - Engine: Redis 7
# - Node type: cache.t3.micro
# - Number of replicas: 1

# Update backend .env
REDIS_URL=redis://elasticache-endpoint:6379/0
```

### Option 2: Heroku (Quick & Easy)

#### Backend

```bash
# Install Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

cd backend

# Login
heroku login

# Create app
heroku create ican-platform-api

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Add Redis
heroku addons:create heroku-redis:mini

# Set environment variables
heroku config:set DEBUG=False
heroku config:set SECRET_KEY=your-secret-key
heroku config:set ALLOWED_HOSTS=.herokuapp.com

# Create Procfile
echo "web: gunicorn config.wsgi:application --bind 0.0.0.0:\$PORT" > Procfile
echo "worker: celery -A config worker -l info" >> Procfile
echo "beat: celery -A config beat -l info" >> Procfile

# Deploy
git push heroku main

# Run migrations
heroku run python manage.py migrate

# Create superuser
heroku run python manage.py createsuperuser

# Open app
heroku open
```

#### Frontend (Vercel)

```bash
# Install Vercel CLI
npm install -g vercel

cd frontend

# Deploy
vercel

# Follow prompts
# Set VITE_API_URL to Heroku backend URL

# Production deployment
vercel --prod
```

### Option 3: DigitalOcean

#### App Platform

1. **Backend**
   - Create App from GitHub repo
   - Select backend folder
   - Add PostgreSQL database
   - Add Redis cache
   - Set environment variables
   - Deploy

2. **Frontend**
   - Create static site from GitHub repo
   - Select frontend folder
   - Add build command: `npm run build`
   - Add output directory: `dist`
   - Deploy

## 🔧 Production Settings

### Backend `.env` Template

```env
# Django
DEBUG=False
SECRET_KEY=your-very-long-random-secret-key-change-this
ALLOWED_HOSTS=api.yourdomain.com,yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com

# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Redis
REDIS_URL=redis://host:6379/0

# Email
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Paystack
PAYSTACK_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxx
PAYSTACK_PUBLIC_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxx

# Celery
CELERY_BROKER_URL=redis://host:6379/0
CELERY_RESULT_BACKEND=redis://host:6379/0

# Storage (if using S3)
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_STORAGE_BUCKET_NAME=your-bucket
AWS_S3_REGION_NAME=us-east-1
```

### Frontend `.env` Template

```env
VITE_API_URL=https://api.yourdomain.com
VITE_PAYSTACK_PUBLIC_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxx
VITE_APP_NAME=ICAN Tutorial Centre
```

### Django Production Settings

Update `backend/config/settings.py`:

```python
import os
from pathlib import Path

# SECURITY
DEBUG = os.getenv('DEBUG', 'False') == 'True'
SECRET_KEY = os.getenv('SECRET_KEY')
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '').split(',')

# HTTPS
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# HSTS
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Database
import dj_database_url
DATABASES = {
    'default': dj_database_url.config(
        default=os.getenv('DATABASE_URL'),
        conn_max_age=600
    )
}

# Static files (production)
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Media files (S3)
if os.getenv('AWS_STORAGE_BUCKET_NAME'):
    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
    AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
    AWS_STORAGE_BUCKET_NAME = os.getenv('AWS_STORAGE_BUCKET_NAME')
    AWS_S3_REGION_NAME = os.getenv('AWS_S3_REGION_NAME', 'us-east-1')
    AWS_DEFAULT_ACL = 'public-read'
    AWS_S3_CUSTOM_DOMAIN = f'{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com'
    MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/media/'

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'ERROR',
            'class': 'logging.FileHandler',
            'filename': 'errors.log',
            'formatter': 'verbose',
        },
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
    },
}
```

## 🔒 Security Checklist

- [ ] Change all default passwords
- [ ] Use strong SECRET_KEY (50+ random characters)
- [ ] Enable HTTPS
- [ ] Set secure cookies
- [ ] Enable HSTS
- [ ] Configure CORS properly
- [ ] Use environment variables for secrets
- [ ] Enable database backups
- [ ] Set up monitoring and alerts
- [ ] Configure rate limiting
- [ ] Review and test all permissions
- [ ] Enable 2FA for admin accounts
- [ ] Regular security updates
- [ ] Audit logs enabled

## 📊 Monitoring

### Sentry (Error Tracking)

```bash
pip install sentry-sdk

# In settings.py
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration

sentry_sdk.init(
    dsn=os.getenv('SENTRY_DSN'),
    integrations=[DjangoIntegration()],
    traces_sample_rate=1.0,
    environment='production',
)
```

### New Relic (Performance)

```bash
pip install newrelic

# Run with
NEW_RELIC_CONFIG_FILE=newrelic.ini newrelic-admin run-program gunicorn config.wsgi
```

## 🔄 CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Run tests
        run: |
          cd backend
          pip install -r requirements.txt
          python manage.py test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        run: |
          # Your deployment commands here
          # e.g., eb deploy, git push heroku, etc.
```

## 📝 Post-Deployment

1. **Verify Deployment**
   - Test all endpoints
   - Check frontend loads
   - Test authentication
   - Complete payment flow
   - Check email delivery
   - Test Paystack webhook

2. **Configure DNS**
   ```
   A     @           IP_ADDRESS
   CNAME www         yourdomain.com
   CNAME api         api-server-address
   ```

3. **SSL Certificate**
   - Use Let's Encrypt (free)
   - Or AWS Certificate Manager
   - Or CloudFlare SSL

4. **Backups**
   ```bash
   # Database backup (daily cron)
   0 2 * * * pg_dump ican_db > /backups/ican_$(date +\%Y\%m\%d).sql
   
   # Rotate old backups (keep 30 days)
   find /backups -name "ican_*.sql" -mtime +30 -delete
   ```

5. **Monitoring Setup**
   - Health checks every 5 minutes
   - Alert if down > 2 minutes
   - Monitor disk space
   - Monitor database connections
   - Track error rates

## 🚨 Rollback Plan

If deployment fails:

```bash
# Docker
docker-compose down
docker-compose up -d --build

# Heroku
heroku rollback

# EB
eb deploy --version VERSION_LABEL

# Manual
git revert HEAD
git push origin main
```

## 📞 Support

For deployment issues:
- Check logs first
- Review error messages
- Test locally with production settings
- Contact cloud provider support
- Review documentation

---

**Deployment Complete! 🎉**

Monitor the application for the first 24-48 hours and be ready to respond to any issues.
