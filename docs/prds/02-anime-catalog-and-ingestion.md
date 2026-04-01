# Anime Catalog And Ingestion

## Source strategy

Jikan is the first anime source adapter. It provides strong public coverage for top anime, current seasonal data, and title details without requiring API keys.

The next source-adapter wave should target TV shows and movies. Anime remains the strongest launch lane, but the ingestion architecture should now be treated as a multi-media adapter system rather than an anime-only service.

## Canonical model

We still keep canonical anime records in our own database:

- `media_items` for cross-media identity
- `anime_details` for anime-specific metadata
- `external_source_items` for source mappings, raw payloads, and fetch timestamps
- `trend_snapshots` and `trend_snapshot_items` for cached chart and schedule views
- `ingest_jobs` for sync visibility and failure recovery

The larger canonical model is already cross-media through `media_items`. Anime-specific detail tables should be treated as the first specialization, not the permanent center of the platform.

## Sync rules

1. Match by source mapping first.
2. Fall back to normalized title plus year plus media type.
3. Store raw payloads for debugging and future enrichment.
4. Copy only actively used fields into canonical columns.
5. Save remote poster image URLs in v1 rather than downloading binaries.

## Current implementation state

- top anime and current season feeds sync into the canonical catalog
- detail pages can read from stored anime detail records
- trend pages prefer cached snapshots and fall back to live Jikan requests if needed
- anime detail pages use stale-aware refresh behavior instead of forcing a sync on every request
- failed syncs are logged as ingest jobs

## Data freshness

- top charts and schedules refresh on a short cadence through the catalog service
- item details refresh lazily when cached detail records age out
- failed syncs should remain recoverable through repeat sync attempts and future manual admin controls

## Future adapter direction

1. keep adapter contracts generic across screen media
2. preserve canonical media identity even when providers disagree
3. expand to TV before movies if product surfaces still lean episodic
4. avoid cross-media browse promises until each media lane has dependable ingestion and detail coverage
