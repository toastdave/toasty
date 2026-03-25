# AGENTS.md

## Overview

Toasty is an anime-first discovery app for top charts, seasonal schedules, future ratings, and yearly tournament brackets.
Build consumer-facing product experiences only; do not expose internal tech, scaffolding, or implementation details in the UI.
Use `docs/prds` for product requirements and `.agents/` for agent references, installed skills, and external implementation guidance.

## Stack

- Bun workspaces
- SvelteKit 2 + Svelte 5
- Tailwind CSS v4 + shadcn-svelte for UI
- Better Auth for authentication
- Drizzle ORM + PostgreSQL
- Jikan as the first anime source adapter
- Docker Compose for local infrastructure
- mise for developer tasks
- Biome for formatting and linting
