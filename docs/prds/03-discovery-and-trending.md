# Discovery And Trending

## Primary pages

- landing page
- top anime all time
- current release schedule
- anime detail page

## Discovery principles

1. Make the first screen useful immediately.
2. Show chart context, not just poster grids.
3. Support seasonal browsing and day-based schedule scanning.
4. Be explicit when schedule or progress data is incomplete.

## Current implementation state

- landing page previews top anime and the current season board
- top anime page is live and chart-oriented
- schedule page supports day-based scanning with tabs and counts
- anime detail pages have canonical slug redirects and stronger cross-links back into discovery
- shared error handling exists for broken routes and temporary load failures

## Percent complete

The MVP may show a progress estimate only when the data is dependable. Preferred order:

1. episode-based progress when episode totals and released episodes are known
2. date-window progress when start and end dates exist
3. no percentage when neither is trustworthy

## Dub schedule stance

Dub release schedules stay out of the MVP unless a dependable source is added. Jikan alone is not enough.

## Near-term polish backlog

- add richer browse filters beyond day tabs
- improve fallback messaging for source outages and rate limits
- add lightweight related-anime and editorial discovery loops on detail pages
