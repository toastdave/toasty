# Toasty

Toasty is an anime-first discovery app that starts with Jikan-powered charts and release schedules, then grows into a broader cross-media platform for ratings, lists, and yearly bracket tournaments.

## Requirements

- `mise`
- `Docker` with `docker compose`
- `Tailscale` for tailnet access

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
- `.agents` - agent-facing references and skill install location

## Getting started

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Update `.env` for your machine. For local-only development, the defaults work. For tailnet access, switch to your Tailscale hostname:

```dotenv
BETTER_AUTH_URL=https://<device>.<tailnet>.ts.net:7421
BETTER_AUTH_TRUSTED_ORIGINS=http://localhost:7421,http://127.0.0.1:7421,https://<device>.<tailnet>.ts.net:7421
```

3. Install the toolchain and dependencies:

```bash
mise install
mise run install
```

4. Choose a development workflow:

- `mise run dev` for the web app on your host machine with Docker-managed Postgres
- `mise run dev:docker` for the entire stack in Docker with hot reload

## Local development

Run Postgres in Docker and the web app on your host machine.

Start:

```bash
mise run docker:up
mise run db:push
mise run seed
mise run dev
```

`mise run db:push` may prompt before applying schema changes. Accept the prompt, then run `mise run seed`.

App URLs:

- Web app: `http://localhost:7421`
- Postgres: `postgresql://postgres:postgres@localhost:5432/toasty`

Stop supporting services:

```bash
mise run docker:down
```

Reset local infrastructure data:

```bash
docker compose down -v
```

The app supports hot reload in this mode. Leave Docker running while you edit locally.

## Full Docker development

Run the entire app stack inside Docker with hot reload.

Start:

```bash
mise run dev:docker
```

This task runs detached. Follow the app logs with:

```bash
docker compose logs -f web
```

In another shell, initialize the database if needed:

```bash
mise run db:push
mise run seed
```

`mise run db:push` may prompt before applying schema changes. Accept the prompt, then run `mise run seed`.

Open:

- Web app: `http://localhost:7421`

Stop:

```bash
mise run docker:down
```

Reset all Docker data:

```bash
docker compose down -v
```

The stack is safe to leave running during development. Code changes are picked up by the containerized Vite dev server.

## Tailscale access

Expose the web app to your tailnet after either local or full Docker development is running.

This repo uses port `7421` for both local and Tailscale access so it stays distinct from sibling apps while avoiding a `443` collision on a shared tailnet node.

Start Tailscale Serve:

```bash
mise run tailscale:up
```

Check status:

```bash
mise run tailscale:status
```

Stop serving over Tailscale:

```bash
mise run tailscale:down
```

Open the app from another device on your tailnet:

```text
https://<device>.<tailnet>.ts.net:7421
```

Use the full `https://` URL. This setup serves HTTPS on port `7421`; `http://` requests to the tailnet hostname will fail.

## Auth setup

- Email/password auth uses `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and `BETTER_AUTH_TRUSTED_ORIGINS`
- GitHub OAuth callback: `http://localhost:7421/api/auth/callback/github`
- Google OAuth callback: `http://localhost:7421/api/auth/callback/google`
- For tailnet access, use the same callback path on your `https://<device>.<tailnet>.ts.net:7421` hostname
- Set `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET` to enable those buttons

## Common commands

```bash
mise run check
mise run lint
mise run test
mise run build
mise run db:generate
mise run db:migrate
mise run db:studio
```

## Product notes

- Jikan powers the first live anime discovery views, but canonical catalog data still belongs in our database
- `packages/db` models the future shape for ratings, lists, trends, and tournaments even before every page is implemented
- Dub release scheduling is intentionally not committed to the MVP because Jikan does not expose a dependable dub calendar
