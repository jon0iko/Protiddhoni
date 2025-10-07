# Quick Start Guide - Protiddhoni

## 🚀 Get Up and Running in 5 Minutes

### Step 1: Environment Setup

**Backend:**
```bash
cd backend
cp .env.example .env
# Edit .env and add your Supabase credentials
```

**Frontend:**
```bash
cd frontend/protiddhoni
cp .env.example .env.local
# Edit .env.local and add your credentials
```

### Step 2: Install Dependencies

**Backend:**
```bash
cd backend
pnpm install
```

**Frontend:**
```bash
cd frontend/protiddhoni
pnpm install

# Install missing packages
pnpm add zustand clsx tailwind-merge
```

### Step 3: Start Servers

**Terminal 1 - Backend:**
```bash
cd backend
pnpm dev
```
✅ Backend running at: http://localhost:5000

**Terminal 2 - Frontend:**
```bash
cd frontend/protiddhoni
pnpm dev
```
✅ Frontend running at: http://localhost:3000

### Step 4: Test Connection

1. Visit: http://localhost:5000/health
   - Should return: `{"status":"ok",...}`

2. Visit: http://localhost:3000
   - Should load Next.js app


```

---

## 📋 Environment Variables Required

### Backend (.env)
```env
PORT=5000
NODE_ENV=development
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
JWT_SECRET=your-random-secret-key-here
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## ✅ Project Structure Created

All files and folders have been created with:
- ✅ Backend structure complete
- ✅ Frontend structure complete
- ✅ Database connection (Singleton pattern) implemented
- ✅ All route placeholders created
- ✅ All component placeholders created
- ✅ Design patterns scaffolded

---

## 🎯 What to Implement Next

1. **Authentication** - Complete the auth controller
2. **Content CRUD** - Implement content creation/editing
3. **Admin Dashboard** - Build moderation interface
4. **Rich Text Editor** - Integrate TipTap
5. **UI Components** - Style with Tailwind CSS

---

## 📚 Helpful Commands

```bash
# Backend
pnpm dev          # Start development server
pnpm start        # Start production server

# Frontend
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
```

---

## 🐛 Troubleshooting

**Port already in use:**
```bash
# Kill process on port 5000 (backend)
npx kill-port 5000

# Kill process on port 3000 (frontend)
npx kill-port 3000
```

**Database connection error:**
- Check Supabase credentials in `.env`
- Verify tables are created
- Check network connection

**Module not found:**
```bash
# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

---

Ready to code! 🎉
