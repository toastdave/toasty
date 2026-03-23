import {
	index,
	integer,
	jsonb,
	numeric,
	pgEnum,
	pgTable,
	timestamp,
	uuid,
	varchar,
} from 'drizzle-orm/pg-core'
import { mediaItems, mediaTypeEnum } from './media'
import { externalSources } from './sources'

export const trendWindowEnum = pgEnum('trend_window', ['daily', 'weekly', 'monthly'])

export const trendSnapshots = pgTable(
	'trend_snapshots',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		sourceId: uuid('source_id').references(() => externalSources.id, { onDelete: 'set null' }),
		window: trendWindowEnum('window').notNull(),
		snapshotDate: timestamp('snapshot_date', { withTimezone: true }).notNull(),
		mediaType: mediaTypeEnum('media_type'),
		label: varchar('label', { length: 160 }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [index('trend_snapshots_window_idx').on(table.window, table.snapshotDate)]
)

export const trendSnapshotItems = pgTable(
	'trend_snapshot_items',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		trendSnapshotId: uuid('trend_snapshot_id')
			.notNull()
			.references(() => trendSnapshots.id, { onDelete: 'cascade' }),
		mediaItemId: uuid('media_item_id')
			.notNull()
			.references(() => mediaItems.id, { onDelete: 'cascade' }),
		rank: integer('rank').notNull(),
		score: numeric('score', { precision: 10, scale: 4 }),
		deltaRank: integer('delta_rank'),
		metadataJsonb: jsonb('metadata_jsonb').default({}),
	},
	(table) => [index('trend_snapshot_items_snapshot_idx').on(table.trendSnapshotId)]
)

export const mediaPopularityMetrics = pgTable(
	'media_popularity_metrics',
	{
		mediaItemId: uuid('media_item_id')
			.primaryKey()
			.references(() => mediaItems.id, { onDelete: 'cascade' }),
		popularityScore: numeric('popularity_score', { precision: 10, scale: 4 }),
		trendingScore: numeric('trending_score', { precision: 10, scale: 4 }),
		ratingScore: numeric('rating_score', { precision: 10, scale: 4 }),
		engagementScore: numeric('engagement_score', { precision: 10, scale: 4 }),
		lastCalculatedAt: timestamp('last_calculated_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [index('media_popularity_metrics_last_calculated_idx').on(table.lastCalculatedAt)]
)
