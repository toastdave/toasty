# Ratings And Checklists

## Current posture

Checklist tracking is live today and remains the lightweight foundation for the deeper rating system.

Checklist states:

- planned
- in progress
- done
- abandoned

Ratings are no longer treated as a vague future add-on. They are now a core differentiator.

The first shipped slice is anime-only and includes:

- a single-page rating canvas at `/anime/[slug]/rate`
- stored axis scores per user
- a Toasty overall score derived from the core dimensions
- optional flavor scores such as action, romance, comedy, tension, and spectacle
- profile and detail-page surfaces that show early rating outputs

## Rating system goals

The Toasty rating system should:

1. feel richer than stars or a single ten-point score
2. stay intuitive enough for repeated casual use
3. support comparison across anime, TV shows, and movies
4. capture what a title is like, not just how good it is
5. power profiles, recommendations, and tournament seeding

## Rating model

The rating system should use three layers.

### Layer 1 - Universal core dimensions

These dimensions exist across all screen media and power cross-media comparison.

- quality
- fun
- emotional impact
- originality
- rewatch or revisit pull
- recommendation strength

These are the most important dimensions for universal ranking, profile summaries, and cross-media seeding logic.

### Layer 2 - Flavor profile dimensions

These describe what kind of experience the title delivers.

- action
- romance
- comedy
- tension
- spectacle
- coziness
- darkness
- weirdness

Flavor dimensions should shape recommendation explanations, profile signatures, and matchup framing. They should not overpower the universal core when building comparable cross-media rankings.

### Layer 3 - Format-specific nuance

Optional media-specific dimensions can exist where they improve accuracy.

Examples:

- episodic consistency
- payoff
- character attachment
- cinematic impact
- performance presence

These should remain optional and should not break the shared cross-media core.

## Input experience

The rating UI should use a single rich page or sheet per title.

- all major dimensions live on one screen
- users can fill in as much or as little as they want
- users can save partial work and return later
- users can edit any field at any time
- the page should show live visual feedback while rating

This should feel like a taste canvas, not a wizard.

The current anime implementation now follows this direction directly with a single-page route.

## Completion rules

- a rating can be saved with only the universal core dimensions filled out
- flavor dimensions are optional but strongly encouraged
- format-specific nuance remains optional
- text reactions or reviews can remain optional and arrive later if needed

This is now true in the first anime flow: core dimensions are required, flavor dimensions are optional, and a short written note is optional.

## Rating outputs

The product should derive playful but interpretable outputs from the structured rating data.

Possible outputs:

- a universal Toasty score or comparable summary built from the core dimensions
- radar or polygon chart views
- flavor bars or chips
- dominant vibe tags
- a public taste signature on profile pages

The public presentation can feel fun, but the underlying model should remain understandable and defensible.

## Current implementation posture

The current rating implementation is still anime-first and does not yet deliver the full cross-media contract.

- anime uses universal-style core dimensions plus a first flavor set
- profile surfaces now show rated-title count and average Toasty score
- tracked-title cards can now show a stored Toasty score when one exists
- anime detail pages now surface community Toasty scores, shared flavor tags, and strongest core-dimension averages
- aggregate community scores now feed recommendation ranking and tournament seeding inputs

## Relationship to recommendations

Ratings should directly power:

- `because you rated high on ...` recommendations
- profile summaries of what a user tends to love
- title-to-title similarity beyond genres alone
- stronger editorial and trend-assisted recommendation framing

## Relationship to tournaments

The universal core dimensions should inform tournament seeding more heavily than flavor dimensions. Flavor dimensions should be used more for storytelling, matchup framing, and explainability than raw ranking weight.

## Checklist role after ratings launch

Checklist tracking still matters after ratings exist.

- planned and in-progress states help recommendation timing
- done titles become the strongest prompts to rate
- abandoned titles help profile taste inference without requiring a full rating
