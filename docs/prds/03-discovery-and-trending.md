# Discovery And Trending

## Primary pages

- home or discover hub
- top charts
- current release schedule
- title detail page
- recommendation shelves and related-title modules

## Discovery principles

1. Make the first screen useful immediately.
2. Show chart context, not just poster grids.
3. Explain why something is worth opening.
4. Be explicit when schedule or progress data is incomplete.
5. Let recommendation intelligence feel helpful, not mysterious.

## Interface posture

Discovery pages should stay calm, premium, and hospitality-like.

- warm surfaces and clear hierarchy
- strong typography and spacious layout
- expressive charts and accent moments only where they add value
- recommendation and tournament modules can carry more personality than the base browse shell

## Current implementation state

- landing page previews top anime and the current season board
- top anime page is live and chart-oriented
- schedule page supports day-based scanning with tabs and counts
- anime detail pages have canonical slug redirects and stronger cross-links back into discovery
- signed-in users now see a `because you tracked` recommendation shelf on the home page when enough catalog overlap exists
- the home page now includes community and momentum programming shelves so discovery is not only a hero plus two browse grids
- official and public lists now act as the first editorial discovery assist on the landing page and anime detail pages
- anime detail pages now surface related-title recommendations based on shared genre overlap and nearby metadata affinity
- anime detail pages now link into a single-page rating canvas for signed-in users
- shared error handling exists for broken routes and temporary load failures

## Near-term evolution

The discovery surface should evolve from a small set of browse pages into a richer home for recommendation and chart context.

### Planned modules

- featured spotlight hero
- weekly risers and notable momentum shifts
- compact data or metrics modules that explain what is trending
- related-title rails on detail pages
- recommendation shelves such as `because you tracked`, `because you rated high on`, and editorial picks [done in first anime-first form]

## Cross-media expansion rules

- anime remains the launch category and strongest browse lane
- TV shows should arrive as the next adjacent lane
- movies should follow once browse, ratings, and recommendation logic can support them cleanly
- do not rush into one giant mixed-media browse feed before each lane is useful on its own

## Percent complete

Progress estimates should remain format-aware. Preferred order:

1. episode-based progress when totals and released episodes are known
2. date-window progress when start and end dates exist
3. no percentage when neither is trustworthy

This behavior applies mainly to anime and episodic TV. Movies should not inherit fake progress UI just for consistency.

## Dub schedule stance

Dub release schedules stay out of the MVP unless a dependable source is added. Jikan alone is not enough.

## Recommendation entry points

Recommendation work should begin inside discovery rather than as a separate hidden system.

- detail page related titles
- because-you-tracked shelves on home and profile surfaces
- editorial or trend-assisted picks [done in first home-page form through community, momentum, and list-led programming]
- weekly ranked movement and breakout callouts [later once richer snapshot deltas exist]

## Immediate polish backlog

- add richer browse filters beyond day tabs
- improve fallback messaging for source outages and rate limits
- deepen recommendation modules with richer movement history and sharper cross-media confidence rules once more lanes exist
