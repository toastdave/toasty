import {
	index,
	pgEnum,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uuid,
	varchar,
} from 'drizzle-orm/pg-core'
import { user } from './auth'

export const groupRoleEnum = pgEnum('group_role', ['owner', 'admin', 'member'])

export const follows = pgTable(
	'follows',
	{
		followerUserId: text('follower_user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		followingUserId: text('following_user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [primaryKey({ columns: [table.followerUserId, table.followingUserId] })]
)

export const groups = pgTable(
	'groups',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		name: varchar('name', { length: 120 }).notNull(),
		ownerUserId: text('owner_user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [index('groups_owner_idx').on(table.ownerUserId)]
)

export const groupMembers = pgTable(
	'group_members',
	{
		groupId: uuid('group_id')
			.notNull()
			.references(() => groups.id, { onDelete: 'cascade' }),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		role: groupRoleEnum('role').notNull().default('member'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [primaryKey({ columns: [table.groupId, table.userId] })]
)
