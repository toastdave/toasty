# Platform Foundation

## Stack lock

- SvelteKit 2 with Svelte 5 runes
- Bun workspaces
- Tailwind CSS v4
- Better Auth
- Drizzle ORM with Postgres
- Biome for formatting and linting
- Zod for boundary validation

## Repo structure

- `apps/web` holds the single app shell and route surface
- `packages/db` owns schema, migrations, and seed data
- `docs/prds` owns product planning and implementation sequencing
- `.agents` holds agent-facing references and installed skill scaffolding

## Workflow baseline

- local host development with Docker-managed Postgres
- full Docker development with hot reload
- Tailscale Serve support for sharing local development builds
- `mise` tasks for app, database, Docker, and Tailscale workflows

## Engineering rules

1. Canonical catalog records live in our database.
2. Third-party payloads stay behind source adapters.
3. Every future provider must normalize into shared internal shapes.
4. Historical tournament data must not drift when current scores change.
5. Precomputed aggregates should power sort-heavy pages.

## Completed foundation work

- Bun monorepo scaffold is in place
- Better Auth sign-in and sign-up flows are wired
- Drizzle schema package and seed script exist
- Docker, Compose, mise, and Tailscale workflows are documented and usable
- anime discovery routes are live and backed by persisted catalog data

## Initial non-goals

- no mobile app
- no separate API service
- no dub schedule promise in MVP
- no local image mirroring requirement in v1
