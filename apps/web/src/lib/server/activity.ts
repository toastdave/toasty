import { db } from '$lib/server/db'
import { activityEvents, mediaItems } from '@toasty/db/schema'
import { and, desc, eq } from 'drizzle-orm'

type ActivityPayload = Record<string, unknown>

type AnimeActivitySubject = {
	posterUrl: string | null
	slug: string
	title: string
}

export type ActivityFeedItem = {
	createdAt: Date
	description: string
	href: string | null
	id: string
	imageUrl: string | null
	label: string
	title: string
	type: 'completed' | 'created_list' | 'rated' | 'voted'
}

function readString(value: unknown) {
	return typeof value === 'string' && value.length > 0 ? value : null
}

function readNumber(value: unknown) {
	return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function readStringArray(value: unknown) {
	if (!Array.isArray(value)) {
		return []
	}

	return value.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0)
}

function formatActivityRow(row: {
	createdAt: Date
	id: string
	payloadJsonb: unknown
	type: 'completed' | 'created_list' | 'followed_user' | 'rated' | 'voted'
}) {
	const payload =
		row.payloadJsonb && typeof row.payloadJsonb === 'object'
			? (row.payloadJsonb as ActivityPayload)
			: {}

	if (row.type === 'completed') {
		const title = readString(payload.title)

		if (!title) {
			return null
		}

		const slug = readString(payload.slug)

		return {
			createdAt: row.createdAt,
			description: 'Marked this anime complete and pushed it into the finished pile.',
			href: slug ? `/anime/${slug}` : null,
			id: row.id,
			imageUrl: readString(payload.posterUrl),
			label: 'Completed anime',
			title,
			type: 'completed' as const,
		}
	}

	if (row.type === 'rated') {
		const title = readString(payload.title)

		if (!title) {
			return null
		}

		const overallScore = readNumber(payload.overallScore)
		const tags = readStringArray(payload.tags)
		const tagLabel = tags.length > 0 ? ` Flavor tags: ${tags.join(', ')}.` : ''
		const scoreLabel =
			overallScore !== null ? `Saved a Toasty score of ${overallScore}.` : 'Saved a Toasty rating.'
		const slug = readString(payload.slug)

		return {
			createdAt: row.createdAt,
			description: `${scoreLabel}${tagLabel}`,
			href: slug ? `/anime/${slug}` : null,
			id: row.id,
			imageUrl: readString(payload.posterUrl),
			label: 'Rated anime',
			title,
			type: 'rated' as const,
		}
	}

	if (row.type === 'voted') {
		const selectedTitle = readString(payload.selectedTitle)
		const opponentTitle = readString(payload.opponentTitle)
		const year = readNumber(payload.year)

		if (!selectedTitle || !opponentTitle || year === null) {
			return null
		}

		const matchupId = readString(payload.matchupId)

		return {
			createdAt: row.createdAt,
			description: `Picked ${selectedTitle} over ${opponentTitle} in the ${year} bracket.`,
			href: matchupId ? `/tournaments/anime/${year}/matchups/${matchupId}` : null,
			id: row.id,
			imageUrl: null,
			label: 'Tournament vote',
			title: selectedTitle,
			type: 'voted' as const,
		}
	}

	if (row.type === 'created_list') {
		const title = readString(payload.title)
		const slug = readString(payload.slug)

		if (!title || !slug) {
			return null
		}

		return {
			createdAt: row.createdAt,
			description: 'Published a fresh list to share favorites, picks, or a watch lane.',
			href: `/lists/${slug}`,
			id: row.id,
			imageUrl: null,
			label: 'Created list',
			title,
			type: 'created_list' as const,
		}
	}

	return null
}

async function saveActivityEvent(params: {
	entityId: string
	entityType: string
	payload: ActivityPayload
	type: 'completed' | 'created_list' | 'rated' | 'voted'
	userId: string
}) {
	await db.transaction(async (tx) => {
		await tx
			.delete(activityEvents)
			.where(
				and(
					eq(activityEvents.entityId, params.entityId),
					eq(activityEvents.type, params.type),
					eq(activityEvents.userId, params.userId)
				)
			)

		await tx.insert(activityEvents).values({
			entityId: params.entityId,
			entityType: params.entityType,
			payloadJsonb: params.payload,
			type: params.type,
			userId: params.userId,
		})
	})
}

export async function getAnimeActivitySubjectByMediaItemId(mediaItemId: string) {
	const [row] = await db
		.select({
			imageUrlPoster: mediaItems.imageUrlPoster,
			slug: mediaItems.slug,
			title: mediaItems.title,
		})
		.from(mediaItems)
		.where(eq(mediaItems.id, mediaItemId))
		.limit(1)

	if (!row?.slug) {
		return null
	}

	return {
		posterUrl: row.imageUrlPoster,
		slug: row.slug,
		title: row.title,
	} satisfies AnimeActivitySubject
}

export async function listUserActivity(userId: string, limit = 8) {
	const rows = await db
		.select({
			createdAt: activityEvents.createdAt,
			id: activityEvents.id,
			payloadJsonb: activityEvents.payloadJsonb,
			type: activityEvents.type,
		})
		.from(activityEvents)
		.where(eq(activityEvents.userId, userId))
		.orderBy(desc(activityEvents.createdAt))
		.limit(limit)

	return rows.map(formatActivityRow).filter(Boolean) as ActivityFeedItem[]
}

export async function recordAnimeCompletedActivity(params: {
	mediaItemId: string
	userId: string
}) {
	const subject = await getAnimeActivitySubjectByMediaItemId(params.mediaItemId)

	if (!subject) {
		return
	}

	await saveActivityEvent({
		entityId: params.mediaItemId,
		entityType: 'media_item',
		payload: subject,
		type: 'completed',
		userId: params.userId,
	})
}

export async function recordAnimeRatingActivity(params: {
	mediaItemId: string
	overallScore: number | null
	tags: string[]
	userId: string
}) {
	const subject = await getAnimeActivitySubjectByMediaItemId(params.mediaItemId)

	if (!subject) {
		return
	}

	await saveActivityEvent({
		entityId: params.mediaItemId,
		entityType: 'media_item',
		payload: {
			...subject,
			overallScore: params.overallScore,
			tags: params.tags,
		},
		type: 'rated',
		userId: params.userId,
	})
}

export async function recordTournamentVoteActivity(params: {
	matchupId: string
	opponentTitle: string
	selectedTitle: string
	userId: string
	year: number
}) {
	await saveActivityEvent({
		entityId: params.matchupId,
		entityType: 'matchup',
		payload: {
			matchupId: params.matchupId,
			opponentTitle: params.opponentTitle,
			selectedTitle: params.selectedTitle,
			year: params.year,
		},
		type: 'voted',
		userId: params.userId,
	})
}

export async function recordCreatedListActivity(params: {
	listId: string
	slug: string
	title: string
	userId: string
}) {
	await saveActivityEvent({
		entityId: params.listId,
		entityType: 'list',
		payload: {
			slug: params.slug,
			title: params.title,
		},
		type: 'created_list',
		userId: params.userId,
	})
}
