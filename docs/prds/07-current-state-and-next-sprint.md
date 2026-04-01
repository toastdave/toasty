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

Under the hood, the anime catalog is persisted locally and refreshed from Jikan through normalized source adapters and cached snapshots.

## What is missing from the user loop

The app now has a real signed-in utility loop plus a first public identity layer. Users can track anime for themselves and share a lightweight profile, but public activity and operator sync controls are not live yet.

## Recommended next sprint

1. manual sync controls or scripts for top anime and current season refreshes
2. lightweight public activity around completions or recent adds
3. discovery polish on schedule and detail pages
4. profile customization basics like editable bio and avatar polish

## Explicitly deferred

- the larger rating system rewrite
- tournament UX
- broader social features
