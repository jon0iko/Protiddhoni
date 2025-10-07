# Protiddhoni (প্রতিধ্বনি)
## Bengali Digital Storytelling Platform

A web-based platform for Bengali writers and readers, democratizing publishing and creating a community for Bangla literature.

---

## 📋 Project Structure

```
Protiddhoni/
├── backend/              # Node.js + Express API
│   ├── config/          # Database & Logger (Singleton Pattern)
│   ├── middleware/      # Auth, Admin, Validation
│   ├── models/          # Data models
│   ├── repositories/    # Repository Pattern
│   ├── services/        # Factory, Strategy, Observer patterns
│   ├── controllers/     # Route handlers
│   ├── routes/          # API endpoints
│   └── utils/           # Helper functions
│
├── frontend/            # Next.js 14 + TypeScript
│   └── protiddhoni/
│       │── app/           # Next.js App Router pages
│       │──components/    # React components
│       │──lib/          # Utilities & API client
│       │──stores/       # Zustand state management
│       │──types/        # TypeScript types
│       └── public/       # Static assets
│
├── plan.md              # Detailed implementation plan
└── README.md            # This file
```

---

## 🎯 Design Patterns Implemented

### Backend Patterns:
1. **Singleton Pattern** - Database connection, Logger, Cache Manager
2. **Factory Pattern** - Content creation (Story, Poem, Chapter)
3. **Repository Pattern** - Data access layer abstraction
4. **Strategy Pattern** - Payment processing (SSLCommerz, bKash)
5. **Observer Pattern** - Notification system for followers
6. **Decorator Pattern** - Content access control (paywall)

### Frontend Patterns:
1. **Strategy Pattern** - Reading themes (Light, Dark, Sepia) and font sizes

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (or npm/yarn)
- Supabase account (for database)

### Backend Setup

1. Navigate to backend:
```bash
cd backend
```

2. Install dependencies:
```bash
pnpm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Fill in environment variables:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
JWT_SECRET=your_secret_key
```

5. Start development server:
```bash
pnpm dev
```

Backend will run on: `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend:
```bash
cd frontend/protiddhoni
```

2. Install dependencies:
```bash
pnpm install
```

3. Install additional packages:
```bash
pnpm add zustand clsx tailwind-merge
pnpm add @supabase/supabase-js
```

4. Create `.env.local` file:
```bash
cp .env.example .env.local
```

5. Fill in environment variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_API_URL=http://localhost:5000
```

6. Start development server:
```bash
pnpm dev
```

Frontend will run on: `http://localhost:3000`

---

## 🗄️ Database Setup

You've already created the tables in Supabase. Make sure you have:

✅ Users table (with `is_admin` field)
✅ Content table (with `status`, `rejection_reason` fields)
✅ Series table
✅ Categories table (with seed data)
✅ Reviews table
✅ Follows table
✅ Notifications table
✅ Purchases table
✅ Reading_progress table
✅ Reading_preferences table
✅ Drafts table

### Create First Admin User

After registering through the app, run in Supabase SQL editor:

```sql
UPDATE users 
SET is_admin = true 
WHERE email = 'your-admin-email@example.com';
```

---

## 🔄 Content Publication Workflow

```
USER WRITES → Save Draft → Submit for Review → 
ADMIN REVIEWS → Approve/Reject → 
AUTHOR NOTIFIED → Published (if approved)
```

All users can both read and write. Content must be approved by admin before publication.

---

## 📚 Key Features

### For All Users:
- ✍️ Write content via "লিখুন" tab
- 📖 Read published content
- 💾 Save drafts
- 📤 Submit content for review
- ⭐ Rate and review content
- 👥 Follow authors
- 🔔 Receive notifications
- 🎨 Customizable reading experience (themes, font sizes)

### For Admins:
- ✅ Approve submitted content
- ❌ Reject with feedback
- 📊 View pending content queue
- 👥 Manage users

### Content Types:
- 📝 Stories (গল্প)
- 🎭 Poems (কবিতা)
- 📚 Series with chapters (ধারাবাহিক)

---

## 🛠️ Tech Stack

### Backend:
- Node.js + Express.js
- Supabase (PostgreSQL)
- JWT authentication
- bcryptjs for password hashing

### Frontend:
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Zustand (state management)
- React Query (data fetching)

### Infrastructure:
- Supabase Cloud (Database + Storage)
- Vercel (Frontend deployment - recommended)
- Railway/Render (Backend deployment - recommended)

---

## 📝 API Endpoints

### Authentication
```
POST   /api/auth/register    - Register new user
POST   /api/auth/login       - Login
POST   /api/auth/logout      - Logout
GET    /api/auth/profile     - Get current user
```

### Content
```
GET    /api/content/published           - Get published content
GET    /api/content/:id                 - Get content by ID
POST   /api/content                     - Create content
POST   /api/content/:id/submit          - Submit for review
POST   /api/content/:id/approve         - Approve (admin)
POST   /api/content/:id/reject          - Reject (admin)
GET    /api/content/admin/pending       - Get pending (admin)
```

### Users
```
GET    /api/users/:username             - Get profile
PUT    /api/users/profile               - Update profile
POST   /api/users/:username/follow      - Follow user
DELETE /api/users/:username/follow      - Unfollow user
```

### Reviews
```
GET    /api/reviews/content/:contentId  - Get reviews
POST   /api/reviews                     - Create review
PUT    /api/reviews/:id                 - Update review
DELETE /api/reviews/:id                 - Delete review
```

---

## 📂 Project Status

### ✅ Completed:
- [x] Project structure created
- [x] Database schema designed
- [x] Backend skeleton with design patterns
- [x] Frontend skeleton with route structure
- [x] Singleton pattern (Database connection)
- [x] Environment configuration

### 🚧 To Implement:
- [ ] Authentication system (JWT)
- [ ] Content CRUD operations
- [ ] Admin moderation dashboard
- [ ] Review system
- [ ] Follow/unfollow system
- [ ] Notification system
- [ ] Payment integration (SSLCommerz, bKash)
- [ ] Rich text editor (TipTap)
- [ ] Image upload (Supabase Storage)
- [ ] Search functionality
- [ ] Reading progress tracking

---

## 🤝 Development Guidelines

1. **Backend**: All TODO comments indicate where implementation is needed
2. **Frontend**: Component placeholders are created with "To be implemented" notes
3. **Design Patterns**: Follow existing pattern implementations
4. **Database**: Use repositories for all database operations
5. **Authentication**: Use middleware for protected routes
6. **Validation**: Implement input validation for all endpoints

---

## 📖 Next Steps

1. **Copy `.env` files** and fill in your credentials
2. **Install frontend dependencies** (zustand, clsx, tailwind-merge)
3. **Test backend connection**: Visit `http://localhost:5000/health`
4. **Start implementing features** following the TODO comments
5. **Refer to `plan.md`** for detailed implementation guide

---

## 🎓 For Course Submission

This project demonstrates **6 design patterns** as required:

1. ✅ **Singleton** - Database connection (`backend/config/database.js`)
2. ✅ **Factory** - Content creation (`backend/services/contentFactory.js`)
3. ✅ **Repository** - Data access (`backend/repositories/`)
4. ✅ **Strategy** - Payment & themes (`backend/services/paymentStrategy.js`, `frontend/components/reader/`)
5. ✅ **Observer** - Notifications (`backend/services/notificationService.js`)
6. ✅ **Decorator** - Access control (`backend/middleware/contentAccessDecorator.js`)

---

## 📄 License

This project is for educational purposes (Software Design Pattern Course).

---

## 👨‍💻 Author

Created for Software Design Pattern Course - Bangladesh University

---

**Happy Coding! শুভ কোডিং! 🎉**
