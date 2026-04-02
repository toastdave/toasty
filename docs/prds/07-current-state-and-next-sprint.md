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
- lightweight public activity for rating saves, completions, and tournament votes
- profile taste-signature cards built from dominant tags and strongest rating dimensions
- rating-aware recommendation anchors on home and anime detail pages
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
- ratings are implemented in a first anime-only form, but they still need aggregate and cross-surface outputs
- recommendation surfaces now use first-party rating signals, but they still need aggregate, completion, and profile-depth inputs
- public activity exists in a first profile-focused form, but it still needs collections, profile reactions, and stronger filtering
- tournament setup now has a working snapshot-to-bracket-to-vote flow, but it still needs stricter official freeze rules, rerun controls, anti-abuse protections, and later-round progression
- the app shell remains anime-first even though the schema is more general

The largest remaining gap is that ratings are still anime-only and not yet connected into aggregate public scores or tournament seeding.

## Recommended next sprint

1. manual sync controls or scripts for top anime and current season refreshes
2. expand the rating contract into aggregate public scores and tournament-seeding inputs
3. deepen recommendation modules with completion behavior, broader candidate coverage, and stronger profile-level loops
4. harden the stored seeding, generated bracket, and live-vote flow with official freeze, rerun, publish, and anti-abuse rules
5. add profile customization basics around bio polish, avatar treatment, and more expressive public identity

## Explicitly not next

- a giant mixed-media browse feed before TV and movies have their own strong lanes
- full social graph features
- a tournament launch before ratings and recommendation data are trustworthy
