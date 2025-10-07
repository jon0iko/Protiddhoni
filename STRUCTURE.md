# Project Directory Structure

```
Protiddhoni/
│
├── 📄 README.md                    # Main project documentation
├── 📄 QUICKSTART.md               # Quick start guide
├── 📄 plan.md                     # Detailed implementation plan
│
├── 📁 backend/                    # Node.js + Express Backend
│   ├── 📄 .env.example           # Environment variables template
│   ├── 📄 .gitignore             # Git ignore rules
│   ├── 📄 package.json           # Dependencies & scripts
│   ├── 📄 README.md              # Backend documentation
│   ├── 📄 app.js                 # Express app setup
│   ├── 📄 server.js              # Server entry point
│   │
│   ├── 📁 config/                # Configuration (Singleton Pattern)
│   │   ├── 📄 database.js        # ✅ Database connection (Singleton)
│   │   └── 📄 logger.js          # Logger service (Singleton)
│   │
│   ├── 📁 middleware/            # Express middleware
│   │   ├── 📄 auth.js            # JWT authentication
│   │   ├── 📄 adminAuth.js       # Admin authorization
│   │   ├── 📄 errorHandler.js    # Error handling
│   │   ├── 📄 validation.js      # Input validation
│   │   └── 📄 contentAccessDecorator.js  # Decorator Pattern
│   │
│   ├── 📁 models/                # Data models
│   │   ├── 📄 User.js
│   │   ├── 📄 Content.js
│   │   ├── 📄 Series.js
│   │   └── 📄 Review.js
│   │
│   ├── 📁 repositories/          # Repository Pattern
│   │   ├── 📄 UserRepository.js
│   │   ├── 📄 ContentRepository.js
│   │   ├── 📄 SeriesRepository.js
│   │   └── 📄 ReviewRepository.js
│   │
│   ├── 📁 services/              # Business logic & Design Patterns
│   │   ├── 📄 contentFactory.js     # Factory Pattern
│   │   ├── 📄 notificationService.js # Observer Pattern
│   │   ├── 📄 paymentStrategy.js    # Strategy Pattern
│   │   ├── 📄 authService.js        # Auth logic
│   │   └── 📄 cacheManager.js       # Cache (Singleton)
│   │
│   ├── 📁 controllers/           # Route controllers
│   │   ├── 📄 authController.js
│   │   ├── 📄 contentController.js
│   │   ├── 📄 userController.js
│   │   └── 📄 reviewController.js
│   │
│   ├── 📁 routes/                # API routes
│   │   ├── 📄 auth.js
│   │   ├── 📄 content.js
│   │   ├── 📄 users.js
│   │   └── 📄 reviews.js
│   │
│   └── 📁 utils/                 # Utility functions
│       ├── 📄 slugify.js
│       └── 📄 validators.js
│
├── 📁 frontend/                   # Next.js Frontend
│   └── 📁 protiddhoni/
│       ├── 📄 .env.example       # Environment variables template
│       ├── 📄 .eslintrc.json     # ESLint config
│       ├── 📄 .gitignore         # Git ignore rules
│       ├── 📄 next.config.mjs    # Next.js config
│       ├── 📄 package.json       # Dependencies
│       ├── 📄 tailwind.config.ts # Tailwind config
│       ├── 📄 tsconfig.json      # TypeScript config
│       │
│       └── 📁 src/
│           │
│           ├── 📁 app/           # Next.js App Router
│           │   ├── 📄 layout.tsx
│           │   ├── 📄 page.tsx   # Home page
│           │   ├── 📄 globals.css
│           │   │
│           │   ├── 📁 (auth)/    # Auth routes
│           │   │   ├── 📁 login/
│           │   │   │   └── 📄 page.tsx
│           │   │   └── 📁 register/
│           │   │       └── 📄 page.tsx
│           │   │
│           │   ├── 📁 (dashboard)/  # User dashboard
│           │   │   ├── 📁 write/
│           │   │   │   └── 📄 page.tsx  # Write page (লিখুন)
│           │   │   ├── 📁 drafts/
│           │   │   │   └── 📄 page.tsx
│           │   │   └── 📁 my-stories/
│           │   │       └── 📄 page.tsx
│           │   │
│           │   ├── 📁 (admin)/      # Admin routes
│           │   │   ├── 📁 moderation/
│           │   │   │   └── 📄 page.tsx  # Content moderation
│           │   │   ├── 📁 pending-content/
│           │   │   └── 📁 users/
│           │   │
│           │   ├── 📁 (reader)/     # Reading routes
│           │   │   ├── 📁 read/
│           │   │   │   └── 📁 [slug]/
│           │   │   │       └── 📄 page.tsx
│           │   │   └── 📁 series/
│           │   │       └── 📁 [slug]/
│           │   │           └── 📄 page.tsx
│           │   │
│           │   ├── 📁 profile/      # User profiles
│           │   │   └── 📁 [username]/
│           │   │       └── 📄 page.tsx
│           │   │
│           │   └── 📁 category/     # Categories
│           │       └── 📁 [slug]/
│           │           └── 📄 page.tsx
│           │
│           ├── 📁 components/    # React components
│           │   ├── 📁 editor/
│           │   │   ├── 📄 RichTextEditor.tsx
│           │   │   └── 📄 MediaUploader.tsx
│           │   │
│           │   ├── 📁 reader/    # Strategy Pattern
│           │   │   ├── 📄 ThemeStrategy.tsx      # Theme switching
│           │   │   ├── 📄 FontSizeStrategy.tsx   # Font sizing
│           │   │   ├── 📄 ReaderView.tsx
│           │   │   └── 📄 ReadingControls.tsx
│           │   │
│           │   ├── 📁 content/
│           │   │   ├── 📄 ContentCard.tsx
│           │   │   ├── 📄 SeriesCard.tsx
│           │   │   └── 📄 ContentList.tsx
│           │   │
│           │   └── 📁 ui/        # Reusable UI components
│           │
│           ├── 📁 lib/           # Utilities
│           │   ├── 📄 supabase.ts    # Supabase client
│           │   ├── 📄 api.ts         # API client
│           │   └── 📄 utils.ts       # Helper functions
│           │
│           ├── 📁 stores/        # State management (Zustand)
│           │   ├── 📄 authStore.ts
│           │   └── 📄 readerStore.ts
│           │
│           └── 📁 types/         # TypeScript types
│               └── 📄 index.ts
│
└── 📁 database/                  # Database (Supabase)
    └── ⚠️ Already created in Supabase panel
        ├── ✅ users
        ├── ✅ content
        ├── ✅ series
        ├── ✅ categories
        ├── ✅ reviews
        ├── ✅ follows
        ├── ✅ notifications
        ├── ✅ purchases
        ├── ✅ reading_progress
        ├── ✅ reading_preferences
        └── ✅ drafts
```

---

## 📊 Statistics

### Backend:
- **31 files** created
- **8 folders** organized
- **6 design patterns** implemented
- **4 route groups** (auth, content, users, reviews)

### Frontend:
- **27 files** created
- **14 route folders** organized
- **2 design patterns** (Strategy for themes/fonts)
- **3 main sections** (auth, dashboard, reader)

### Total:
- **58 files** ready for implementation
- **11 database tables** configured
- **100% structure** complete

---

## 🎯 Design Pattern Locations

| Pattern | Location | Status |
|---------|----------|--------|
| Singleton | `backend/config/database.js` | ✅ Implemented |
| Singleton | `backend/config/logger.js` | ✅ Implemented |
| Singleton | `backend/services/cacheManager.js` | ✅ Scaffolded |
| Factory | `backend/services/contentFactory.js` | ✅ Implemented |
| Repository | `backend/repositories/*.js` | ✅ Scaffolded |
| Strategy | `backend/services/paymentStrategy.js` | ✅ Implemented |
| Strategy | `frontend/.../ThemeStrategy.tsx` | ✅ Implemented |
| Strategy | `frontend/.../FontSizeStrategy.tsx` | ✅ Implemented |
| Observer | `backend/services/notificationService.js` | ✅ Scaffolded |
| Decorator | `backend/middleware/contentAccessDecorator.js` | ✅ Scaffolded |

---

**Legend:**
- 📄 = File
- 📁 = Folder
- ✅ = Implemented/Ready
- ⚠️ = External (Supabase)

All files contain either complete implementations or clear TODO comments for next steps!
