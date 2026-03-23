import {
	boolean,
	index,
	integer,
	pgEnum,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uuid,
	varchar,
} from 'drizzle-orm/pg-core'
import { user } from './auth'
import { mediaItems, mediaTypeEnum } from './media'

export const listVisibilityEnum = pgEnum('list_visibility', ['public', 'unlisted', 'private'])
export const checklistStatusEnum = pgEnum('checklist_status', [
	'planned',
	'in_progress',
	'done',
	'abandoned',
])

export const lists = pgTable(
	'lists',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		ownerUserId: text('owner_user_id').references(() => user.id, { onDelete: 'set null' }),
		title: varchar('title', { length: 160 }).notNull(),
		slug: varchar('slug', { length: 180 }).notNull().unique(),
		description: varchar('description', { length: 500 }),
		visibility: listVisibilityEnum('visibility').notNull().default('public'),
		isOfficial: boolean('is_official').notNull().default(false),
		mediaType: mediaTypeEnum('media_type'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [index('lists_owner_idx').on(table.ownerUserId)]
)

export const listItems = pgTable(
	'list_items',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		listId: uuid('list_id')
			.notNull()
			.references(() => lists.id, { onDelete: 'cascade' }),
		mediaItemId: uuid('media_item_id')
			.notNull()
			.references(() => mediaItems.id, { onDelete: 'cascade' }),
		position: integer('position').notNull().default(0),
		note: varchar('note', { length: 280 }),
	},
	(table) => [index('list_items_list_idx').on(table.listId)]
)

export const userChecklists = pgTable(
	'user_checklists',
	{
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		mediaItemId: uuid('media_item_id')
			.notNull()
			.references(() => mediaItems.id, { onDelete: 'cascade' }),
		status: checklistStatusEnum('status').notNull().default('planned'),
		startedAt: timestamp('started_at', { withTimezone: true }),
		completedAt: timestamp('completed_at', { withTimezone: true }),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [primaryKey({ columns: [table.userId, table.mediaItemId] })]
)
