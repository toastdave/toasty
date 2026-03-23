# Anime Catalog And Ingestion

## Source strategy

Jikan is the first anime source adapter. It provides strong public coverage for top anime, current seasonal data, and title details without requiring API keys.

## Canonical model

We still keep canonical anime records in our own database:

- `media_items` for cross-media identity
- `anime_details` for anime-specific metadata
- `external_source_items` for source mappings, raw payloads, and fetch timestamps

## Sync rules

1. Match by source mapping first.
2. Fall back to normalized title plus year plus media type.
3. Store raw payloads for debugging and future enrichment.
4. Copy only actively used fields into canonical columns.
5. Save remote poster image URLs in v1 rather than downloading binaries.

## Data freshness

- top charts and schedules can refresh on a short cadence
- item details can refresh lazily on view or through scheduled sync
- failed syncs should be logged as ingest jobs for recovery
