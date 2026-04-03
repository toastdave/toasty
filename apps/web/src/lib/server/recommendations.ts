import {
	buildAnimeRecommendationReason,
	findAnimeRecommendationTasteMatches,
	scoreAnimeRecommendationCandidate,
} from '$lib/recommendations'
import { db } from '$lib/server/db'
import { getAnimeAggregateRatingMap } from '$lib/server/ratings'
import type { AnimeCard } from '$lib/server/services/jikan/adapters'
import {
	animeDetails,
	genres,
	mediaItemGenres,
	mediaItems,
	userChecklists,
	userRatings,
} from '@toasty/db/schema'
import { and, desc, eq, inArray, isNotNull } from 'drizzle-orm'

type StoredAnimeRow = {
	airedFrom: Date | null
	airedTo: Date | null
	broadcastDay: string | null
	broadcastLabel: string | null
	episodes: number | null
	largePosterUrl: string | null
	malId: string | null
	mediaItemId: string
	posterUrl: string | null
	score: string | number | null
	season: string | null
	secondaryTitle: string | null
	slug: string
	sourceUrl: string | null
	status: string | null
	synopsis: string | null
	title: string
	type: string | null
	year: number | null
}

export type AnimeRecommendationCard = AnimeCard & {
	matchReason: string
}

export type AnimeRecommendationShelf = {
	description: string
	heading: string
	items: AnimeRecommendationCard[]
	sourceTitle: string | null
}

type RecommendationReference = {
	completedCount: number
	genreNames: string[]
	mediaItemId: string
	overallScore: number | null
	recommendationStrength: number | null
	season: string | null
	tasteTags: string[]
	title: string
	type: 'detail' | 'rated' | 'tracked'
	year: number | null
}

function computePercentCompleteFromDateRange(from: Date | null, to: Date | null) {
	if (!from || !to || Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
		return null
	}

	const duration = to.getTime() - from.getTime()

	if (duration <= 0) {
		return null
	}

	const now = Date.now()

	if (now <= from.getTime()) {
		return 0
	}

	if (now >= to.getTime()) {
		return 100
	}

	return Math.round(((now - from.getTime()) / duration) * 100)
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

function toStringArray(value: unknown) {
	if (!Array.isArray(value)) {
		return []
	}

	return value.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0)
}

function isStrongPositiveReference(reference: RecommendationReference) {
	return (reference.overallScore ?? 0) >= 7 || (reference.recommendationStrength ?? 0) >= 7
}

async function getGenreMap(mediaItemIds: string[]) {
	if (mediaItemIds.length === 0) {
		return new Map<string, string[]>()
	}

	const rows = await db
		.select({ genreName: genres.name, mediaItemId: mediaItemGenres.mediaItemId })
		.from(mediaItemGenres)
		.innerJoin(genres, eq(genres.id, mediaItemGenres.genreId))
		.where(inArray(mediaItemGenres.mediaItemId, mediaItemIds))

	const genreMap = new Map<string, string[]>()

	for (const row of rows) {
		const existingGenres = genreMap.get(row.mediaItemId) ?? []
		existingGenres.push(row.genreName)
		genreMap.set(row.mediaItemId, existingGenres)
	}

	return genreMap
}

function toAnimeCard(row: StoredAnimeRow, genreMap: Map<string, string[]>): AnimeCard {
	return {
		broadcastDay: row.broadcastDay,
		broadcastLabel: row.broadcastLabel,
		episodes: row.episodes,
		genres: genreMap.get(row.mediaItemId) ?? [],
		id: Number.parseInt(row.malId ?? '0', 10),
		largePosterUrl: row.largePosterUrl,
		percentComplete: computePercentCompleteFromDateRange(row.airedFrom, row.airedTo),
		posterUrl: row.posterUrl,
		rank: null,
		score: toNullableNumber(row.score),
		season: row.season,
		secondaryTitle: row.secondaryTitle,
		slug: row.slug,
		sourceUrl: row.sourceUrl,
		status: row.status,
		synopsis: row.synopsis,
		title: row.title,
		type: row.type,
		year: row.year,
	}
}

async function listStoredAnimeRows(mediaItemIds: string[]) {
	if (mediaItemIds.length === 0) {
		return [] satisfies StoredAnimeRow[]
	}

	return db
		.select({
			airedFrom: animeDetails.airedFrom,
			airedTo: animeDetails.airedTo,
			broadcastDay: animeDetails.broadcastDay,
			broadcastLabel: animeDetails.broadcastLabel,
			episodes: animeDetails.episodeCount,
			largePosterUrl: mediaItems.imageUrlBackdrop,
			malId: animeDetails.jikanMalId,
			mediaItemId: mediaItems.id,
			posterUrl: mediaItems.imageUrlPoster,
			score: animeDetails.sourceScore,
			season: animeDetails.season,
			secondaryTitle: mediaItems.originalTitle,
			slug: mediaItems.slug,
			sourceUrl: mediaItems.canonicalUrl,
			status: animeDetails.airingStatus,
			synopsis: mediaItems.description,
			title: mediaItems.title,
			type: animeDetails.format,
			year: animeDetails.year,
		})
		.from(mediaItems)
		.innerJoin(animeDetails, eq(animeDetails.mediaItemId, mediaItems.id))
		.where(inArray(mediaItems.id, mediaItemIds))
}

async function getCandidateOverlapCounts(
	referenceGenreNames: string[],
	excludedMediaItemIds: string[]
) {
	if (referenceGenreNames.length === 0) {
		return new Map<string, number>()
	}

	const genreRows = await db
		.select({ mediaItemId: mediaItemGenres.mediaItemId, genreName: genres.name })
		.from(mediaItemGenres)
		.innerJoin(genres, eq(genres.id, mediaItemGenres.genreId))
		.where(inArray(genres.name, referenceGenreNames))

	const excludedIds = new Set(excludedMediaItemIds)
	const overlapCounts = new Map<string, number>()

	for (const row of genreRows) {
		if (excludedIds.has(row.mediaItemId)) {
			continue
		}

		overlapCounts.set(row.mediaItemId, (overlapCounts.get(row.mediaItemId) ?? 0) + 1)
	}

	return overlapCounts
}

async function getChecklistCompletionMap(mediaItemIds: string[]) {
	if (mediaItemIds.length === 0) {
		return new Map<string, number>()
	}

	const rows = await db
		.select({ mediaItemId: userChecklists.mediaItemId, status: userChecklists.status })
		.from(userChecklists)
		.where(inArray(userChecklists.mediaItemId, mediaItemIds))

	const completionMap = new Map<string, number>()

	for (const row of rows) {
		if (row.status !== 'done') {
			continue
		}

		completionMap.set(row.mediaItemId, (completionMap.get(row.mediaItemId) ?? 0) + 1)
	}

	return completionMap
}

async function getAnimeReferenceByMalId(malId: number): Promise<RecommendationReference | null> {
	const [row] = await db
		.select({
			mediaItemId: animeDetails.mediaItemId,
			season: animeDetails.season,
			title: mediaItems.title,
			year: animeDetails.year,
		})
		.from(animeDetails)
		.innerJoin(mediaItems, eq(mediaItems.id, animeDetails.mediaItemId))
		.where(eq(animeDetails.jikanMalId, String(malId)))
		.limit(1)

	if (!row) {
		return null
	}

	const genreMap = await getGenreMap([row.mediaItemId])

	return {
		completedCount: 0,
		genreNames: genreMap.get(row.mediaItemId) ?? [],
		mediaItemId: row.mediaItemId,
		overallScore: null,
		recommendationStrength: null,
		season: row.season,
		tasteTags: [],
		title: row.title,
		type: 'detail',
		year: row.year,
	}
}

async function getRatedAnimeReference(
	userId: string,
	mediaItemId?: string
): Promise<RecommendationReference | null> {
	const rows = await db
		.select({
			mediaItemId: userRatings.mediaItemId,
			overallScore: userRatings.overallScore,
			season: animeDetails.season,
			tagsJsonb: userRatings.tagsJsonb,
			title: mediaItems.title,
			year: animeDetails.year,
		})
		.from(userRatings)
		.innerJoin(mediaItems, eq(mediaItems.id, userRatings.mediaItemId))
		.innerJoin(animeDetails, eq(animeDetails.mediaItemId, mediaItems.id))
		.where(
			mediaItemId
				? and(
						eq(userRatings.userId, userId),
						eq(userRatings.mediaItemId, mediaItemId),
						isNotNull(userRatings.overallScore)
					)
				: and(eq(userRatings.userId, userId), isNotNull(userRatings.overallScore))
		)
		.orderBy(desc(userRatings.overallScore), desc(userRatings.updatedAt))
		.limit(mediaItemId ? 1 : 6)
	const mediaItemIds = rows.map((row) => row.mediaItemId)
	const [aggregateMap, completionMap, genreMap] = await Promise.all([
		getAnimeAggregateRatingMap(mediaItemIds),
		getChecklistCompletionMap(mediaItemIds),
		getGenreMap(mediaItemIds),
	])

	for (const row of rows) {
		const aggregate = aggregateMap.get(row.mediaItemId)
		const reference = {
			completedCount: completionMap.get(row.mediaItemId) ?? 0,
			genreNames: genreMap.get(row.mediaItemId) ?? [],
			mediaItemId: row.mediaItemId,
			overallScore: toNullableNumber(row.overallScore),
			recommendationStrength: aggregate?.recommendationStrength ?? null,
			season: row.season,
			tasteTags: toStringArray(row.tagsJsonb),
			title: row.title,
			type: 'rated' as const,
			year: row.year,
		}

		if (reference && isStrongPositiveReference(reference)) {
			return reference
		}
	}

	return null
}

async function getLatestTrackedAnimeReference(
	userId: string
): Promise<RecommendationReference | null> {
	const [row] = await db
		.select({
			mediaItemId: userChecklists.mediaItemId,
			season: animeDetails.season,
			title: mediaItems.title,
			year: animeDetails.year,
		})
		.from(userChecklists)
		.innerJoin(mediaItems, eq(mediaItems.id, userChecklists.mediaItemId))
		.innerJoin(animeDetails, eq(animeDetails.mediaItemId, mediaItems.id))
		.where(eq(userChecklists.userId, userId))
		.orderBy(desc(userChecklists.updatedAt))
		.limit(1)

	if (!row) {
		return null
	}

	const genreMap = await getGenreMap([row.mediaItemId])

	return {
		completedCount: 0,
		genreNames: genreMap.get(row.mediaItemId) ?? [],
		mediaItemId: row.mediaItemId,
		overallScore: null,
		recommendationStrength: null,
		season: row.season,
		tasteTags: [],
		title: row.title,
		type: 'tracked',
		year: row.year,
	}
}

async function listTrackedAnimeIds(userId: string) {
	const rows = await db
		.select({ mediaItemId: userChecklists.mediaItemId })
		.from(userChecklists)
		.where(eq(userChecklists.userId, userId))

	return rows.map((row) => row.mediaItemId)
}

async function buildAnimeRecommendations(
	reference: RecommendationReference,
	excludedMediaItemIds: string[],
	limit = 4
) {
	const overlapCounts = await getCandidateOverlapCounts(reference.genreNames, excludedMediaItemIds)
	const candidateIds = [...overlapCounts.keys()]

	if (candidateIds.length === 0) {
		return [] satisfies AnimeRecommendationCard[]
	}

	const [aggregateMap, candidateRows, completionMap, genreMap] = await Promise.all([
		getAnimeAggregateRatingMap(candidateIds),
		listStoredAnimeRows(candidateIds),
		getChecklistCompletionMap(candidateIds),
		getGenreMap(candidateIds),
	])

	const referenceGenreSet = new Set(reference.genreNames)

	return candidateRows
		.map((row) => {
			const card = toAnimeCard(row, genreMap)
			const aggregate = aggregateMap.get(row.mediaItemId)
			const overlapGenres = card.genres.filter((genre) => referenceGenreSet.has(genre))
			const matchedTasteTags = findAnimeRecommendationTasteMatches(reference.tasteTags, card.genres)
			const candidateScore = scoreAnimeRecommendationCandidate({
				candidateCommunityRatingCount: aggregate?.ratingCount ?? 0,
				candidateCommunityScore: aggregate?.overallAvg ?? null,
				candidateCompletionCount: completionMap.get(row.mediaItemId) ?? 0,
				candidateScore: card.score,
				candidateSeason: card.season,
				candidateYear: card.year,
				matchedTasteCount: matchedTasteTags.length,
				referenceRecommendationStrength: reference.recommendationStrength,
				referenceSeason: reference.season,
				referenceYear: reference.year,
				sharedGenreCount: overlapCounts.get(row.mediaItemId) ?? 0,
			})

			return {
				...card,
				matchReason: buildAnimeRecommendationReason({
					matchedTasteTags,
					sharedGenres: overlapGenres,
				}),
				recommendationScore: candidateScore,
			}
		})
		.sort((left, right) => right.recommendationScore - left.recommendationScore)
		.slice(0, limit)
		.map(({ recommendationScore: _recommendationScore, ...card }) => card)
}

export async function getAnimeDetailRecommendationShelf(
	malId: number,
	userId?: string
): Promise<AnimeRecommendationShelf | null> {
	const reference = await getAnimeReferenceByMalId(malId)

	if (!reference || reference.genreNames.length === 0) {
		return null
	}

	const personalizedReference = userId
		? ((await getRatedAnimeReference(userId, reference.mediaItemId)) ?? reference)
		: reference

	const items = await buildAnimeRecommendations(personalizedReference, [reference.mediaItemId])

	if (items.length === 0) {
		return null
	}

	const personalizedTags = personalizedReference.tasteTags.slice(0, 2)
	const personalizedDescription =
		personalizedReference.type === 'rated'
			? personalizedTags.length > 0
				? `You rated ${reference.title} highly with a ${personalizedTags.join(' + ')} taste profile. Shared genre and flavor signals point to these next.`
				: `You rated ${reference.title} highly, so these picks lean on the closest shared genres and overall fit.`
			: `Shared genre overlap with ${reference.title} makes these the strongest next stops.`

	return {
		description: personalizedDescription,
		heading:
			personalizedReference.type === 'rated'
				? `If ${reference.title} hit, stay in this lane`
				: 'If this one lands, try these next',
		items,
		sourceTitle: reference.title,
	}
}

export async function getHomeTrackedAnimeRecommendationShelf(
	userId: string
): Promise<AnimeRecommendationShelf | null> {
	const [ratedReference, trackedReference, trackedAnimeIds] = await Promise.all([
		getRatedAnimeReference(userId),
		getLatestTrackedAnimeReference(userId),
		listTrackedAnimeIds(userId),
	])
	const reference = ratedReference ?? trackedReference

	if (!reference || reference.genreNames.length === 0) {
		return null
	}

	const items = await buildAnimeRecommendations(reference, trackedAnimeIds, 6)

	if (items.length === 0) {
		return null
	}

	return {
		description:
			reference.type === 'rated'
				? reference.tasteTags.length > 0
					? `You scored ${reference.title} highly, and your ${reference.tasteTags.slice(0, 2).join(' + ')} lanes help shape these next picks.`
					: `You scored ${reference.title} highly, so these recommendations stay close to the same genre lane.`
				: `A few strong next picks based on the lane you opened with ${reference.title}.`,
		heading:
			reference.type === 'rated'
				? `Because you rated ${reference.title} highly`
				: `Because you tracked ${reference.title}`,
		items,
		sourceTitle: reference.title,
	}
}
