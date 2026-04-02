# Tournaments And Year End Mode

## Why tournaments exist

The long-term differentiator is turning annual media discourse into a playful, competitive bracket season with strong receipts, strong archives, and enough structure that the outcomes feel earned rather than random.

The intended emotional reference is March Madness energy applied to screen media.

## Product promise

When tournaments ship, users should be able to:

- browse official seeds before voting begins
- understand why titles were seeded where they were
- follow live head-to-head matchups
- vote in active duels
- track upsets, favorites, and bracket momentum
- revisit historical winners without retroactive changes
- eventually compare their picks, points, and prediction accuracy

## Tournament structure

### Annual cadence

Each tournament year should have a frozen eligibility window and a frozen seeding snapshot. Historical tournament data must never drift after the bracket is published.

### Media lanes

The first tournament release should not force one giant all-screen bracket.

- anime should be the flagship bracket first
- TV and movies should arrive as separate tournament lanes once each category has enough rating and engagement data
- a combined all-screen invitational can come later if the data quality supports it

## Tournament setup workflow

### Phase 1 - Eligibility freeze

Decide which titles qualify for the tournament year.

- define the year or season window
- freeze eligible titles before seeding begins
- preserve the exact candidate pool used that year

### Phase 2 - Seeding snapshot

Build a versioned seeding input snapshot that captures the exact signals used for ranking.

Inputs should blend:

- aggregate community rating from the universal core dimensions
- recommendation strength signals
- popularity and trend performance
- completion and engagement volume
- limited editorial or cult-hit boosts

### Phase 3 - Official seeding page

Before the bracket opens, users should be able to inspect:

- seed order
- region or pod placement
- seeding notes or algorithm summary
- notable omissions, bubble cases, or wildcards if we support them

This page matters as much as the bracket itself because it creates trust and debate.

### Phase 4 - Bracket generation

- generate regions or pods
- lock the opening matchups
- preserve the published structure in an immutable historical record

### Phase 5 - Live competition

- active matchup pages
- vote counts or relative momentum as appropriate
- featured duel modules
- upset callouts and tournament intel

### Phase 6 - Rankings and meta game

Later tournament versions can add:

- user picks and prediction brackets
- points
- accuracy
- percentile ranking
- upset streaks and other tournament meta

## Seeding model guidance

The seeding model should be explainable, weighted, and stable enough that users can form a mental model for it.

### Recommended signal families

- community quality signal from universal ratings
- recommendation strength signal
- trend velocity and chart persistence
- completion volume and overall participation
- editorial adjustment with tight limits and visible rules

### Weighting rules

- universal core rating dimensions should matter more than flavor vectors
- flavor vectors are useful for matchup storytelling, not as primary seed drivers
- editorial boosts must be capped and documented
- anti-abuse protections should exist for vote brigading and suspicious last-minute engagement spikes

## UX surfaces

The first tournament UX should include:

- tournament hub
- official seeding page
- bracket view
- live matchup page
- rankings or status summary
- historical archive entry point

## Current implementation posture

The first tournament setup slice is now live as an anime seeding snapshot.

- the app can now project and persist a year-based anime field from current catalog quality, popularity, and checklist engagement
- a public seeding snapshot page exists at `/tournaments/anime/[year]`
- yearly rankings now act as the first persisted seeding-snapshot backbone for anime tournaments
- the app can now generate and persist the first opening-round bracket structure from that stored snapshot
- a public matchup page now exists for generated opening-round duels, including signed-in voting
- the current flow is still heuristic and should evolve toward stricter official freeze, rerun, publish, and anti-abuse rules before it becomes final tournament history

## Release strategy

Tournament setup work should begin before the full tournament UX exists.

Recommended order:

1. finalize annual rules and seeding inputs
2. harden the new snapshot pipeline with explicit freeze and republish rules
3. build official seeding and archive surfaces
4. deepen the generated bracket beyond opening-round structure and harden live matchup voting
5. add predictions, points, and advanced ranking layers later
