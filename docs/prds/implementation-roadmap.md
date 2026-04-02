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
- generic source-adapter contract for future TV and movie ingestion [next]

## Phase 3 - Signed-in utility loop

- checklist tracking [done]
- lightweight saved or tracked-anime page [done]
- public profile shell [done]
- public activity basics [next]
- profile customization basics [next]

## Phase 4 - Ratings foundation

- universal core dimensions across anime, TV, and movies [next]
- flavor profile dimensions such as action, romance, comedy, and tension [next]
- optional format-specific nuance [next]
- single-page rich rating canvas with partial save [next]
- aggregate comparable score built from the universal core [later in phase]
- public taste signature outputs [later in phase]

## Phase 5 - Recommendation intelligence

- related-title detail modules [done, heuristic anime-first]
- because-you-tracked shelves [done on home, heuristic anime-first]
- explainable recommendation copy [next]
- rating-aware recommendations [later in phase]
- deeper profile-based personalization [later in phase]

## Phase 6 - Multi-media expansion

- TV show adapter and browse lane [later]
- movie adapter and browse lane [later]
- cross-media discover hub [later]
- cross-media recommendation bridges [later]

## Phase 7 - Identity and curation

- official lists [later]
- personal lists [later]
- stronger activity feed [later]
- recommendation-friendly collections [later]

## Phase 8 - Tournaments

- yearly eligibility rules [next]
- seeding snapshot pipeline [done in first stored form, anime-first]
- official seeding page [done in first form, anime-first]
- bracket generation [done in first opening-round form, anime-first]
- matchup voting [done in first opening-round form, anime-first]
- rankings, points, and accuracy [later]
- historical archive views [later in phase]

## Current recommendation

The next implementation sprint should focus on sync controls, the finalized rating-system contract, recommendation-ready discovery modules, tournament setup rules, and lightweight profile activity/customization.
