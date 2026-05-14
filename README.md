# Protiddhoni (প্রতিধ্বনি)

Protiddhoni is a Bengali digital storytelling platform for readers, writers, and admins. The current codebase combines a Node.js/Express backend with a Next.js 14 frontend and supports publishing workflows, reader engagement, premium content, tipping, notifications, and a rich writing experience.

## What’s In The Repo

```
Protiddhoni/
├── backend/              # Express API, controllers, services, repositories, migrations/scripts
├── frontend/protiddhoni/ # Next.js App Router frontend
├── project_guide.md      # Project planning and course guidance
├── planned-feat.md       # Earlier feature ideation and expansion notes
├── schema.md             # Data model notes
└── README.md             # This file
```

The backend is organized with controllers, repositories, middleware, services, and route modules. The frontend includes reader pages, writing workflows, account areas, admin moderation, wallet screens, and notification components.

## Current Stack

- Backend: Node.js, Express, PostgreSQL/Supabase, JWT auth, bcrypt, web-push
- Frontend: Next.js 14, React 18, TypeScript, Tailwind CSS, Tiptap, Zustand
- Tooling: Jest, ESLint, pnpm

## Main Product Features

### Reader Experience
- Browse published stories, poems, and series
- Search by query, category, author, or slug
- Read with customizable preferences and reader controls
- Like, bookmark, rate, comment, and review content
- View comments and threaded replies
- Follow authors and view author profiles, followers, and following lists

### Writer Experience
- Create, edit, save, and delete drafts
- Submit content for moderation and publication
- Manage stories, series, and chapter-based content
- Use the rich text editor with media upload support
- Review wallet balance, transaction history, and payout details

### Monetization And Wallet
- Premium content purchase flow
- Kori wallet balance tracking
- Tipping authors from the wallet
- Payout and payout simulation endpoints
- Payment webhook handling for gateway confirmations

### Notifications And PWA
- In-app notifications and unread counts
- Push subscription management with VAPID public key exposure
- Service worker-based notification support in the frontend

### Admin And Moderation
- Review pending content submissions
- Approve or reject content
- Refresh author statistics
- Moderate published content and user-generated activity

## Frontend Areas

- Home, about, FAQ, contact, privacy, terms, and guidelines pages
- Reader routes for search, category browsing, story reading, and chapter reading
- Writer routes for composing new content, continuing drafts, editor settings, and draft management
- Account routes for bookmarks, settings, profile, wallet, login, register, and logout
- Admin moderation screens

## Backend Modules

- Authentication, user profiles, and social follow graphs
- Content publishing, draft management, search, author stats, and moderation
- Comments, likes, bookmarks, ratings, and reviews
- Series and chapter workflows
- Reading preferences
- Purchases, payments, wallet, tipping, and payout handling
- Push subscriptions and notifications

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm
- Supabase access

### Backend Setup

```bash
cd backend
pnpm install
cp .env.example .env
pnpm dev
```

Set the backend environment variables required by your deployment, including database access, JWT signing, and payment credentials. The API runs on `http://localhost:5000` by default.

### Frontend Setup

```bash
cd frontend/protiddhoni
pnpm install
cp .env.example .env.local
pnpm dev
```

Set the frontend environment variables for Supabase, the API base URL, and any push or auth values you use locally. The app runs on `http://localhost:3000` by default.

## Helpful Scripts

### Backend
- `pnpm dev` - start the API in development mode
- `pnpm start` - run the API normally
- `pnpm test` - run backend tests
- `pnpm seed` - seed the database with sample data

### Frontend
- `pnpm dev` - start the Next.js app
- `pnpm build` - build for production
- `pnpm start` - run the production build
- `pnpm lint` - run linting
- `pnpm test` - run frontend tests

## API Surface At A Glance

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/profile`

### Content
- `GET /api/content/published`
- `GET /api/content/search`
- `GET /api/content/category/:categorySlug`
- `GET /api/content/author/:authorId`
- `GET /api/content/slug/:slug`
- `GET /api/content/:id`
- `POST /api/content`
- `PUT /api/content/:id`
- `DELETE /api/content/:id`
- `POST /api/content/:id/submit`
- `GET /api/content/my/drafts`
- `GET /api/content/admin/pending`
- `POST /api/content/:id/approve`
- `POST /api/content/:id/reject`

### Users
- `GET /api/users/:username`
- `GET /api/users/:userId/followers`
- `GET /api/users/:userId/following`
- `GET /api/users/:userId/content`
- `GET /api/users/:userId/series`
- `PUT /api/users/:userId`
- `POST /api/users/:userId/follow`
- `POST /api/users/:userId/unfollow`

### Reader Engagement
- `GET /api/bookmarks`
- `POST /api/bookmarks`
- `DELETE /api/bookmarks/:contentId`
- `GET /api/likes`
- `POST /api/likes`
- `DELETE /api/likes/:contentId`
- `GET /api/comments/content/:contentId`
- `POST /api/comments`
- `GET /api/ratings/stats/:contentId`
- `POST /api/ratings`
- `GET /api/reviews/content/:contentId`
- `POST /api/reviews`

### Writing And Series
- `GET /api/drafts/my`
- `POST /api/drafts`
- `PUT /api/drafts/:id`
- `GET /api/series/published`
- `GET /api/series/author/:authorId`
- `GET /api/series/slug/:slug`
- `GET /api/series/:id`
- `GET /api/series/:seriesId/chapters`

### Wallet, Purchases, And Notifications
- `GET /api/purchases`
- `POST /api/purchases/:contentId`
- `GET /api/payments/wallet`
- `GET /api/payments/transactions`
- `POST /api/payments/tip/:authorId`
- `GET /api/payments/payoutable`
- `POST /api/payments/payout`
- `POST /api/payments/webhook/:provider`
- `GET /api/notifications`
- `GET /api/notifications/unread-count`
- `PUT /api/notifications/:id/read`
- `PUT /api/notifications/read-all`
- `GET /api/push/vapid-public-key`
- `POST /api/push/subscribe`
- `POST /api/push/unsubscribe`

