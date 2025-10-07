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