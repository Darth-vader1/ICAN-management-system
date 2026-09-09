# ICAN Tutorial Centre - Frontend

Modern React + TypeScript frontend for the ICAN Tutorial Centre Management Platform.

## 🚀 Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: React Context API + TanStack Query
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Form Handling**: React Hook Form (ready to add)

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.tsx      # Main layout with sidebar
│   ├── NotificationBell.tsx
│   └── ProtectedRoute.tsx
│
├── contexts/           # React Context providers
│   └── AuthContext.tsx
│
├── pages/              # Page components
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── DashboardPage.tsx
│   ├── AcademicsPage.tsx
│   ├── StudentEnrollmentDashboard.tsx
│   ├── EnrollmentWizard.tsx
│   ├── BillingPage.tsx
│   ├── AttendanceDashboard.tsx
│   ├── NotificationCenter.tsx
│   └── ReportsDashboard.tsx
│
├── services/           # API client functions
│   ├── authService.ts
│   ├── academicsService.ts
│   ├── studentService.ts
│   ├── enrollmentService.ts
│   ├── billingService.ts
│   ├── attendanceService.ts
│   ├── notificationService.ts
│   └── reportService.ts
│
├── types/              # TypeScript interfaces
│   ├── auth.ts
│   ├── academics.ts
│   ├── enrollment.ts
│   ├── billing.ts
│   ├── attendance.ts
│   ├── notification.ts
│   └── report.ts
│
├── lib/                # Utilities
│   ├── api.ts          # Axios instance
│   └── roles.ts        # Role utilities
│
├── App.tsx             # Main app component
└── main.tsx            # Entry point
```

## 🎨 Features

### ✅ Implemented

1. **Authentication**
   - Login/Register pages
   - JWT token management
   - Auto token refresh
   - Protected routes

2. **Dashboard**
   - Role-specific views
   - Quick stats
   - Recent activities

3. **Academic Management**
   - Sessions, Levels, Courses
   - Course offerings
   - CRUD operations (staff)

4. **Enrollment System**
   - Student enrollment dashboard
   - Enrollment wizard
   - Course selection
   - Status tracking

5. **Billing & Payments**
   - Invoice listing
   - Payment history
   - Financial summary
   - Status badges

6. **Attendance**
   - Dashboard with stats
   - Session listing
   - Color-coded rates
   - Staff/Student views

7. **Notifications**
   - Notification bell with badge
   - Notification center
   - Mark as read
   - Auto-refresh

8. **Reports**
   - Financial, Student, Attendance reports
   - Export to CSV/Excel/PDF
   - Date range filtering

### Navigation

- **Sidebar navigation** with role-based menu items
- **Responsive design** (mobile-friendly)
- **Breadcrumbs** and page titles
- **User profile** dropdown

## 🛠️ Setup

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Update API URL in .env
VITE_API_URL=http://localhost:8000
```

### Development

```bash
# Start dev server
npm run dev

# Access at http://localhost:5173
```

### Build

```bash
# Production build
npm run build

# Preview build
npm run preview
```

## 🔐 Authentication

The app uses JWT tokens stored in localStorage:

- `access_token`: Short-lived access token
- `refresh_token`: Long-lived refresh token

Tokens are automatically attached to API requests via Axios interceptors.

## 🎭 User Roles

The system supports 5 user roles:

1. **Super Admin**: Full system access
2. **IT Admin**: Technical administration
3. **Manager**: Management functions
4. **Finance**: Billing and financial reports
5. **Student Officer**: Student management
6. **Student**: Student portal access

Role-based UI rendering:
```typescript
const { user } = useAuth();
const isStaff = user?.is_staff_role;
const isFinance = user?.role === 'finance';
```

## 📡 API Integration

All API calls go through service functions:

```typescript
// Example: Fetch invoices
import { invoiceService } from '../services/billingService';

const invoices = await invoiceService.getAll({ page: 1 });
```

Base API URL is configured in `src/lib/api.ts`:
```typescript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
});
```

## 🎨 Styling

Using Tailwind CSS with custom configuration:

```javascript
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        secondary: '#10b981',
      },
    },
  },
};
```

## 📦 Key Dependencies

```json
{
  "react": "^18.3.1",
  "react-router-dom": "^6.22.0",
  "@tanstack/react-query": "^5.0.0",
  "axios": "^1.6.7",
  "tailwindcss": "^3.4.1"
}
```

## 🧪 Testing (To be added)

```bash
# Run tests
npm test

# Coverage
npm run test:coverage
```

## 🚀 Deployment

### Vercel/Netlify

```bash
# Build command
npm run build

# Output directory
dist/
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
```

## 🔧 Environment Variables

```env
# API Configuration
VITE_API_URL=http://localhost:8000

# Feature Flags (optional)
VITE_ENABLE_REPORTS=true
VITE_ENABLE_PAYMENTS=true
```

## 📱 Responsive Breakpoints

```
sm: 640px   # Mobile landscape
md: 768px   # Tablet
lg: 1024px  # Desktop
xl: 1280px  # Large desktop
2xl: 1536px # Extra large
```

## 🎯 Performance

- **Code splitting**: Route-based lazy loading
- **Image optimization**: Lazy loading images
- **Bundle size**: < 500KB gzipped
- **First paint**: < 2s on 3G

## 📝 Coding Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Configured for React + TypeScript
- **Prettier**: Code formatting
- **Naming**: camelCase for variables, PascalCase for components

## 🐛 Common Issues

### CORS Errors
Check backend CORS settings in `config/settings.py`:
```python
CORS_ALLOWED_ORIGINS = ["http://localhost:5173"]
```

### 401 Unauthorized
Token might be expired. Try logging out and back in.

### Build Errors
Clear node_modules and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📚 Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Router](https://reactrouter.com)
- [TanStack Query](https://tanstack.com/query)

## 👥 Team

Built with ❤️ for ICAN Tutorial Centre

## 📄 License

Private - All Rights Reserved
