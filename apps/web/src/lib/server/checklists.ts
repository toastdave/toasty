import {
	type ChecklistStatus,
	checklistStatuses,
	getChecklistStatusMeta,
	resolveChecklistDates,
} from '$lib/checklists'
import { db } from '$lib/server/db'
import { syncJikanAnimeDetailCatalog } from '$lib/server/services/jikan/catalog'
import { animeDetails, mediaItems, userChecklists } from '@toasty/db/schema'
import { and, desc, eq } from 'drizzle-orm'

export type AnimeChecklistEntry = {
	completedAt: Date | null
	startedAt: Date | null
	status: ChecklistStatus
	updatedAt: Date
}

export type TrackedAnime = {
	broadcastLabel: string | null
	episodes: number | null
	posterUrl: string | null
	score: number | null
	secondaryTitle: string | null
	season: string | null
	slug: string
	status: ChecklistStatus
	statusLabel: string
	title: string
	updatedAt: Date
	year: number | null
}

function toNullableNumber(value: unknown) {
	if (typeof value === 'number') {
		return Number.isFinite(value) ? value : null
	}

	if (typeof value === 'string' && value.length > 0) {
		const parsed = Number(value)
		return Number.isFinite(parsed) ? parsed : null
	}

	return null
}

export async function ensureAnimeMediaItemId(malId: number, fetcher: typeof fetch) {
	const [existingAnime] = await db
		.select({ mediaItemId: animeDetails.mediaItemId })
		.from(animeDetails)
		.where(eq(animeDetails.jikanMalId, String(malId)))
		.limit(1)

	if (existingAnime) {
		return existingAnime.mediaItemId
	}

	const syncedAnime = await syncJikanAnimeDetailCatalog(malId, fetcher)
	return syncedAnime.mediaItemId
}

export async function getAnimeChecklistEntry(
	userId: string,
	malId: number
): Promise<AnimeChecklistEntry | null> {
	const [entry] = await db
		.select({
			completedAt: userChecklists.completedAt,
			startedAt: userChecklists.startedAt,
			status: userChecklists.status,
			updatedAt: userChecklists.updatedAt,
		})
		.from(userChecklists)
		.innerJoin(animeDetails, eq(animeDetails.mediaItemId, userChecklists.mediaItemId))
		.where(and(eq(userChecklists.userId, userId), eq(animeDetails.jikanMalId, String(malId))))
		.limit(1)

	return entry ?? null
}

export async function removeAnimeChecklistEntry(userId: string, mediaItemId: string) {
	await db
		.delete(userChecklists)
		.where(and(eq(userChecklists.userId, userId), eq(userChecklists.mediaItemId, mediaItemId)))
}

export async function saveAnimeChecklistEntry(
	userId: string,
	mediaItemId: string,
	status: ChecklistStatus
) {
	const [existingEntry] = await db
		.select({
			completedAt: userChecklists.completedAt,
			startedAt: userChecklists.startedAt,
		})
		.from(userChecklists)
		.where(and(eq(userChecklists.userId, userId), eq(userChecklists.mediaItemId, mediaItemId)))
		.limit(1)

	const nextDates = resolveChecklistDates(existingEntry ?? null, status)

	await db
		.insert(userChecklists)
		.values({
			completedAt: nextDates.completedAt,
			mediaItemId,
			startedAt: nextDates.startedAt,
			status,
			updatedAt: nextDates.updatedAt,
			userId,
		})
		.onConflictDoUpdate({
			set: {
				completedAt: nextDates.completedAt,
				startedAt: nextDates.startedAt,
				status,
				updatedAt: nextDates.updatedAt,
			},
			target: [userChecklists.userId, userChecklists.mediaItemId],
		})
}

export async function listTrackedAnime(userId: string) {
	const rows = await db
		.select({
			broadcastLabel: animeDetails.broadcastLabel,
			episodes: animeDetails.episodeCount,
			posterUrl: mediaItems.imageUrlPoster,
			score: animeDetails.sourceScore,
			secondaryTitle: mediaItems.originalTitle,
			season: animeDetails.season,
			slug: mediaItems.slug,
			status: userChecklists.status,
			title: mediaItems.title,
			updatedAt: userChecklists.updatedAt,
			year: animeDetails.year,
		})
		.from(userChecklists)
		.innerJoin(mediaItems, eq(mediaItems.id, userChecklists.mediaItemId))
		.leftJoin(animeDetails, eq(animeDetails.mediaItemId, mediaItems.id))
		.where(eq(userChecklists.userId, userId))
		.orderBy(desc(userChecklists.updatedAt), mediaItems.title)

	const sections = checklistStatuses.map((status) => ({
		count: 0,
		description: getChecklistStatusMeta(status).description,
		items: [] as TrackedAnime[],
		status,
		title: getChecklistStatusMeta(status).label,
	}))

	for (const row of rows) {
		const section = sections.find((entry) => entry.status === row.status)

		if (!section) {
			continue
		}

		section.count += 1
		section.items.push({
			broadcastLabel: row.broadcastLabel,
			episodes: row.episodes,
			posterUrl: row.posterUrl,
			score: toNullableNumber(row.score),
			secondaryTitle: row.secondaryTitle,
			season: row.season,
			slug: row.slug,
			status: row.status,
			statusLabel: getChecklistStatusMeta(row.status).label,
			title: row.title,
			updatedAt: row.updatedAt,
			year: row.year,
		})
	}

	return {
		sections,
		total: rows.length,
	}
}
