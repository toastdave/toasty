# Recommendations And Intelligence

## Why recommendations matter

Toasty should not stop at charts. The product becomes substantially more valuable once it can help users understand what to watch next and why it fits them.

Recommendations should feel explainable, not magical.

## Recommendation principles

1. Explain the reason for every recommendation.
2. Start with useful heuristics before pretending to have a perfect model.
3. Use ratings, tracking behavior, metadata, and trend context together.
4. Improve with richer user data instead of hiding sparse signal behind vague AI language.

## Recommendation inputs

### Content inputs

- genres
- themes and mood indicators
- studios, creators, or contributor similarity when available
- format and release context

### Behavioral inputs

- checklist states
- completions
- abandoned titles
- rating coverage depth
- recommendation strength ratings

### Community inputs

- trend movement
- chart persistence
- aggregate rating profiles
- editorial lists and curated collections

## Recommendation output types

### Title-to-title recommendations

- because you tracked or rated `X`
- shares a strong action or romance profile with `Y`
- similar emotional or fun balance

### User-to-title recommendations

- because your profile leans high on quality and emotional impact
- because you usually finish high-tension, low-comedy titles
- because you consistently recommend titles with a similar flavor map

### Discovery shelves

- weekly risers
- high-recommendation titles in your lane
- editorial picks for your signature
- because people like you finished this next

## Explainability rule

Every recommendation should try to answer one of these clearly:

- what title is this similar to?
- what taste pattern in the user does it match?
- what community or trend signal supports it?

Avoid empty copy like `recommended for you` unless the system can say more.

## Rollout stages

### Stage 1 - Recommendation-ready discovery

- related-title modules on detail pages
- editorial or trend-assisted shelves
- because-you-tracked rows on home and profile pages

### Stage 2 - Rating-aware recommendations

- use universal core dimensions and flavor vectors
- explain recommendations through explicit dimension overlap
- keep most recommendations within the same media lane first

### Stage 3 - Deeper personalization

- use tracked history, ratings, completion behavior, and public taste signatures
- support stronger profile-based recommendation loops
- carefully expand into cross-media recommendations only when the confidence is high

## Cross-media recommendation rule

The system should support cross-media understanding, but it should not force cross-media recommendations too early.

- anime to anime should be strong first
- TV to TV should be strong when TV arrives
- movies to movies should be strong when movies arrive
- cross-media recommendations can appear later as optional bridges, not as the default experience

## Relationship to tournaments

Recommendation strength and completion behavior can contribute to tournament seeding inputs, but recommendation outputs should not directly decide public winners. Tournaments still need visible community participation and stable ranking rules.
