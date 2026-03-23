import { index, jsonb, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { user } from './auth'

export const activityTypeEnum = pgEnum('activity_type', [
	'rated',
	'completed',
	'voted',
	'created_list',
	'followed_user',
])

export const activityEvents = pgTable(
	'activity_events',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		type: activityTypeEnum('type').notNull(),
		entityType: varchar('entity_type', { length: 64 }).notNull(),
		entityId: uuid('entity_id').notNull(),
		payloadJsonb: jsonb('payload_jsonb').default({}),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [index('activity_events_user_idx').on(table.userId, table.createdAt)]
)
