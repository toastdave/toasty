# Lists Profiles And Social

## Profile goals

Profiles should become the personal home base for a user's tracked titles, ratings, taste signature, recommendation context, and tournament history.

The first public shell is already live through shareable handle-based profile pages backed by tracked anime. The next version should move from `tracked titles only` into `tracked titles plus expressed taste`.

## Current posture

- auth exists and users can sign in and sign out
- users can track anime from detail pages
- a signed-in tracked-media destination exists at `/me`, even though the current UI is still anime-first
- a lightweight public profile shell exists at `/u/[handle]`
- the next priority is moving profiles toward taste identity and lightweight activity, not a heavy social graph

## Profile evolution

Profiles should grow in this order:

1. tracked titles and basic identity [live]
2. editable bio, avatar polish, and profile customization [next]
3. rating-derived taste signature and flavor summaries
4. lightweight recent activity
5. tournament participation, picks, rankings, and history

## Taste identity on profile pages

Once ratings launch, profiles should surface:

- universal rating tendencies such as high-fun or high-emotion lean
- flavor tendencies such as action-forward or romance-heavy taste
- dominant vibes or signature tags
- recent highly recommended titles from the user

These outputs should feel playful, but they should always remain interpretable.

The first shipped version now exposes a lighter rating identity layer:

- rated-title count
- average Toasty score
- per-title Toasty scores on tracked cards when available

## Lists goals

- official editorial lists
- giant community browse lists
- personal check-off lists
- recommendation-friendly collections such as `best slow burns` or `high fun, low prestige`

## Social layer

The first social slice should stay light:

- inspect public profiles [done]
- view recent completion, rating, or collection activity [next]
- share public profile links and title reactions
- follow users later, after the personal profile loop is solid

Groups and private circles can arrive after the public profile loop is stable.

## Cross-media profile rule

Profiles should eventually represent a user's full screen-media taste across anime, TV shows, and movies. The product can still ship media lanes separately, but the public identity should feel unified once multiple categories are live.
