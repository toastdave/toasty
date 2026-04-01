# Lists Profiles And Social

## Profile goals

Profiles should eventually become the personal home base for a user's ratings, tracked titles, lists, and tournament history.

The first public shell is now live through shareable handle-based profile pages backed by tracked anime.

## Current posture

- auth exists and users can sign in and sign out
- users can now track anime from detail pages
- a lightweight signed-in tracked-anime destination exists at `/me`
- a lightweight public profile shell exists at `/u/[handle]`
- the next priority is a lightweight activity layer, not a full social graph

## Lists goals

- official editorial lists
- giant community browse lists
- personal check-off lists

## Social layer

The first social slice should stay light:

- inspect public profiles [done]
- view recent completion or collection activity [next]
- follow users later, after the personal profile loop is solid

Groups and private circles can arrive after the public profile loop is stable.
