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
- manual or operator-triggered sync controls [done via Bun ops script]
- generic source-adapter contract for future TV and movie ingestion [next]

## Phase 3 - Signed-in utility loop

- checklist tracking [done]
- lightweight saved or tracked-anime page [done]
- public profile shell [done]
- public activity basics [done in first profile form]
- profile customization basics [done]

## Phase 4 - Ratings foundation

- universal core dimensions across anime, TV, and movies [done in first anime-only form]
- flavor profile dimensions such as action, romance, comedy, and tension [done in first anime-only form]
- optional format-specific nuance [partially done through flavor-first anime fields]
- single-page rich rating canvas with partial save [done in first anime-only form]
- aggregate comparable score built from the universal core [done in first anime-only public form]
- public taste signature outputs [done in first profile form]

## Phase 5 - Recommendation intelligence

- related-title detail modules [done, heuristic anime-first]
- because-you-tracked shelves [done on home and profile pages, anime-first]
- explainable recommendation copy [done in first flavor-aware form]
- rating-aware recommendations [done in first anime-only form]
- deeper profile-based personalization [done in stronger aggregate-and-completion form]

## Phase 6 - Multi-media expansion

- TV show adapter and browse lane [later]
- movie adapter and browse lane [later]
- cross-media discover hub [later]
- cross-media recommendation bridges [later]

## Phase 7 - Identity and curation

- official lists [done in first editorial form]
- personal lists [done in first public/private form]
- stronger activity feed [later]
- recommendation-friendly collections [later]

## Phase 8 - Tournaments

- yearly eligibility rules [done in first publish-and-advance form]
- seeding snapshot pipeline [done in first stored form, anime-first]
- official seeding page [done in first form, anime-first]
- bracket generation [done in multi-round stored form, anime-first]
- matchup voting [done in live form with first anti-abuse gate]
- rankings, points, and accuracy [later]
- historical archive views [done in first yearly hub form]

## Current recommendation

The next implementation sprint should focus on richer list depth, tournament meta layers, editorial recommendation programming, and adapter prep for the first non-anime lane.
