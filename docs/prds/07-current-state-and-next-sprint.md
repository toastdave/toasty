# Current State And Next Sprint

## Where the app is today

Toasty already has a credible public anime discovery surface:

- landing page
- top anime page
- schedule page with day tabs
- anime detail pages with canonical slugs
- sign-in and sign-up flows
- sign-out in the main navigation
- checklist actions on anime detail pages
- a signed-in `/me` destination for tracked anime
- handle-based public profile pages rooted in tracked anime
- signed-in recommendation shelves on the landing page
- related-title recommendation modules on anime detail pages
- a public anime seeding snapshot route backed by persisted yearly rankings
- a generated anime bracket route backed by stored tournament entries and opening-round matchups
- interactive tournament matchup pages with signed-in voting
- an anime-only single-page rating canvas with stored axis scores and Toasty overall scores

Under the hood, the anime catalog is persisted locally and refreshed from Jikan through normalized source adapters and cached snapshots.

## What changed in planning

The product is no longer framed as `anime discovery now, ratings and tournaments much later`.

The updated strategy is:

- keep anime as the flagship launch lane
- expand toward TV shows and movies next
- build a genuinely differentiated rating system with one-page rich input
- build explainable recommendations from structured taste data
- lay tournament foundations early so yearly bracket play feels earned later

## Immediate gaps

The app still needs the underlying systems that make the broader vision real.

- manual sync controls and operator visibility are still missing
- ratings are not implemented yet
- recommendation surfaces are only in their first heuristic form and are not yet rating-aware
- public activity is not implemented yet
- tournament setup now has a working snapshot-to-bracket-to-vote flow, but it still needs stricter official freeze rules, rerun controls, anti-abuse protections, and later-round progression
- the app shell remains anime-first even though the schema is more general

The largest remaining gap is that ratings are still anime-only and not yet connected back into recommendations, aggregates, or tournament seeding.

## Recommended next sprint

1. manual sync controls or scripts for top anime and current season refreshes
2. expand the rating contract beyond the first anime flow into aggregates, richer profile outputs, and recommendation-aware signals
3. deepen the new recommendation modules with stronger explanation and better candidate coverage
4. harden the stored seeding, generated bracket, and live-vote flow with official freeze, rerun, publish, and anti-abuse rules
5. add lightweight public activity and profile customization basics

## Explicitly not next

- a giant mixed-media browse feed before TV and movies have their own strong lanes
- full social graph features
- a tournament launch before ratings and recommendation data are trustworthy
