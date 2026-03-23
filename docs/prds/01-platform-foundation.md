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

## Engineering rules

1. Canonical catalog records live in our database.
2. Third-party payloads stay behind source adapters.
3. Every future provider must normalize into shared internal shapes.
4. Historical tournament data must not drift when current scores change.
5. Precomputed aggregates should power sort-heavy pages.

## Initial non-goals

- no mobile app
- no separate API service
- no dub schedule promise in MVP
- no local image mirroring requirement in v1
