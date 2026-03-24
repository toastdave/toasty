import {
	index,
	integer,
	jsonb,
	numeric,
	pgEnum,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uuid,
	varchar,
} from 'drizzle-orm/pg-core'

export const mediaTypeEnum = pgEnum('media_type', [
	'movie',
	'tv_show',
	'anime',
	'book',
	'album',
	'track',
])

export const mediaStatusEnum = pgEnum('media_status', ['active', 'hidden', 'duplicate'])

export const mediaItems = pgTable(
	'media_items',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		type: mediaTypeEnum('type').notNull(),
		title: varchar('title', { length: 256 }).notNull(),
		originalTitle: varchar('original_title', { length: 256 }),
		slug: varchar('slug', { length: 280 }).notNull().unique(),
		description: text('description'),
		language: varchar('language', { length: 32 }),
		releaseDate: timestamp('release_date', { withTimezone: true }),
		runtimeMinutes: integer('runtime_minutes'),
		imageUrlPoster: text('image_url_poster'),
		imageUrlBackdrop: text('image_url_backdrop'),
		canonicalUrl: text('canonical_url'),
		status: mediaStatusEnum('status').notNull().default('active'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		index('media_items_type_idx').on(table.type),
		index('media_items_slug_idx').on(table.slug),
	]
)

export const mediaContributors = pgTable('media_contributors', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: varchar('name', { length: 160 }).notNull(),
	imageUrl: text('image_url'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const mediaCredits = pgTable(
	'media_credits',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		mediaItemId: uuid('media_item_id')
			.notNull()
			.references(() => mediaItems.id, { onDelete: 'cascade' }),
		contributorId: uuid('contributor_id')
			.notNull()
			.references(() => mediaContributors.id, { onDelete: 'cascade' }),
		role: varchar('role', { length: 120 }).notNull(),
		characterName: varchar('character_name', { length: 120 }),
		sortOrder: integer('sort_order'),
	},
	(table) => [index('media_credits_media_item_idx').on(table.mediaItemId)]
)

export const genres = pgTable('genres', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: varchar('name', { length: 80 }).notNull().unique(),
	slug: varchar('slug', { length: 100 }).notNull().unique(),
})

export const mediaItemGenres = pgTable(
	'media_item_genres',
	{
		mediaItemId: uuid('media_item_id')
			.notNull()
			.references(() => mediaItems.id, { onDelete: 'cascade' }),
		genreId: uuid('genre_id')
			.notNull()
			.references(() => genres.id, { onDelete: 'cascade' }),
	},
	(table) => [primaryKey({ columns: [table.mediaItemId, table.genreId] })]
)

export const movieDetails = pgTable('movie_details', {
	mediaItemId: uuid('media_item_id')
		.primaryKey()
		.references(() => mediaItems.id, { onDelete: 'cascade' }),
	tmdbId: varchar('tmdb_id', { length: 64 }),
	budget: integer('budget'),
	revenue: integer('revenue'),
	certification: varchar('certification', { length: 16 }),
})

export const showDetails = pgTable('show_details', {
	mediaItemId: uuid('media_item_id')
		.primaryKey()
		.references(() => mediaItems.id, { onDelete: 'cascade' }),
	tmdbId: varchar('tmdb_id', { length: 64 }),
	seasonCount: integer('season_count'),
	episodeCount: integer('episode_count'),
	network: varchar('network', { length: 120 }),
})

export const animeDetails = pgTable('anime_details', {
	mediaItemId: uuid('media_item_id')
		.primaryKey()
		.references(() => mediaItems.id, { onDelete: 'cascade' }),
	jikanMalId: varchar('jikan_mal_id', { length: 64 }),
	episodeCount: integer('episode_count'),
	format: varchar('format', { length: 40 }),
	airingStatus: varchar('airing_status', { length: 64 }),
	season: varchar('season', { length: 20 }),
	year: integer('year'),
	sourceScore: numeric('source_score', { precision: 4, scale: 2 }),
	sourceRank: integer('source_rank'),
	sourcePopularity: integer('source_popularity'),
	sourceMaterial: varchar('source_material', { length: 80 }),
	ratingLabel: varchar('rating_label', { length: 40 }),
	background: text('background'),
	broadcastLabel: varchar('broadcast_label', { length: 120 }),
	broadcastDay: varchar('broadcast_day', { length: 32 }),
	broadcastTime: varchar('broadcast_time', { length: 32 }),
	broadcastTimezone: varchar('broadcast_timezone', { length: 64 }),
	airedLabel: varchar('aired_label', { length: 120 }),
	airedFrom: timestamp('aired_from', { withTimezone: true }),
	airedTo: timestamp('aired_to', { withTimezone: true }),
	studiosJsonb: jsonb('studios_jsonb').default([]),
	themesJsonb: jsonb('themes_jsonb').default([]),
	demographicsJsonb: jsonb('demographics_jsonb').default([]),
})

export const bookDetails = pgTable('book_details', {
	mediaItemId: uuid('media_item_id')
		.primaryKey()
		.references(() => mediaItems.id, { onDelete: 'cascade' }),
	isbn10: varchar('isbn10', { length: 16 }),
	isbn13: varchar('isbn13', { length: 16 }),
	pageCount: integer('page_count'),
	publisher: varchar('publisher', { length: 160 }),
})

export const albumDetails = pgTable('album_details', {
	mediaItemId: uuid('media_item_id')
		.primaryKey()
		.references(() => mediaItems.id, { onDelete: 'cascade' }),
	spotifyId: varchar('spotify_id', { length: 64 }),
	label: varchar('label', { length: 120 }),
	upc: varchar('upc', { length: 32 }),
})

export const trackDetails = pgTable('track_details', {
	mediaItemId: uuid('media_item_id')
		.primaryKey()
		.references(() => mediaItems.id, { onDelete: 'cascade' }),
	spotifyId: varchar('spotify_id', { length: 64 }),
	isrc: varchar('isrc', { length: 32 }),
	durationMs: integer('duration_ms'),
	albumMediaItemId: uuid('album_media_item_id').references(() => mediaItems.id, {
		onDelete: 'set null',
	}),
})
