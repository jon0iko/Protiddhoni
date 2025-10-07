# Protiddhoni - Digital Storytelling Platform
## Comprehensive Implementation Plan

---

## 📋 Project Overview

**Protiddhoni** is a web-based digital storytelling platform inspired by Pratilipi, designed specifically for Bengali writers and readers in Bangladesh. The platform democratizes publishing by providing aspiring authors a structured space to showcase their talent and build an audience.

### Core Vision
- Central hub for Bangla formal/informal/vernacular literature
- Support for novice and aspiring writers
- All users can both read and write content
- Admin-moderated content publication system
- Future expansion to regional languages (Sylheti, Pahari, etc.)
- Interactive reading and writing experience
- Monetization through selective content paywalls

---

## 🏗️ Technology Stack

- **Frontend**: Next.js 14+ (React 18+, TypeScript)
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL (Supabase Cloud)
- **Authentication**: Supabase Auth / JWT
- **File Storage**: Supabase Storage (for images, media)
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React Context API + Zustand
- **Rich Text Editor**: TipTap or Lexical
- **Payment Gateway**: SSLCommerz / bKash (for Bangladesh)

---

## 📝 Content Publication Workflow

**All users have equal access** - there are no separate "writer" or "reader" roles. Every user can:
- Read published content
- Write and create content via the "লিখুন" (Write) tab
- Save drafts
- Submit content for review

**Admin Moderation Process:**
1. **User writes** → Saves as draft (status: `draft`)
2. **User submits** → Content marked as `pending` for review
3. **Admin reviews** → Views content in moderation dashboard
4. **Admin decides**:
   - ✅ **Approve** → Content status changes to `approved`, `is_published` = `true`, visible to all
   - ❌ **Reject** → Content status changes to `rejected`, feedback sent to author
5. **Author notified** → Receives notification about approval/rejection

This ensures **quality control** while empowering all users to be content creators.

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONTENT PUBLICATION WORKFLOW                  │
└─────────────────────────────────────────────────────────────────┘

                        ALL USERS
                           │
                    ┌──────┴──────┐
                    │             │
                    ▼             ▼
              📖 READ        ✍️ WRITE (লিখুন)
           Published            │
            Content             │
                                ▼
                        ┌─────────────┐
                        │   DRAFT     │ ← Save for later
                        │  (private)  │
                        └──────┬──────┘
                               │
                               │ Submit for Review
                               ▼
                        ┌─────────────┐
                        │  PENDING    │
                        │  (hidden)   │
                        └──────┬──────┘
                               │
                        ADMIN REVIEWS
                               │
                    ┌──────────┴──────────┐
                    │                     │
                    ▼                     ▼
            ┌─────────────┐       ┌─────────────┐
            │  APPROVED   │       │  REJECTED   │
            │ is_published│       │  + Reason   │
            │   = true    │       │  (private)  │
            └──────┬──────┘       └──────┬──────┘
                   │                     │
                   │                     │
                   ▼                     ▼
        📢 NOTIFY FOLLOWERS      📧 NOTIFY AUTHOR
        🌍 VISIBLE TO ALL        ↻ Can Edit & Resubmit

```

---

## 🔄 Key Architecture Changes

### User Role Simplification
- ❌ **Removed**: Separate "writer" and "reader" roles
- ✅ **New**: All users have identical capabilities
- ✅ **Access**: Everyone can read and write via "লিখুন" tab

### Admin Moderation System
- 🔐 **Admin Role**: `is_admin` boolean flag in users table
- 📋 **Content Status Flow**:
  - `draft` → User is still writing
  - `pending` → Submitted for admin review
  - `approved` → Admin approved, visible to all
  - `rejected` → Admin rejected, feedback provided

### Database Changes
1. **Users Table**: Changed `role VARCHAR(20)` to `is_admin BOOLEAN`
2. **Content Table**: Added fields:
   - `status VARCHAR(20)` - Content workflow state
   - `rejection_reason TEXT` - Admin feedback
   - `reviewed_by UUID` - Admin who reviewed
   - `reviewed_at TIMESTAMP` - Review timestamp

### New Routes & Controllers
- `POST /content/:id/submit` - Submit content for review
- `GET /content/admin/pending` - Get pending content (admin only)
- `POST /content/:id/approve` - Approve content (admin only)
- `POST /content/:id/reject` - Reject content (admin only)

### New UI Components
- **All Users**: "লিখুন" tab to create content
- **Admin Only**: Moderation dashboard at `/admin/moderation`
  - Protected by middleware checking `is_admin` flag
  - Hidden navigation link for non-admin users
- **Notifications**: Status updates sent to authors

**Frontend Admin Route Protection:**
```typescript
// middleware.ts or in component
const checkAdmin = async () => {
    const { data: user } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', currentUserId)
        .single();
    
    if (!user?.is_admin) {
        router.push('/'); // Redirect non-admins
    }
};
```

---

## 🎯 Design Patterns Implementation (6 Patterns)

### 1. **Factory Pattern** 🏭
**Location**: Backend - Content Creation Service
**Purpose**: Create different types of content objects (Story, Poem, Chapter, Series)

```
Used in: /backend/services/contentFactory.js
- ContentFactory creates instances based on type
- Handles Story, Poem, Series (with chapters), Non-series content
- Ensures consistent object creation with validation
```

### 2. **Strategy Pattern** 🎲
**Location**: Frontend - Reading Interface & Backend - Payment Processing
**Purpose**: Multiple algorithms for reading themes and payment methods

```
Used in:
- /frontend/components/reader/ThemeStrategy.js (Light, Dark, Sepia themes)
- /frontend/components/reader/FontSizeStrategy.js (Small, Medium, Large, X-Large)
- /backend/services/paymentStrategy.js (SSLCommerz, bKash, Cash on Delivery)
```

### 3. **Observer Pattern** 👁️
**Location**: Backend - Notification System
**Purpose**: Notify followers when authors publish new content

```
Used in: /backend/services/notificationService.js
- Authors are Subjects
- Followers are Observers
- Automatic notifications on: new story, new chapter, author updates
- Email and in-app notifications
```

### 4. **Repository Pattern** 📚
**Location**: Backend - Data Access Layer
**Purpose**: Abstract database operations and provide clean API

```
Used in: /backend/repositories/
- UserRepository.js
- ContentRepository.js
- ReviewRepository.js
- SeriesRepository.js
Centralizes all database queries, makes testing easier
```

### 5. **Decorator Pattern** 🎨
**Location**: Backend - Content Access Control
**Purpose**: Add dynamic access control (free vs. paid content)

```
Used in: /backend/middleware/contentAccessDecorator.js
- Base content access
- Decorated with: PaywallCheck, SubscriptionCheck, PremiumContentCheck
- Flexible permission layers
```

### 6. **Singleton Pattern** 🔐
**Location**: Backend - Database Connection & Cache Manager
**Purpose**: Ensure single instance of critical resources

```
Used in:
- /backend/config/database.js (Supabase client)
- /backend/services/cacheManager.js (Redis/Memory cache)
- /backend/config/logger.js (Winston logger instance)
```

---

## 📊 Database Schema Design

### **Users Table**
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    password_hash VARCHAR(255) NOT NULL,
    bio TEXT,
    profile_picture_url TEXT,
    is_admin BOOLEAN DEFAULT FALSE, -- Only admins have special privileges
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
```

### **Content Table**
```sql
CREATE TABLE content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(300) UNIQUE NOT NULL,
    content_type VARCHAR(20) NOT NULL, -- 'story', 'poem', 'chapter'
    body TEXT NOT NULL,
    excerpt TEXT,
    cover_image_url TEXT,
    category_id UUID REFERENCES categories(id),
    series_id UUID REFERENCES series(id) NULL, -- NULL for non-series content
    chapter_number INTEGER NULL, -- For series chapters
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'pending', 'approved', 'rejected'
    is_published BOOLEAN DEFAULT FALSE, -- Set to true when admin approves
    is_premium BOOLEAN DEFAULT FALSE, -- Paywall flag
    rejection_reason TEXT NULL, -- Admin's reason for rejection
    reviewed_by UUID REFERENCES users(id) NULL, -- Admin who reviewed
    reviewed_at TIMESTAMP NULL,
    price DECIMAL(10, 2) DEFAULT 0.00,
    language VARCHAR(10) DEFAULT 'bn', -- 'bn' for Bangla
    view_count INTEGER DEFAULT 0,
    published_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_content_author ON content(author_id);
CREATE INDEX idx_content_category ON content(category_id);
CREATE INDEX idx_content_series ON content(series_id);
CREATE INDEX idx_content_status ON content(status);
CREATE INDEX idx_content_published ON content(is_published);
CREATE INDEX idx_content_slug ON content(slug);
```

### **Series Table**
```sql
CREATE TABLE series (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(300) UNIQUE NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    category_id UUID REFERENCES categories(id),
    total_chapters INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_series_author ON series(author_id);
CREATE INDEX idx_series_slug ON series(slug);
```

### **Categories Table**
```sql
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50), -- Icon name/code
    created_at TIMESTAMP DEFAULT NOW()
);

-- Seed data for categories
INSERT INTO categories (name, slug, description) VALUES
('প্রেমের গল্প', 'romance', 'Love and romance stories'),
('ভৌতিক', 'horror', 'Horror and supernatural stories'),
('রহস্য', 'mystery', 'Mystery and thriller stories'),
('কবিতা', 'poetry', 'Bengali poetry'),
('সামাজিক', 'social', 'Social and contemporary stories'),
('ঐতিহাসিক', 'historical', 'Historical fiction'),
('কল্পবিজ্ঞান', 'sci-fi', 'Science fiction'),
('হাস্যরস', 'comedy', 'Comedy and humor'),
('শিশুতোষ', 'children', 'Children stories');
```

**Create First Admin User:**
```sql
-- After registering your first user through the app, make them admin:
UPDATE users 
SET is_admin = true 
WHERE email = 'your-admin-email@example.com';

-- Or create admin directly (hash password first with bcrypt):
INSERT INTO users (email, username, full_name, password_hash, is_admin, is_verified)
VALUES (
    'admin@protiddhoni.com',
    'admin',
    'Admin User',
    '$2a$10$YOUR_BCRYPT_HASHED_PASSWORD_HERE',
    true,
    true
);
```

### **Follows Table**
```sql
CREATE TABLE follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);
```

### **Reviews Table**
```sql
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID REFERENCES content(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(content_id, user_id)
);

CREATE INDEX idx_reviews_content ON reviews(content_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
```

### **Reading_Progress Table**
```sql
CREATE TABLE reading_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content_id UUID REFERENCES content(id) ON DELETE CASCADE,
    progress_percentage DECIMAL(5, 2) DEFAULT 0.00,
    last_position TEXT, -- JSON: scroll position or paragraph ID
    completed BOOLEAN DEFAULT FALSE,
    last_read_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, content_id)
);

CREATE INDEX idx_reading_progress_user ON reading_progress(user_id);
```

### **Purchases Table** (For Premium Content)
```sql
CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content_id UUID REFERENCES content(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255) UNIQUE,
    payment_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, content_id)
);

CREATE INDEX idx_purchases_user ON purchases(user_id);
CREATE INDEX idx_purchases_content ON purchases(content_id);
```

### **Notifications Table**
```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'new_chapter', 'new_follower', 'review', etc.
    title VARCHAR(255) NOT NULL,
    message TEXT,
    related_entity_type VARCHAR(50), -- 'content', 'user', 'review'
    related_entity_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read);
```

### **Reading_Preferences Table**
```sql
CREATE TABLE reading_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    theme VARCHAR(20) DEFAULT 'light', -- 'light', 'dark', 'sepia'
    font_size VARCHAR(20) DEFAULT 'medium', -- 'small', 'medium', 'large', 'xlarge'
    font_family VARCHAR(50) DEFAULT 'Kalpurush',
    line_height VARCHAR(20) DEFAULT 'normal',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### **Drafts Table**
```sql
CREATE TABLE drafts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    body TEXT,
    content_type VARCHAR(20),
    series_id UUID REFERENCES series(id) NULL,
    metadata JSONB, -- Store additional draft data
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_drafts_author ON drafts(author_id);
```

---

## 🚀 Step-by-Step Implementation Plan

### **Phase 1: Project Setup & Infrastructure (Week 1)**

#### 1.1 Initialize Project Structure
```bash
# Create project directory
mkdir protiddhoni
cd protiddhoni

# Initialize backend
mkdir backend
cd backend
npm init -y
npm install express cors dotenv bcryptjs jsonwebtoken
npm install @supabase/supabase-js pg
npm install express-validator helmet morgan
npm install --save-dev nodemon

# Initialize frontend
cd ..
npx create-next-app@latest frontend --typescript --tailwind --app
cd frontend
npm install @supabase/supabase-js
npm install zustand @tanstack/react-query
npm install @tiptap/react @tiptap/starter-kit
npm install lucide-react clsx tailwind-merge
```

#### 1.2 Project Directory Structure
```
protiddhoni/
├── backend/
│   ├── config/
│   │   ├── database.js          # Singleton - DB connection
│   │   ├── supabase.js
│   │   └── logger.js            # Singleton - Logger
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   ├── validation.js
│   │   └── contentAccessDecorator.js  # Decorator Pattern
│   ├── models/
│   │   ├── User.js
│   │   ├── Content.js
│   │   ├── Series.js
│   │   └── Review.js
│   ├── repositories/            # Repository Pattern
│   │   ├── UserRepository.js
│   │   ├── ContentRepository.js
│   │   ├── SeriesRepository.js
│   │   └── ReviewRepository.js
│   ├── services/
│   │   ├── contentFactory.js    # Factory Pattern
│   │   ├── notificationService.js  # Observer Pattern
│   │   ├── paymentStrategy.js   # Strategy Pattern
│   │   └── authService.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── contentController.js
│   │   ├── userController.js
│   │   └── reviewController.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── content.js
│   │   ├── users.js
│   │   └── reviews.js
│   ├── utils/
│   │   ├── slugify.js
│   │   └── validators.js
│   ├── app.js
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   ├── (dashboard)/
│   │   │   │   ├── write/
│   │   │   │   ├── drafts/
│   │   │   │   └── my-stories/
│   │   │   ├── (admin)/
│   │   │   │   ├── moderation/
│   │   │   │   ├── pending-content/
│   │   │   │   └── users/
│   │   │   ├── (reader)/
│   │   │   │   ├── read/[slug]/
│   │   │   │   └── series/[slug]/
│   │   │   ├── profile/[username]/
│   │   │   ├── category/[slug]/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── components/
│   │   │   ├── editor/
│   │   │   │   ├── RichTextEditor.tsx
│   │   │   │   └── MediaUploader.tsx
│   │   │   ├── reader/
│   │   │   │   ├── ReaderView.tsx
│   │   │   │   ├── ThemeStrategy.tsx    # Strategy Pattern
│   │   │   │   ├── FontSizeStrategy.tsx # Strategy Pattern
│   │   │   │   └── ReadingControls.tsx
│   │   │   ├── content/
│   │   │   │   ├── ContentCard.tsx
│   │   │   │   ├── SeriesCard.tsx
│   │   │   │   └── ContentList.tsx
│   │   │   └── ui/
│   │   │       └── (shadcn components)
│   │   ├── lib/
│   │   │   ├── supabase.ts
│   │   │   ├── api.ts
│   │   │   └── utils.ts
│   │   ├── stores/
│   │   │   ├── authStore.ts
│   │   │   └── readerStore.ts
│   │   └── types/
│   │       └── index.ts
│   └── package.json
│
└── README.md
```

#### 1.3 Setup Supabase Database
```bash
# Install Supabase CLI
npm install -g supabase

# Login and initialize
supabase login
supabase init

# Create migration files
supabase migration new initial_schema
```

---

### **Phase 2: Database Setup (Week 1-2)**

#### 2.1 Create Database Schema
1. Copy all the SQL schemas defined above
2. Run in Supabase SQL Editor or via migration files
3. Set up Row Level Security (RLS) policies:

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid() = id);

-- Anyone can read approved published content
CREATE POLICY "Anyone can view published content"
ON content FOR SELECT
USING (is_published = true AND status = 'approved');

-- Authors can manage their own content (except changing status)
CREATE POLICY "Authors can manage own content"
ON content FOR ALL
USING (auth.uid() = author_id);

-- Admins can view all content
CREATE POLICY "Admins can view all content"
ON content FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
    )
);

-- Admins can update any content
CREATE POLICY "Admins can update content status"
ON content FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
    )
);
```

#### 2.2 Setup Database Connection (Singleton Pattern)
**File**: `/backend/config/database.js`

```javascript
const { createClient } = require('@supabase/supabase-js');

class DatabaseConnection {
    constructor() {
        if (DatabaseConnection.instance) {
            return DatabaseConnection.instance;
        }

        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY
        );

        DatabaseConnection.instance = this;
    }

    getClient() {
        return this.supabase;
    }
}

module.exports = new DatabaseConnection();
```

---

### **Phase 3: Backend API Development (Week 2-4)**

#### 3.1 Implement Repository Pattern
**File**: `/backend/repositories/ContentRepository.js`

```javascript
const db = require('../config/database');

class ContentRepository {
    async create(contentData) {
        const { data, error } = await db.getClient()
            .from('content')
            .insert(contentData)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    async findById(id) {
        const { data, error } = await db.getClient()
            .from('content')
            .select(`
                *,
                users:author_id (username, full_name, profile_picture_url),
                categories:category_id (name, slug),
                series:series_id (title, slug)
            `)
            .eq('id', id)
            .single();
        
        if (error) throw error;
        return data;
    }

    async findPublished(filters = {}) {
        let query = db.getClient()
            .from('content')
            .select('*')
            .eq('is_published', true);

        if (filters.category) {
            query = query.eq('category_id', filters.category);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    }

    async update(id, updates) {
        const { data, error } = await db.getClient()
            .from('content')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    async delete(id) {
        const { error } = await db.getClient()
            .from('content')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return true;
    }
}

module.exports = new ContentRepository();
```

#### 3.2 Implement Factory Pattern
**File**: `/backend/services/contentFactory.js`

```javascript
class Content {
    constructor(data) {
        this.title = data.title;
        this.body = data.body;
        this.author_id = data.author_id;
        this.category_id = data.category_id;
    }

    validate() {
        if (!this.title || !this.body) {
            throw new Error('Title and body are required');
        }
    }
}

class Story extends Content {
    constructor(data) {
        super(data);
        this.content_type = 'story';
        this.excerpt = data.excerpt;
        this.cover_image_url = data.cover_image_url;
    }
}

class Poem extends Content {
    constructor(data) {
        super(data);
        this.content_type = 'poem';
    }
}

class Chapter extends Content {
    constructor(data) {
        super(data);
        this.content_type = 'chapter';
        this.series_id = data.series_id;
        this.chapter_number = data.chapter_number;
    }

    validate() {
        super.validate();
        if (!this.series_id || !this.chapter_number) {
            throw new Error('Series ID and chapter number are required');
        }
    }
}

class ContentFactory {
    static createContent(type, data) {
        switch (type) {
            case 'story':
                return new Story(data);
            case 'poem':
                return new Poem(data);
            case 'chapter':
                return new Chapter(data);
            default:
                throw new Error(`Unknown content type: ${type}`);
        }
    }
}

module.exports = ContentFactory;
```

#### 3.3 Implement Observer Pattern
**File**: `/backend/services/notificationService.js`

```javascript
const db = require('../config/database');

class NotificationService {
    constructor() {
        this.observers = new Map();
    }

    // Subscribe followers to an author
    async subscribe(authorId, followerId) {
        if (!this.observers.has(authorId)) {
            this.observers.set(authorId, new Set());
        }
        this.observers.get(authorId).add(followerId);
    }

    // Unsubscribe follower from an author
    async unsubscribe(authorId, followerId) {
        if (this.observers.has(authorId)) {
            this.observers.get(authorId).delete(followerId);
        }
    }

    // Notify all followers when author publishes
    async notifyFollowers(authorId, content) {
        const { data: followers } = await db.getClient()
            .from('follows')
            .select('follower_id')
            .eq('following_id', authorId);

        if (!followers) return;

        const notifications = followers.map(f => ({
            user_id: f.follower_id,
            type: 'new_content',
            title: 'New Content Published',
            message: `${content.author_name} published: ${content.title}`,
            related_entity_type: 'content',
            related_entity_id: content.id
        }));

        await db.getClient()
            .from('notifications')
            .insert(notifications);
    }

    // Notify author of new review
    async notifyAuthorOfReview(authorId, review) {
        await db.getClient()
            .from('notifications')
            .insert({
                user_id: authorId,
                type: 'new_review',
                title: 'New Review',
                message: `Your content received a ${review.rating}-star review`,
                related_entity_type: 'review',
                related_entity_id: review.id
            });
    }
}

module.exports = new NotificationService();
```

#### 3.4 Implement Strategy Pattern (Payment)
**File**: `/backend/services/paymentStrategy.js`

```javascript
class PaymentStrategy {
    async processPayment(amount, data) {
        throw new Error('processPayment must be implemented');
    }
}

class SSLCommerzPayment extends PaymentStrategy {
    async processPayment(amount, data) {
        // SSLCommerz integration
        console.log('Processing SSLCommerz payment:', amount);
        // Implementation here
        return {
            success: true,
            transactionId: 'SSL_' + Date.now(),
            method: 'sslcommerz'
        };
    }
}

class BkashPayment extends PaymentStrategy {
    async processPayment(amount, data) {
        // bKash integration
        console.log('Processing bKash payment:', amount);
        // Implementation here
        return {
            success: true,
            transactionId: 'BKASH_' + Date.now(),
            method: 'bkash'
        };
    }
}

class PaymentContext {
    setStrategy(strategy) {
        this.strategy = strategy;
    }

    async executePayment(amount, data) {
        if (!this.strategy) {
            throw new Error('Payment strategy not set');
        }
        return await this.strategy.processPayment(amount, data);
    }
}

module.exports = {
    PaymentContext,
    SSLCommerzPayment,
    BkashPayment
};
```

#### 3.5 Implement Decorator Pattern
**File**: `/backend/middleware/contentAccessDecorator.js`

```javascript
class ContentAccess {
    async checkAccess(userId, contentId) {
        return { granted: true };
    }
}

class PaywallDecorator extends ContentAccess {
    constructor(contentAccess, db) {
        super();
        this.wrappedAccess = contentAccess;
        this.db = db;
    }

    async checkAccess(userId, contentId) {
        const baseAccess = await this.wrappedAccess.checkAccess(userId, contentId);
        
        if (!baseAccess.granted) {
            return baseAccess;
        }

        // Check if content is premium
        const { data: content } = await this.db.getClient()
            .from('content')
            .select('is_premium')
            .eq('id', contentId)
            .single();

        if (!content.is_premium) {
            return { granted: true };
        }

        // Check if user has purchased
        const { data: purchase } = await this.db.getClient()
            .from('purchases')
            .select('id')
            .eq('user_id', userId)
            .eq('content_id', contentId)
            .eq('payment_status', 'completed')
            .single();

        if (purchase) {
            return { granted: true };
        }

        return {
            granted: false,
            reason: 'premium_content',
            message: 'This content requires purchase'
        };
    }
}

module.exports = { ContentAccess, PaywallDecorator };
```

#### 3.6 Implement Admin Middleware
**File**: `/backend/middleware/adminAuth.js`

```javascript
const db = require('../config/database');

const requireAdmin = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const { data: user } = await db.getClient()
            .from('users')
            .select('is_admin')
            .eq('id', req.user.id)
            .single();

        if (!user || !user.is_admin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        next();
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

module.exports = { requireAdmin };
```

#### 3.7 Create API Routes
**File**: `/backend/routes/content.js`

```javascript
const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/adminAuth');

// Public routes
router.get('/published', contentController.getPublished);
router.get('/:slug', contentController.getBySlug);

// User routes (authenticated)
router.post('/', authenticate, contentController.create);
router.put('/:id', authenticate, contentController.update);
router.delete('/:id', authenticate, contentController.delete);
router.post('/:id/submit', authenticate, contentController.submitForReview);

// Admin-only routes
router.get('/admin/pending', authenticate, requireAdmin, contentController.getPending);
router.post('/:id/approve', authenticate, requireAdmin, contentController.approve);
router.post('/:id/reject', authenticate, requireAdmin, contentController.reject);

module.exports = router;
```

---

### **Phase 4: Frontend Development (Week 4-7)**

#### 4.1 Setup Supabase Client
**File**: `/frontend/src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

#### 4.2 Implement Reading Theme Strategy (Strategy Pattern)
**File**: `/frontend/src/components/reader/ThemeStrategy.tsx`

```typescript
interface ThemeStrategy {
    applyTheme(): React.CSSProperties;
}

class LightTheme implements ThemeStrategy {
    applyTheme(): React.CSSProperties {
        return {
            backgroundColor: '#ffffff',
            color: '#000000',
        };
    }
}

class DarkTheme implements ThemeStrategy {
    applyTheme(): React.CSSProperties {
        return {
            backgroundColor: '#1a1a1a',
            color: '#e0e0e0',
        };
    }
}

class SepiaTheme implements ThemeStrategy {
    applyTheme(): React.CSSProperties {
        return {
            backgroundColor: '#f4ecd8',
            color: '#5c4a2c',
        };
    }
}

class ThemeContext {
    private strategy: ThemeStrategy;

    constructor(strategy: ThemeStrategy) {
        this.strategy = strategy;
    }

    setStrategy(strategy: ThemeStrategy) {
        this.strategy = strategy;
    }

    getTheme(): React.CSSProperties {
        return this.strategy.applyTheme();
    }
}

export { ThemeContext, LightTheme, DarkTheme, SepiaTheme };
```

#### 4.3 Rich Text Editor Component
**File**: `/frontend/src/components/editor/RichTextEditor.tsx`

```typescript
'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

export default function RichTextEditor({ content, onChange }) {
    const editor = useEditor({
        extensions: [StarterKit],
        content: content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    return (
        <div className="border rounded-lg p-4">
            <EditorContent editor={editor} />
        </div>
    );
}
```

#### 4.4 Content Card Component
**File**: `/frontend/src/components/content/ContentCard.tsx`

```typescript
import Image from 'next/image';
import Link from 'next/link';

interface ContentCardProps {
    title: string;
    excerpt: string;
    author: string;
    coverImage?: string;
    slug: string;
    category: string;
    isPremium: boolean;
}

export default function ContentCard({
    title,
    excerpt,
    author,
    coverImage,
    slug,
    category,
    isPremium
}: ContentCardProps) {
    return (
        <Link href={`/read/${slug}`}>
            <div className="border rounded-lg overflow-hidden hover:shadow-lg transition">
                {coverImage && (
                    <Image
                        src={coverImage}
                        alt={title}
                        width={400}
                        height={250}
                        className="w-full h-48 object-cover"
                    />
                )}
                <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-blue-600">{category}</span>
                        {isPremium && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                Premium
                            </span>
                        )}
                    </div>
                    <h3 className="text-xl font-bold mb-2">{title}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{excerpt}</p>
                    <p className="text-sm text-gray-500">লিখেছেন: {author}</p>
                </div>
            </div>
        </Link>
    );
}
```

---

### **Phase 5: Authentication & Authorization (Week 3)**

#### 5.1 Setup JWT Authentication
**File**: `/backend/middleware/auth.js`

```javascript
const jwt = require('jsonwebtoken');

const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

module.exports = { authenticate };
```

#### 5.2 Auth Controller
**File**: `/backend/controllers/authController.js`

```javascript
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserRepository = require('../repositories/UserRepository');

exports.register = async (req, res) => {
    try {
        const { email, username, password, full_name } = req.body;
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const user = await UserRepository.create({
            email,
            username,
            password_hash: hashedPassword,
            full_name
        });

        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({ user, token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await UserRepository.findByEmail(email);
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValid = await bcrypt.compare(password, user.password_hash);
        
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({ user, token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
```

#### 5.3 Content Controller with Admin Moderation
**File**: `/backend/controllers/contentController.js`

```javascript
const ContentRepository = require('../repositories/ContentRepository');
const NotificationService = require('../services/notificationService');
const db = require('../config/database');

exports.create = async (req, res) => {
    try {
        const contentData = {
            ...req.body,
            author_id: req.user.id,
            status: 'draft'
        };
        
        const content = await ContentRepository.create(contentData);
        res.status(201).json(content);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.submitForReview = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verify ownership
        const content = await ContentRepository.findById(id);
        if (content.author_id !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        // Update status to pending
        const updated = await ContentRepository.update(id, { 
            status: 'pending',
            submitted_at: new Date()
        });
        
        // Notify all admins
        const { data: admins } = await db.getClient()
            .from('users')
            .select('id')
            .eq('is_admin', true);
            
        for (const admin of admins) {
            await db.getClient()
                .from('notifications')
                .insert({
                    user_id: admin.id,
                    type: 'content_pending',
                    title: 'নতুন লেখা পর্যালোচনার জন্য',
                    message: `${req.user.username} একটি নতুন ${content.content_type} জমা দিয়েছেন`,
                    related_entity_type: 'content',
                    related_entity_id: id
                });
        }
        
        res.json({ 
            message: 'আপনার লেখা পর্যালোচনার জন্য জমা দেওয়া হয়েছে',
            content: updated 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getPending = async (req, res) => {
    try {
        const { data, error } = await db.getClient()
            .from('content')
            .select(`
                *,
                users:author_id (username, full_name, profile_picture_url),
                categories:category_id (name, slug)
            `)
            .eq('status', 'pending')
            .order('created_at', { ascending: true });
            
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.approve = async (req, res) => {
    try {
        const { id } = req.params;
        
        const content = await ContentRepository.update(id, {
            status: 'approved',
            is_published: true,
            published_at: new Date(),
            reviewed_by: req.user.id,
            reviewed_at: new Date()
        });
        
        // Notify author
        await db.getClient()
            .from('notifications')
            .insert({
                user_id: content.author_id,
                type: 'content_approved',
                title: 'আপনার লেখা অনুমোদিত হয়েছে! 🎉',
                message: `অভিনন্দন! "${content.title}" এখন প্রকাশিত হয়েছে`,
                related_entity_type: 'content',
                related_entity_id: id
            });
        
        // Notify followers
        await NotificationService.notifyFollowers(content.author_id, content);
        
        res.json({ message: 'লেখা অনুমোদিত এবং প্রকাশিত হয়েছে', content });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.reject = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        
        const content = await ContentRepository.update(id, {
            status: 'rejected',
            rejection_reason: reason,
            reviewed_by: req.user.id,
            reviewed_at: new Date()
        });
        
        // Notify author
        await db.getClient()
            .from('notifications')
            .insert({
                user_id: content.author_id,
                type: 'content_rejected',
                title: 'আপনার লেখা প্রত্যাখ্যান করা হয়েছে',
                message: reason || 'আপনার লেখা প্রকাশনার মান পূরণ করেনি',
                related_entity_type: 'content',
                related_entity_id: id
            });
        
        res.json({ message: 'লেখা প্রত্যাখ্যান করা হয়েছে', content });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getPublished = async (req, res) => {
    try {
        const { data, error } = await db.getClient()
            .from('content')
            .select(`
                *,
                users:author_id (username, full_name, profile_picture_url),
                categories:category_id (name, slug)
            `)
            .eq('is_published', true)
            .eq('status', 'approved')
            .order('published_at', { ascending: false });
            
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
```

---

### **Phase 6: Frontend Pages (Week 5-6)**

#### 6.1 Home Page
**File**: `/frontend/src/app/page.tsx`

```typescript
import ContentCard from '@/components/content/ContentCard';
import { supabase } from '@/lib/supabase';

export default async function HomePage() {
    const { data: contents } = await supabase
        .from('content')
        .select(`
            *,
            users:author_id (username, full_name),
            categories:category_id (name, slug)
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(12);

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold mb-8 text-center">
                প্রতিধ্বনি - বাংলা সাহিত্যের ঘর
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {contents?.map((content) => (
                    <ContentCard
                        key={content.id}
                        title={content.title}
                        excerpt={content.excerpt}
                        author={content.users.full_name}
                        slug={content.slug}
                        category={content.categories.name}
                        coverImage={content.cover_image_url}
                        isPremium={content.is_premium}
                    />
                ))}
            </div>
        </div>
    );
}
```

#### 6.2 Write Page (লিখুন)
**File**: `/frontend/src/app/(dashboard)/write/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import RichTextEditor from '@/components/editor/RichTextEditor';
import { useRouter } from 'next/navigation';

export default function WritePage() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [contentType, setContentType] = useState('story');
    const router = useRouter();

    const handleSaveDraft = async () => {
        // Save as draft (status: 'draft')
    };

    const handleSubmitForReview = async () => {
        // Submit for admin review (status: 'pending')
        // Show message: "আপনার লেখাটি পর্যালোচনার জন্য জমা দেওয়া হয়েছে"
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">নতুন লেখা</h1>
            
            <div className="space-y-4">
                <input
                    type="text"
                    placeholder="শিরোনাম লিখুন..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-2xl font-bold border-b-2 p-2 focus:outline-none"
                />

                <select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value)}
                    className="border rounded px-3 py-2"
                >
                    <option value="story">গল্প</option>
                    <option value="poem">কবিতা</option>
                    <option value="chapter">অধ্যায়</option>
                </select>

                <RichTextEditor content={content} onChange={setContent} />

                <div className="flex gap-4">
                    <button
                        onClick={handleSaveDraft}
                        className="px-6 py-2 border rounded hover:bg-gray-100"
                    >
                        খসড়া সংরক্ষণ
                    </button>
                    <button
                        onClick={handleSubmitForReview}
                        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        পর্যালোচনার জন্য জমা দিন
                    </button>
                </div>
                
                <p className="text-sm text-gray-600">
                    নোট: আপনার লেখা প্রকাশিত হওয়ার আগে একজন প্রশাসক দ্বারা পর্যালোচনা করা হবে।
                </p>
            </div>
        </div>
    );
}
```

#### 6.3 Admin Moderation Dashboard
**File**: `/frontend/src/app/(admin)/moderation/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface PendingContent {
    id: string;
    title: string;
    author: string;
    content_type: string;
    created_at: string;
    body: string;
}

export default function ModerationPage() {
    const [pendingContents, setPendingContents] = useState<PendingContent[]>([]);
    const [selectedContent, setSelectedContent] = useState<PendingContent | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        fetchPendingContent();
    }, []);

    const fetchPendingContent = async () => {
        // Fetch content with status='pending'
    };

    const handleApprove = async (contentId: string) => {
        // Call API to approve content
        // Update status to 'approved' and is_published to true
    };

    const handleReject = async (contentId: string) => {
        // Call API to reject content with reason
        // Update status to 'rejected'
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">কনটেন্ট পর্যালোচনা</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Pending list */}
                <div className="lg:col-span-1">
                    <h2 className="text-xl font-semibold mb-4">অপেক্ষমাণ লেখা</h2>
                    <div className="space-y-2">
                        {pendingContents.map(content => (
                            <div
                                key={content.id}
                                onClick={() => setSelectedContent(content)}
                                className="p-4 border rounded cursor-pointer hover:bg-gray-50"
                            >
                                <h3 className="font-semibold">{content.title}</h3>
                                <p className="text-sm text-gray-600">লিখেছেন: {content.author}</p>
                                <p className="text-xs text-gray-500">{content.content_type}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Content preview and actions */}
                <div className="lg:col-span-2">
                    {selectedContent ? (
                        <div>
                            <h2 className="text-2xl font-bold mb-4">{selectedContent.title}</h2>
                            <div className="prose max-w-none mb-6">
                                <div dangerouslySetInnerHTML={{ __html: selectedContent.body }} />
                            </div>
                            
                            <div className="flex gap-4 mb-4">
                                <button
                                    onClick={() => handleApprove(selectedContent.id)}
                                    className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                >
                                    অনুমোদন করুন
                                </button>
                                <button
                                    onClick={() => handleReject(selectedContent.id)}
                                    className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                                >
                                    প্রত্যাখ্যান করুন
                                </button>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    প্রত্যাখ্যানের কারণ (যদি প্রযোজ্য হয়):
                                </label>
                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    className="w-full border rounded p-2"
                                    rows={3}
                                    placeholder="লেখক কেন এই লেখাটি প্রত্যাখ্যান করা হয়েছে তা জানতে পারবেন..."
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 py-20">
                            পর্যালোচনার জন্য একটি লেখা নির্বাচন করুন
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
```

#### 6.4 Reader View
**File**: `/frontend/src/app/(reader)/read/[slug]/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { ThemeContext, LightTheme, DarkTheme, SepiaTheme } from '@/components/reader/ThemeStrategy';

export default function ReadPage({ params }: { params: { slug: string } }) {
    const [themeContext] = useState(() => new ThemeContext(new LightTheme()));
    const [currentTheme, setCurrentTheme] = useState<'light' | 'dark' | 'sepia'>('light');

    const changeTheme = (theme: 'light' | 'dark' | 'sepia') => {
        switch (theme) {
            case 'light':
                themeContext.setStrategy(new LightTheme());
                break;
            case 'dark':
                themeContext.setStrategy(new DarkTheme());
                break;
            case 'sepia':
                themeContext.setStrategy(new SepiaTheme());
                break;
        }
        setCurrentTheme(theme);
    };

    const themeStyles = themeContext.getTheme();

    return (
        <div style={themeStyles} className="min-h-screen">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="flex justify-end mb-4 gap-2">
                    <button onClick={() => changeTheme('light')}>☀️</button>
                    <button onClick={() => changeTheme('dark')}>🌙</button>
                    <button onClick={() => changeTheme('sepia')}>📄</button>
                </div>
                
                <article className="prose lg:prose-xl">
                    {/* Content here */}
                </article>
            </div>
        </div>
    );
}
```

---

### **Phase 7: Testing & Deployment (Week 7-8)**

#### 7.1 Environment Variables

**Backend `.env`:**
```
PORT=5000
NODE_ENV=development
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
JWT_SECRET=your_jwt_secret
SSLCOMMERZ_API_KEY=your_key
BKASH_API_KEY=your_key
```

**Frontend `.env.local`:**
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_API_URL=http://localhost:5000
```

#### 7.2 Start Development Servers

```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

#### 7.3 Deployment
- **Backend**: Deploy to Railway, Render, or DigitalOcean
- **Frontend**: Deploy to Vercel (optimal for Next.js)
- **Database**: Already on Supabase Cloud

---

## 📝 Implementation Checklist

### Week 1-2: Setup & Database
- [ ] Initialize project structure
- [ ] Setup Supabase database
- [ ] Create all database tables
- [ ] Setup RLS policies
- [ ] Implement Singleton pattern (DB connection)
- [ ] Seed initial categories
- [ ] Create first admin user manually in database

### Week 2-4: Backend Development
- [ ] Implement Repository pattern
- [ ] Implement Factory pattern (Content creation)
- [ ] Implement Observer pattern (Notifications)
- [ ] Implement Strategy pattern (Payments)
- [ ] Implement Decorator pattern (Access control)
- [ ] Implement admin middleware
- [ ] Create all API routes (including admin routes)
- [ ] Setup authentication middleware
- [ ] Implement content approval/rejection logic
- [ ] Implement error handling

### Week 4-6: Frontend Development
- [ ] Setup Next.js project
- [ ] Implement Strategy pattern (Reading themes)
- [ ] Create rich text editor
- [ ] Build home page
- [ ] Build write page (লিখুন) for all users
- [ ] Build admin moderation dashboard
- [ ] Build reader interface
- [ ] Implement auth pages
- [ ] Create profile pages
- [ ] Build category pages

### Week 6-7: Features & Integration
- [ ] Implement content submission workflow
- [ ] Implement admin approval/rejection system
- [ ] Add notifications for content status changes
- [ ] Implement follow system
- [ ] Implement review system
- [ ] Add payment integration
- [ ] Implement reading progress tracking
- [ ] Implement search functionality
- [ ] Add responsive design

### Week 7-8: Testing & Deployment
- [ ] Test all design patterns
- [ ] Test API endpoints
- [ ] Test UI/UX on multiple devices
- [ ] Security audit
- [ ] Performance optimization
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Setup monitoring

---

## 🎨 Design Patterns Summary

| Pattern | Location | Purpose |
|---------|----------|---------|
| **Factory** | Backend - ContentFactory | Create different content types dynamically |
| **Strategy** | Frontend - Theme/Font; Backend - Payments | Multiple interchangeable algorithms |
| **Observer** | Backend - NotificationService | Author-follower notification system |
| **Repository** | Backend - All Repositories | Abstract data access layer |
| **Decorator** | Backend - Content Access | Dynamic access control for premium content |
| **Singleton** | Backend - DB/Cache/Logger | Single instance of critical resources |

---

## 🚀 Future Enhancements

1. **Mobile Apps** (React Native)
2. **Audio Stories** (Text-to-speech)
3. **Writing Competitions**
4. **Author Earnings Dashboard**
5. **Advanced Analytics**
6. **Social Sharing Features**
7. **Collaborative Writing**
8. **Translation Features**
9. **Regional Language Support** (Sylheti, Pahari)

---

## 📚 Key Technologies Reference

- **Next.js**: https://nextjs.org/docs
- **Express.js**: https://expressjs.com/
- **Supabase**: https://supabase.com/docs
- **TipTap**: https://tiptap.dev/docs
- **Tailwind CSS**: https://tailwindcss.com/docs

---

**Project Timeline**: 8 weeks
**Team Size**: 1-3 developers
**Complexity**: Intermediate to Advanced

This plan provides a solid foundation for building Protiddhoni with proper design patterns, scalable architecture, and a focus on user experience. Good luck with your Software Design Pattern course! 🎉
