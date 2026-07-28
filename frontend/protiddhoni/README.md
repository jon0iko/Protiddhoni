# Protiddhoni Frontend

This is the Next.js app for Protiddhoni, our Bengali digital storytelling platform. It is the reader-facing site, the writing workspace, and the admin console in one place. The app is built with the App Router and is designed to carry Bengali text cleanly across reading, publishing, and moderation flows.

The frontend is where the product comes together visually. Readers land here to browse and read Bengali content, authors use it to write and manage their work, and admins use it to review submissions and keep the platform organized. The same app also handles the small details that matter in a reading product: typography, layout, session state, and notification support.

## What Lives Here

The frontend covers the public site and the authenticated product areas:

- Home, about, how-it-works, FAQ, contact, privacy, terms, and guidelines pages
- Story discovery through search, category pages, story pages, and chapter reading
- Auth flows for login, register, logout, and password recovery
- Reader tools like bookmarks, settings, profile pages, and quiz views
- Writing tools for new drafts, draft continuation, editor settings, and external-link posts
- Author dashboards for drafts, published stories, and wallet views
- Admin pages for review queues, review history, and quiz management

## What It Does

The app is where readers browse and read content, writers draft and publish new work, and admins review submissions. It also keeps the smaller pieces of the product together: Bengali typography, PWA support, push notifications, and user session state.

It is also responsible for the reading experience itself. Story pages, chapter pages, category pages, and search all live here, along with the author dashboard and account pages that support the rest of the product.

The root layout wires up the pieces that the rest of the app depends on:

- Bengali font loading and page metadata
- Auth state
- Service worker registration
- Push notification handling
- Shared layout chrome and navigation

## Stack

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Supabase client integration
- Tiptap editor for rich text writing

## Main Areas

- Public pages for introducing the project and explaining how Protiddhoni works
- Reader pages for browsing categories, searching stories, and opening a story or chapter
- Auth pages for sign in, registration, logout, and password recovery
- Writing pages for creating a new post, continuing a draft, and editing content with the rich text editor
- Dashboard pages for drafts, authored stories, wallet information, and account settings
- Admin pages for moderation queues, review history, and quiz management

## Runtime Pieces

- `AuthProvider` keeps user session state available across the app
- `LayoutWrapper` provides the shared shell around page content
- `BengaliNumberInit` keeps local number formatting consistent for the product
- `ServiceWorkerRegistration` enables the PWA layer
- `PushNotificationManager` connects the browser to push notification subscriptions

## Local Development

From this directory:

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in the browser.

## Scripts

- `pnpm dev` - start the development server
- `pnpm build` - build the app for production
- `pnpm start` - run the production build
- `pnpm lint` - run linting
- `pnpm test` - run the unit test suite
- `pnpm test:coverage` - run tests with coverage output
- `pnpm test:e2e` - build and run Playwright end-to-end tests
- `pnpm test:e2e:ui` - open the Playwright UI runner
- `pnpm test:e2e:report` - open the latest Playwright report

## Environment

Set the frontend environment values that the app needs to talk to the backend and Supabase. The exact variables depend on your local setup, but the app expects API and auth configuration to be present before the writing and reader flows will work correctly.

In practice, the app needs the API base URL, Supabase client values, and any notification or auth settings required by the local environment.

## Notes

This frontend is meant to stay close to the product language of Protiddhoni. When adding new screens, keep the Bengali reading experience, the author workflow, and the admin tools consistent with the rest of the app.
