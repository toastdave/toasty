import {
	index,
	integer,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from 'drizzle-orm/pg-core'
import { user } from './auth'
import { mediaItems, mediaTypeEnum } from './media'

export const scopeTypeEnum = pgEnum('scope_type', ['global', 'group'])
export const tournamentStatusEnum = pgEnum('tournament_status', ['draft', 'active', 'complete'])
export const matchupStatusEnum = pgEnum('matchup_status', [
	'scheduled',
	'open',
	'closed',
	'finalized',
])

export const tournaments = pgTable(
	'tournaments',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		name: varchar('name', { length: 160 }).notNull(),
		slug: varchar('slug', { length: 180 }).notNull().unique(),
		mediaType: mediaTypeEnum('media_type').notNull(),
		year: integer('year').notNull(),
		scopeType: scopeTypeEnum('scope_type').notNull().default('global'),
		scopeId: uuid('scope_id'),
		status: tournamentStatusEnum('status').notNull().default('draft'),
		startsAt: timestamp('starts_at', { withTimezone: true }),
		endsAt: timestamp('ends_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [index('tournaments_year_idx').on(table.year, table.mediaType)]
)

export const tournamentEntries = pgTable(
	'tournament_entries',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		tournamentId: uuid('tournament_id')
			.notNull()
			.references(() => tournaments.id, { onDelete: 'cascade' }),
		mediaItemId: uuid('media_item_id')
			.notNull()
			.references(() => mediaItems.id, { onDelete: 'cascade' }),
		seed: integer('seed').notNull(),
		region: varchar('region', { length: 60 }),
		entryLabel: varchar('entry_label', { length: 120 }),
	},
	(table) => [index('tournament_entries_tournament_idx').on(table.tournamentId)]
)

export const matchups = pgTable(
	'matchups',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		tournamentId: uuid('tournament_id')
			.notNull()
			.references(() => tournaments.id, { onDelete: 'cascade' }),
		roundNumber: integer('round_number').notNull(),
		matchupNumber: integer('matchup_number').notNull(),
		entryAId: uuid('entry_a_id')
			.notNull()
			.references(() => tournamentEntries.id, { onDelete: 'cascade' }),
		entryBId: uuid('entry_b_id')
			.notNull()
			.references(() => tournamentEntries.id, { onDelete: 'cascade' }),
		startsAt: timestamp('starts_at', { withTimezone: true }),
		endsAt: timestamp('ends_at', { withTimezone: true }),
		winnerEntryId: uuid('winner_entry_id').references(() => tournamentEntries.id, {
			onDelete: 'set null',
		}),
		status: matchupStatusEnum('status').notNull().default('scheduled'),
	},
	(table) => [index('matchups_tournament_idx').on(table.tournamentId, table.roundNumber)]
)

export const matchupVotes = pgTable(
	'matchup_votes',
	{
		matchupId: uuid('matchup_id')
			.notNull()
			.references(() => matchups.id, { onDelete: 'cascade' }),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		voteEntryId: uuid('vote_entry_id')
			.notNull()
			.references(() => tournamentEntries.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [index('matchup_votes_matchup_idx').on(table.matchupId)]
)

export const matchupComments = pgTable(
	'matchup_comments',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		matchupId: uuid('matchup_id')
			.notNull()
			.references(() => matchups.id, { onDelete: 'cascade' }),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		body: varchar('body', { length: 2000 }).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [index('matchup_comments_matchup_idx').on(table.matchupId)]
)
