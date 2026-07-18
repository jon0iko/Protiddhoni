# Protiddhoni Backend

Backend API for Protiddhoni - Bengali Digital Storytelling Platform

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Fill in your environment variables in `.env`:
   - Supabase credentials
   - JWT secret
   - Payment gateway credentials

4. Start development server (TypeScript, hot-reload via tsx):
```bash
pnpm dev
```

## Scripts

| Command | What it does |
|---------|--------------|
| `pnpm dev` | Run the TypeScript source directly with hot reload |
| `pnpm build` | Compile TypeScript to `dist/` (excludes tests) |
| `pnpm start` | Run the compiled server (`node dist/server.js`) — use in production |
| `pnpm typecheck` | Type-check everything including tests, no output emitted |
| `pnpm test` | Run the Jest suite via ts-jest |
| `pnpm seed` | Seed the database |

## Project Structure

The backend is written entirely in **TypeScript**.

```
backend/
├── config/          # Configuration files (Database, Logger)
├── middleware/      # Express middleware
├── models/          # Data models
├── repositories/    # Data access layer (Repository Pattern)
├── services/        # Business logic (Factory, Strategy, Observer patterns)
├── controllers/     # Route controllers
├── routes/          # API routes
├── types/           # Shared domain types + Express Request augmentation
├── utils/           # Utility functions
├── app.ts           # Express app setup
├── server.ts        # Server entry point
└── dist/            # Compiled output (git-ignored, created by `pnpm build`)
```

## Design Patterns Implemented

1. **Singleton Pattern**: Database connection, Logger, Cache Manager
2. **Factory Pattern**: Content creation (Story, Poem, Chapter)
3. **Repository Pattern**: Data access abstraction
4. **Strategy Pattern**: Payment processing (SSLCommerz, bKash)
5. **Observer Pattern**: Notification system
6. **Decorator Pattern**: Content access control

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/profile` - Get current user

### Content
- `GET /api/content/published` - Get published content
- `GET /api/content/:id` - Get content by ID
- `POST /api/content` - Create content
- `PUT /api/content/:id` - Update content
- `POST /api/content/:id/submit` - Submit for review
- `POST /api/content/:id/approve` - Approve (admin)
- `POST /api/content/:id/reject` - Reject (admin)

### Users
- `GET /api/users/:username` - Get user profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/:username/follow` - Follow user
- `DELETE /api/users/:username/follow` - Unfollow user

### Reviews
- `GET /api/reviews/content/:contentId` - Get reviews
- `POST /api/reviews` - Create review
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review

## Development

- Run: `pnpm dev`
- Test connection: Visit `http://localhost:5000/health`
