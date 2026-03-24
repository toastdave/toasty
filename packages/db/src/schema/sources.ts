import {
	index,
	jsonb,
	pgEnum,
	pgTable,
	timestamp,
	uniqueIndex,
	uuid,
	varchar,
} from 'drizzle-orm/pg-core'
import { mediaItems } from './media'

export const ingestJobTypeEnum = pgEnum('ingest_job_type', [
	'trending',
	'lookup',
	'sync',
	'backfill',
])
export const ingestJobStatusEnum = pgEnum('ingest_job_status', [
	'queued',
	'running',
	'success',
	'failed',
])

export const externalSources = pgTable('external_sources', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: varchar('name', { length: 64 }).notNull().unique(),
	baseUrl: varchar('base_url', { length: 255 }),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const externalSourceItems = pgTable(
	'external_source_items',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		sourceId: uuid('source_id')
			.notNull()
			.references(() => externalSources.id, { onDelete: 'cascade' }),
		externalId: varchar('external_id', { length: 128 }).notNull(),
		mediaItemId: uuid('media_item_id')
			.notNull()
			.references(() => mediaItems.id, { onDelete: 'cascade' }),
		sourceUrl: varchar('source_url', { length: 255 }),
		rawPayloadJsonb: jsonb('raw_payload_jsonb').notNull(),
		lastFetchedAt: timestamp('last_fetched_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		index('external_source_items_source_idx').on(table.sourceId),
		index('external_source_items_media_item_idx').on(table.mediaItemId),
		uniqueIndex('external_source_items_source_external_idx').on(table.sourceId, table.externalId),
	]
)

export const ingestJobs = pgTable(
	'ingest_jobs',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		sourceId: uuid('source_id').references(() => externalSources.id, { onDelete: 'set null' }),
		jobType: ingestJobTypeEnum('job_type').notNull(),
		status: ingestJobStatusEnum('status').notNull().default('queued'),
		startedAt: timestamp('started_at', { withTimezone: true }),
		finishedAt: timestamp('finished_at', { withTimezone: true }),
		errorMessage: varchar('error_message', { length: 255 }),
		metadataJsonb: jsonb('metadata_jsonb').default({}),
	},
	(table) => [index('ingest_jobs_status_idx').on(table.status)]
)
