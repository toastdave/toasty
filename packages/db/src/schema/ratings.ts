import {
	boolean,
	index,
	integer,
	jsonb,
	numeric,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uuid,
	varchar,
} from 'drizzle-orm/pg-core'
import { user } from './auth'
import { mediaItems, mediaTypeEnum } from './media'

export const ratingRubrics = pgTable('rating_rubrics', {
	id: uuid('id').defaultRandom().primaryKey(),
	mediaType: mediaTypeEnum('media_type').notNull(),
	name: varchar('name', { length: 120 }).notNull(),
	version: integer('version').notNull().default(1),
	isActive: boolean('is_active').notNull().default(true),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const ratingAxes = pgTable(
	'rating_axes',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		rubricId: uuid('rubric_id')
			.notNull()
			.references(() => ratingRubrics.id, { onDelete: 'cascade' }),
		key: varchar('key', { length: 64 }).notNull(),
		label: varchar('label', { length: 80 }).notNull(),
		minValue: integer('min_value').notNull().default(1),
		maxValue: integer('max_value').notNull().default(10),
		weight: numeric('weight', { precision: 4, scale: 2 }).notNull(),
		emoji: varchar('emoji', { length: 16 }),
		description: varchar('description', { length: 255 }),
		sortOrder: integer('sort_order').notNull().default(0),
	},
	(table) => [index('rating_axes_rubric_idx').on(table.rubricId)]
)

export const userRatings = pgTable(
	'user_ratings',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		mediaItemId: uuid('media_item_id')
			.notNull()
			.references(() => mediaItems.id, { onDelete: 'cascade' }),
		rubricId: uuid('rubric_id')
			.notNull()
			.references(() => ratingRubrics.id, { onDelete: 'cascade' }),
		overallScore: numeric('overall_score', { precision: 4, scale: 2 }),
		reviewText: varchar('review_text', { length: 2000 }),
		containsSpoilers: boolean('contains_spoilers').notNull().default(false),
		tagsJsonb: jsonb('tags_jsonb').default([]),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		index('user_ratings_user_idx').on(table.userId),
		index('user_ratings_media_idx').on(table.mediaItemId),
	]
)

export const userRatingAxisScores = pgTable(
	'user_rating_axis_scores',
	{
		userRatingId: uuid('user_rating_id')
			.notNull()
			.references(() => userRatings.id, { onDelete: 'cascade' }),
		axisId: uuid('axis_id')
			.notNull()
			.references(() => ratingAxes.id, { onDelete: 'cascade' }),
		score: numeric('score', { precision: 4, scale: 2 }).notNull(),
	},
	(table) => [primaryKey({ columns: [table.userRatingId, table.axisId] })]
)

export const vibeBadges = pgTable('vibe_badges', {
	id: uuid('id').defaultRandom().primaryKey(),
	key: varchar('key', { length: 80 }).notNull().unique(),
	label: varchar('label', { length: 80 }).notNull(),
	emoji: varchar('emoji', { length: 16 }).notNull(),
	description: varchar('description', { length: 255 }),
})

export const mediaItemVibeBadges = pgTable(
	'media_item_vibe_badges',
	{
		mediaItemId: uuid('media_item_id')
			.notNull()
			.references(() => mediaItems.id, { onDelete: 'cascade' }),
		vibeBadgeId: uuid('vibe_badge_id')
			.notNull()
			.references(() => vibeBadges.id, { onDelete: 'cascade' }),
		source: varchar('source', { length: 32 }).notNull().default('system'),
		confidence: numeric('confidence', { precision: 4, scale: 2 }),
	},
	(table) => [primaryKey({ columns: [table.mediaItemId, table.vibeBadgeId] })]
)

export const mediaAggregateScores = pgTable(
	'media_aggregate_scores',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		mediaItemId: uuid('media_item_id')
			.notNull()
			.references(() => mediaItems.id, { onDelete: 'cascade' }),
		scopeType: varchar('scope_type', { length: 20 }).notNull().default('global'),
		scopeId: uuid('scope_id'),
		rubricId: uuid('rubric_id')
			.notNull()
			.references(() => ratingRubrics.id, { onDelete: 'cascade' }),
		overallAvg: numeric('overall_avg', { precision: 4, scale: 2 }),
		ratingCount: integer('rating_count').notNull().default(0),
		axisAveragesJsonb: jsonb('axis_averages_jsonb').default({}),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [index('media_aggregate_scores_media_idx').on(table.mediaItemId)]
)

export const mediaYearlyRankings = pgTable(
	'media_yearly_rankings',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		year: integer('year').notNull(),
		mediaType: mediaTypeEnum('media_type').notNull(),
		mediaItemId: uuid('media_item_id')
			.notNull()
			.references(() => mediaItems.id, { onDelete: 'cascade' }),
		compositeScore: numeric('composite_score', { precision: 10, scale: 4 }),
		popularityRank: integer('popularity_rank'),
		ratingRank: integer('rating_rank'),
		engagementRank: integer('engagement_rank'),
		finalSeedScore: numeric('final_seed_score', { precision: 10, scale: 4 }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [index('media_yearly_rankings_year_idx').on(table.year, table.mediaType)]
)
