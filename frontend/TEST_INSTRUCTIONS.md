# Test Instructions - Fix Blank Page

## Most Likely Issue: Dependencies Not Installed

### Step 1: Install Dependencies (IMPORTANT!)

```bash
cd frontend
npm install
```

**Wait for it to complete!** This can take 2-5 minutes.

You should see output like:
```
added 234 packages, and audited 235 packages in 2m

42 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

### Step 2: Start Dev Server

```bash
npm run dev
```

You should see:
```
  VITE v5.3.4  ready in 523 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Step 3: Open Browser

Visit: **http://localhost:5173**

You should now see the login page!

---

## If Still Blank: Check Console

1. Press **F12** in browser
2. Click **Console** tab
3. Take a screenshot of any errors
4. Share the error message

### Common Errors:

#### Error: "Cannot find module 'react-router-dom'"
**Fix:** Run `npm install` again

#### Error: "Unexpected token"
**Fix:** Clear cache and reinstall:
```bash
rmdir /s /q node_modules
del package-lock.json
npm install
```

#### No errors in console, just blank
**Fix:** Check if files are in correct location:
```bash
dir src\pages
```

Should show:
- LoginPage.tsx
- RegisterPage.tsx
- DashboardPage.tsx

---

## Quick Diagnostic

Run this to check everything:

```bash
# Check Node version (should be v18+)
node --version

# Check if package.json exists
type package.json

# Check if node_modules exists
dir node_modules

# Check if src files exist
dir src\pages

# Try to build (shows TypeScript errors if any)
npm run build
```

---

## Alternative: Use the Files I Created

If you created files in `frontend/frontend/` by mistake, move them:

**Check current location:**
```bash
dir
```

If you see `frontend\frontend\`, the files are in wrong place.

**Fix:**
```bash
cd frontend\frontend
Move-Item src\* ..\src\
Move-Item package.json ..\
Move-Item tailwind.config.js ..\
Move-Item postcss.config.js ..\
Move-Item .env ..\
```

---

## Test with Simple Component

Create `frontend\src\Test.tsx`:
```tsx
export default function Test() {
  return <h1 className="text-4xl font-bold text-blue-600">IT WORKS!</h1>
}
```

Update `frontend\src\App.tsx`:
```tsx
import Test from './Test'

function App() {
  return <Test />
}

export default App
```

If you see "IT WORKS!" then the issue is with routing or auth context.

---

## Final Check: Ensure Backend is Running

The frontend needs the backend API.

### Terminal 1 - Backend:
```bash
cd backend
python manage.py runserver
```

### Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

Both must be running at the same time!

- Backend: http://localhost:8000
- Frontend: http://localhost:5173

---

## Success Criteria

✅ `npm install` completed without errors  
✅ `npm run dev` shows "ready" message  
✅ Browser opens http://localhost:5173  
✅ You see a login form (not blank page)  
✅ Backend running on port 8000  
✅ No red errors in browser console  

If all checkmarks pass, you're ready to login!
