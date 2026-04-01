# Implementation Roadmap

## Phase 1 - Platform and anime discovery

- monorepo and tooling scaffold [done]
- database package and starter schema [done]
- Better Auth foundation [done]
- Jikan service layer [done]
- landing page [done]
- top anime page [done]
- current schedule page [done]
- anime detail page [done]
- shared error page [done]
- discovery copy and browse polish [done]

## Phase 2 - Persistence and ingestion

- canonical anime sync jobs [done]
- source mapping persistence [done]
- ingest job logging [done]
- cached trending snapshots [done]
- stale-aware detail refresh [done]
- manual or operator-triggered sync controls [next]

## Phase 3 - Signed-in utility loop

- checklist tracking [next]
- lightweight saved or tracked-anime page [next]
- public profile shell [next]
- aggregate score computation [later, after the rating system plan lands]

## Phase 4 - Ratings system

- rubric seeds [partially done]
- user ratings [deferred]
- axis score inputs [deferred]
- aggregate score computation [deferred]
- vibe badge presentation [deferred]

## Phase 5 - Identity and curation

- official lists
- personal lists
- lightweight activity feed

## Phase 6 - Tournaments

- yearly rankings
- seeding pipeline
- bracket generation
- matchup voting
- historical archive views

## Current recommendation

The next implementation sprint should focus on checklist tracking, a small signed-in destination, and better operational control over anime sync behavior.
