# Protiddhoni Backend

This is the API behind Protiddhoni, our Bengali digital storytelling platform. It serves the frontend, powers the author and admin workflows, and owns the application rules around publishing, interaction, payments, notifications, and moderation.

The backend is the source of truth for content state. It decides who can publish, who can edit, what readers can access, and how engagement data like likes, comments, ratings, and purchases are recorded.

## What It Does

The backend is responsible for:

- Authentication and user profiles
- Story, poem, series, and chapter publishing
- Draft creation and submission for review
- Reader interaction: comments, likes, bookmarks, ratings, and reviews
- Reading preferences and content access rules
- Purchases, wallet balance, tipping, and payout flows
- Push subscriptions and notifications
- Category browsing, reports, quizzes, and admin moderation

It also serves the OpenAPI document through Swagger UI at `/api-docs`, which makes the API easier to inspect during development.

The app also exposes a raw JSON copy of the OpenAPI spec at `/api-docs.json` for importing into tools like Postman.

## Stack

- Node.js
- Express 5
- TypeScript
- PostgreSQL through Supabase
- JWT authentication
- bcryptjs for password hashing
- web-push for browser notifications
- Swagger UI for API documentation

## Local Setup

From this directory:

```bash
pnpm install
cp .env.example .env
pnpm dev
```

The health check is available at [http://localhost:5000/health](http://localhost:5000/health).

## Scripts

| Command | What it does |
|---------|--------------|
| `pnpm dev` | Run the TypeScript source directly with hot reload |
| `pnpm build` | Compile TypeScript into `dist/` |
| `pnpm start` | Run the compiled server from `dist/server.js` |
| `pnpm typecheck` | Type-check the project without emitting files |
| `pnpm test` | Run the Jest suite |
| `pnpm seed` | Seed the database with sample data |
| `pnpm upload-audio` | Upload audiobook assets |
| `pnpm migrate` | Run the quiz migration script |

## Project Structure

The backend is written in TypeScript and keeps the usual Express layers separate:

```
backend/
├── config/          # Database and logger setup
├── controllers/     # Request handlers
├── middleware/      # Auth, validation, error handling, access control
├── models/          # Domain models
├── repositories/    # Data access layer
├── routes/          # API route definitions
├── services/        # Business logic
├── scripts/         # Seed, migration, and maintenance scripts
├── types/           # Shared types and request augmentation
├── utils/           # Small helpers
├── app.ts           # Express app wiring
├── server.ts        # Server entry point
└── dist/            # Build output
```

The flow is intentionally simple: routes map requests to controllers, controllers validate and shape the response, services apply the business rules, and repositories handle persistence.

## API Areas

The route surface is grouped by product area rather than by implementation detail:

- `auth` - register, login, logout, profile
- `content` - content creation, publishing, search, moderation, and author feeds
- `series` - series pages and chapter management
- `users` - profiles, follows, and author pages
- `comments`, `likes`, `ratings`, `reviews`, `bookmarks` - reader engagement
- `drafts` - draft management for writers
- `notifications` and `push` - unread counts and push subscription handling
- `payments` and `purchases` - wallet, tipping, payout, and premium content access
- `readingPreferences` - reader settings and content presentation preferences
- `categories` - category browsing and listing
- `quizzes` - quiz flows and leaderboard data
- `reports` - reporting and moderation workflows

Most of these routes are consumed directly by the frontend, so the names mirror product areas rather than internal implementation details. That keeps the API easier to understand when you are building new screens or debugging a specific user flow.

## Design Notes

The app is structured to keep the core product rules in one place and the transport layer thin. Controllers handle request/response shape, repositories handle data access, and middleware keeps the cross-cutting concerns like auth, validation, security headers, and rate limiting out of the route handlers.

At startup the server also enables CORS, compression, helmet, rate limiting, and a `/health` check, then mounts the product routes under `/api`.

## Development

- Run the API with `pnpm dev`
- Check service health at `/health`
- Open the API docs at `/api-docs`
