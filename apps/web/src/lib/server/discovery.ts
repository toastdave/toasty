import { getAnimeAggregateRatingMap } from '$lib/server/ratings'
import type { AnimeCard } from '$lib/server/services/jikan/adapters'
import { animeDetails, mediaItems, userChecklists } from '@toasty/db/schema'
import { eq, inArray } from 'drizzle-orm'
import { db } from './db'

export type DiscoveryShelfItem = AnimeCard & {
	caption: string
	communityScore: number | null
	completedCount: number
	ratingCount: number
	trackedCount: number
}

export type DiscoveryShelf = {
	description: string
	heading: string
	href: string
	items: DiscoveryShelfItem[]
	label: string
}

type StoredAnimeSignal = {
	card: AnimeCard
	completedCount: number
	communityScore: number | null
	mediaItemId: string | null
	ratingCount: number
	recommendationStrength: number | null
	trackedCount: number
}

function buildSignalCaption(item: StoredAnimeSignal, mode: 'community' | 'momentum') {
	if (mode === 'community') {
		if (item.communityScore !== null && item.ratingCount > 0) {
			return `Community ${item.communityScore} from ${item.ratingCount} rating${item.ratingCount === 1 ? '' : 's'}`
		}

		return item.card.score !== null ? `Source ${item.card.score}` : 'Fresh off the chart'
	}

	const momentumParts = [] as string[]

	if (item.trackedCount > 0) {
		momentumParts.push(`${item.trackedCount} tracked`)
	}

	if (item.completedCount > 0) {
		momentumParts.push(`${item.completedCount} finished`)
	}

	if (item.recommendationStrength !== null) {
		momentumParts.push(`rec ${item.recommendationStrength}`)
	}

	return momentumParts.join(' • ') || (item.card.broadcastLabel ?? 'Season momentum building')
}

function dedupeBySlug(items: StoredAnimeSignal[]) {
	return items.filter(
		(item, index, allItems) =>
			allItems.findIndex((candidate) => candidate.card.slug === item.card.slug) === index
	)
}

async function mapAnimeSignals(cards: AnimeCard[]) {
	if (cards.length === 0) {
		return [] satisfies StoredAnimeSignal[]
	}

	const ids = cards.map((card) => card.id)
	const rows = await db
		.select({ mediaItemId: animeDetails.mediaItemId, malId: animeDetails.jikanMalId })
		.from(animeDetails)
		.innerJoin(mediaItems, eq(mediaItems.id, animeDetails.mediaItemId))
		.where(inArray(animeDetails.jikanMalId, ids.map(String)))

	const mediaItemIdByMalId = new Map(rows.map((row) => [Number(row.malId), row.mediaItemId]))
	const mediaItemIds = [...new Set(rows.map((row) => row.mediaItemId))]
	const [aggregateMap, checklistRows] = await Promise.all([
		getAnimeAggregateRatingMap(mediaItemIds),
		mediaItemIds.length > 0
			? db
					.select({ mediaItemId: userChecklists.mediaItemId, status: userChecklists.status })
					.from(userChecklists)
					.where(inArray(userChecklists.mediaItemId, mediaItemIds))
			: [],
	])

	const trackedCountMap = new Map<string, number>()
	const completedCountMap = new Map<string, number>()

	for (const row of checklistRows) {
		trackedCountMap.set(row.mediaItemId, (trackedCountMap.get(row.mediaItemId) ?? 0) + 1)

		if (row.status === 'done') {
			completedCountMap.set(row.mediaItemId, (completedCountMap.get(row.mediaItemId) ?? 0) + 1)
		}
	}

	return cards.map((card) => {
		const mediaItemId = mediaItemIdByMalId.get(card.id) ?? null
		const aggregate = mediaItemId ? aggregateMap.get(mediaItemId) : null

		return {
			card,
			completedCount: mediaItemId ? (completedCountMap.get(mediaItemId) ?? 0) : 0,
			communityScore: aggregate?.overallAvg ?? null,
			mediaItemId,
			ratingCount: aggregate?.ratingCount ?? 0,
			recommendationStrength: aggregate?.recommendationStrength ?? null,
			trackedCount: mediaItemId ? (trackedCountMap.get(mediaItemId) ?? 0) : 0,
		}
	})
}

export async function getDiscoveryShelves(params: {
	currentSeason: AnimeCard[]
	topAnime: AnimeCard[]
}) {
	const allSignals = dedupeBySlug(
		await mapAnimeSignals([...params.currentSeason, ...params.topAnime])
	)
	const seasonalSignals = allSignals.filter((item) =>
		params.currentSeason.some((candidate) => candidate.slug === item.card.slug)
	)

	const communityLeaders = [...allSignals]
		.sort(
			(left, right) =>
				(right.communityScore ?? right.card.score ?? 0) -
					(left.communityScore ?? left.card.score ?? 0) ||
				right.ratingCount - left.ratingCount ||
				right.trackedCount - left.trackedCount
		)
		.slice(0, 4)
		.map((item) => ({
			...item.card,
			caption: buildSignalCaption(item, 'community'),
			communityScore: item.communityScore,
			completedCount: item.completedCount,
			ratingCount: item.ratingCount,
			trackedCount: item.trackedCount,
		}))

	const momentumPicks = [...seasonalSignals]
		.sort(
			(left, right) =>
				right.trackedCount * 1.2 +
					right.completedCount * 1.8 +
					(right.recommendationStrength ?? 0) -
					(left.trackedCount * 1.2 +
						left.completedCount * 1.8 +
						(left.recommendationStrength ?? 0)) ||
				(right.card.percentComplete ?? 0) - (left.card.percentComplete ?? 0) ||
				(right.card.score ?? 0) - (left.card.score ?? 0)
		)
		.slice(0, 4)
		.map((item) => ({
			...item.card,
			caption: buildSignalCaption(item, 'momentum'),
			communityScore: item.communityScore,
			completedCount: item.completedCount,
			ratingCount: item.ratingCount,
			trackedCount: item.trackedCount,
		}))

	return [
		{
			description:
				'The strongest blend of source reputation, community scores, and real Toasty tracking volume right now.',
			heading: 'Community co-signs',
			href: '/anime/top',
			items: communityLeaders,
			label: 'Crowd read',
		},
		{
			description:
				'Seasonal titles picking up the fastest mix of tracking, finishes, and recommendation energy.',
			heading: 'Season momentum',
			href: '/anime/schedule',
			items: momentumPicks,
			label: 'Momentum board',
		},
	].filter((shelf) => shelf.items.length > 0) satisfies DiscoveryShelf[]
}
