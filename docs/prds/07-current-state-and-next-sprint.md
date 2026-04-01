# Current State And Next Sprint

## Where the app is today

Toasty already has a credible public anime discovery surface:

- landing page
- top anime page
- schedule page with day tabs
- anime detail pages with canonical slugs
- sign-in and sign-up flows
- sign-out in the main navigation

Under the hood, the anime catalog is persisted locally and refreshed from Jikan through normalized source adapters and cached snapshots.

## What is missing from the user loop

The app is still stronger for anonymous browsing than for signed-in usage. Users can authenticate, but there is not yet a strong reason to stay signed in because checklist tracking, saved titles, and a profile shell are not live.

## Recommended next sprint

1. checklist actions on anime detail pages
2. a simple saved or tracked-anime destination for signed-in users
3. basic profile shell rooted in saved titles rather than ratings
4. manual sync controls or scripts for top anime and current season refreshes

## Explicitly deferred

- the larger rating system rewrite
- tournament UX
- broader social features
