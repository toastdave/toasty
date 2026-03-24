# Toasty

Toasty is an anime-first discovery app that starts with Jikan-powered charts and release schedules, then grows into a broader cross-media platform for ratings, lists, and yearly bracket tournaments.

## Locked stack

- `SvelteKit` + `Svelte 5`
- `Bun workspaces`
- `Tailwind CSS v4`
- `Drizzle ORM`
- `Postgres`
- `Better Auth`
- `Biome`
- `Docker Compose`
- `mise`

## Workspace layout

- `apps/web` - SvelteKit app shell, routes, and server services
- `packages/db` - Drizzle schema, migrations, and seed data
- `docs/prds` - product direction, epics, and roadmap handoff docs

## Current scaffold goals

- establish the monorepo, tooling, and auth/database foundations
- ship an anime-first product surface for top anime, seasonal release schedules, and detail pages
- keep the source adapter boundary clean so more media providers can slot in later
- document the future roadmap for ratings, lists, profiles, and tournaments

## Quick start

1. `cp .env.example .env`
2. `mise install`
3. `mise run install`
4. `mise run docker:up`
5. `mise run db:push`
6. `mise run seed`
7. `mise run dev`

## Core commands

- `mise run dev` - run the SvelteKit app locally
- `mise run check` - run Svelte and TypeScript checks
- `mise run lint` - run Biome linting
- `mise run format` - format the repository with Biome
- `mise run test` - run Bun tests
- `mise run build` - create the SSR build
- `mise run db:generate` - generate Drizzle migrations
- `mise run db:push` - push the schema to Postgres
- `mise run seed` - seed default sources, rubrics, and vibe badges

## Auth setup

- Email/password auth uses `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`.
- GitHub OAuth callback: `http://localhost:5173/api/auth/callback/github`
- Google OAuth callback: `http://localhost:5173/api/auth/callback/google`
- Set `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET` to enable those buttons.

## Product notes

- Jikan powers the first live anime discovery views, but canonical catalog data still belongs in our database.
- `packages/db` models the future shape for ratings, lists, trends, and tournaments even before every page is implemented.
- Dub release scheduling is intentionally not committed to the MVP because Jikan does not expose a dependable dub calendar.
