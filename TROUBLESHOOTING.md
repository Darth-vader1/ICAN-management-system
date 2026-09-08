# Troubleshooting Guide - Blank Page Issue

## Problem: Frontend shows blank page when running `npm run dev`

### Quick Fixes (Try these in order)

#### 1. Check if dependencies are installed
```bash
cd frontend
npm install
```

Wait for installation to complete, then:
```bash
npm run dev
```

#### 2. Check browser console for errors
1. Open browser: http://localhost:5173
2. Press `F12` or `Ctrl+Shift+I` to open Developer Tools
3. Click on "Console" tab
4. Look for error messages (usually in red)

**Common errors and fixes:**

---

### Error: "Failed to resolve module"

**Solution:** Dependencies not installed
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

### Error: "Cannot find module './contexts/AuthContext'"

**Solution:** Files might be in wrong location. Check file structure:
```
frontend/
├── src/
│   ├── components/
│   │   └── ProtectedRoute.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── lib/
│   │   └── api.ts
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   └── DashboardPage.tsx
│   ├── services/
│   │   └── authService.ts
│   ├── types/
│   │   └── auth.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
```

If files are in `frontend/frontend/src/`, move them to `frontend/src/`:
```bash
# PowerShell
Move-Item frontend/src/* ../src/
```

---

### Error: "Unexpected token" or TypeScript errors

**Solution:** Check TypeScript version compatibility
```bash
cd frontend
npm install typescript@^5.5.3 --save-dev
npm run dev
```

---

### Error: Network Error or CORS error

**Symptoms:** 
- Page loads but login doesn't work
- Console shows: "Access to XMLHttpRequest blocked by CORS"

**Solution:** Backend not running or CORS misconfigured
```bash
# Terminal 1: Start backend first
cd backend
python manage.py runserver

# Terminal 2: Then start frontend
cd frontend
npm run dev
```

Verify backend is at: http://localhost:8000

---

## Step-by-Step Debug Process

### Step 1: Verify File Structure
```bash
cd frontend
dir src
```

Should show:
- components/
- contexts/
- lib/
- pages/
- services/
- types/
- App.tsx
- main.tsx
- index.css

### Step 2: Check Terminal Output
When you run `npm run dev`, you should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

If you see errors instead, read them carefully.

### Step 3: Test Build
```bash
cd frontend
npm run build
```

If build fails, it will show TypeScript errors.

### Step 4: Check Browser Network Tab
1. Open browser: http://localhost:5173
2. Press `F12`
3. Click "Network" tab
4. Reload page (`Ctrl+R`)
5. Look for failed requests (in red)

### Step 5: Check if Vite is serving files
Visit: http://localhost:5173/src/main.tsx

If you see code, Vite is working. If you see "404", there's a configuration issue.

---

## Complete Fresh Start

If nothing works, start fresh:

```bash
# 1. Delete node_modules
cd frontend
rmdir /s /q node_modules
del package-lock.json

# 2. Reinstall
npm install

# 3. Check versions
npm list react react-dom react-router-dom

# 4. Start dev server
npm run dev
```

---

## Check Package Versions

Your package.json should have:
```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0",
    "@tanstack/react-query": "^5.51.1",
    "react-hook-form": "^7.52.1",
    "zod": "^3.23.8",
    "@hookform/resolvers": "^3.9.0",
    "axios": "^1.7.2"
  }
}
```

---

## Manual Test: Simple App

Create `frontend/src/SimpleTest.tsx`:
```tsx
function SimpleTest() {
  return <div>Hello World!</div>;
}
export default SimpleTest;
```

Update `frontend/src/main.tsx`:
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import SimpleTest from './SimpleTest.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SimpleTest />
  </StrictMode>,
)
```

If "Hello World!" shows, the issue is in App.tsx or dependencies.

---

## Check index.html

Your `frontend/index.html` should have:
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ICAN Platform</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

## Common Port Issues

### Port 5173 already in use
```
Error: Port 5173 is already in use
```

**Solution:**
```bash
# Kill process on port 5173
netstat -ano | findstr :5173
taskkill /PID <PID_NUMBER> /F

# Or use different port
npm run dev -- --port 3000
```

---

## Still Not Working?

### Get More Info:

1. **Check Vite version:**
   ```bash
   npm list vite
   ```

2. **Check Node version:**
   ```bash
   node --version
   ```
   Should be v18 or higher.

3. **Check npm version:**
   ```bash
   npm --version
   ```

4. **Clear Vite cache:**
   ```bash
   cd frontend
   rmdir /s /q node_modules\.vite
   npm run dev
   ```

5. **Check for TypeScript errors:**
   ```bash
   cd frontend
   npx tsc --noEmit
   ```

---

## Report the Error

If still stuck, provide:
1. Terminal output from `npm run dev`
2. Browser console errors (F12 → Console)
3. Output of `npm list`
4. Node version: `node --version`
5. Contents of `frontend/src/` (dir command output)

---

## Quick Test Checklist

- [ ] `npm install` completed successfully
- [ ] `npm run dev` starts without errors
- [ ] Browser shows http://localhost:5173
- [ ] F12 Console has no red errors
- [ ] Backend is running on port 8000
- [ ] .env file exists in frontend folder
- [ ] All files in correct locations

If all checked, the app should work!
