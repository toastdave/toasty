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
- community rating cards on anime detail pages built from aggregate Toasty scores and shared flavor signals
- a public anime seeding snapshot route backed by persisted yearly rankings
- a generated anime bracket route backed by stored tournament entries and opening-round matchups
- interactive tournament matchup pages with signed-in voting
- an anime-only single-page rating canvas with stored axis scores and Toasty overall scores
- a list hub with official editorial shelves, personal lists, and public list detail pages
- profile settings for handle, bio, avatar URL, and display-name polish
- a tournament archive hub for yearly anime brackets

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
- operator controls now exist as Bun scripts, but they still need richer reporting and scheduling visibility
- recommendation surfaces now use aggregate, completion, and profile-depth inputs, but they still need editorial programming and cross-media confidence rules
- public activity exists in a stronger profile-and-list form, but it still needs reactions, filters, and richer list events
- tournament setup now has publish and round-advance workflows, but it still needs fuller scheduling rules, prediction games, and richer historical storytelling
- the app shell remains anime-first even though the schema is more general

The largest remaining gap is no longer aggregate scoring. It is now the jump from anime-first depth into a broader multi-lane product with stronger tournament meta and editorial programming.

## Recommended next sprint

1. deepen list creation and public collection storytelling beyond the first editorial and personal list surfaces
2. add stronger tournament scheduling, prediction, and archive storytelling layers on top of publish and advance workflows
3. expand recommendation shelves with editorial assists and more deliberate home-page programming
4. keep preparing the adapter and browse model for TV and movie lanes without weakening anime depth first
5. improve ops visibility around sync history, tournament actions, and recovery paths without exposing internal scaffolding in the consumer UI

## Explicitly not next

- a giant mixed-media browse feed before TV and movies have their own strong lanes
- full social graph features
- a tournament launch before ratings and recommendation data are trustworthy
