import {
	type RatingAxisGroup,
	animeRatingAxisBlueprints,
	getAnimeAxisBlueprint,
	summarizeAnimeRatingDraft,
} from '$lib/ratings'
import { clearAnimeRatingActivity, recordAnimeRatingActivity } from '$lib/server/activity'
import { ensureAnimeMediaItemId } from '$lib/server/checklists'
import { db } from '$lib/server/db'
import {
	animeDetails,
	mediaAggregateScores,
	ratingAxes,
	ratingRubrics,
	userChecklists,
	userRatingAxisScores,
	userRatings,
} from '@toasty/db/schema'
import { and, asc, desc, eq, inArray, isNotNull, sql } from 'drizzle-orm'

const ANIME_RUBRIC_NAME = 'Anime universal rubric'
const ANIME_RUBRIC_VERSION = 2

type RatingAxisRecord = {
	description: string | null
	emoji: string | null
	group: RatingAxisGroup
	id: string
	key: string
	label: string
	maxValue: number
	minValue: number
	sortOrder: number
	weight: string
}

export type AnimeUserRating = {
	isDraft: boolean
	overallScore: number | null
	reviewText: string | null
	scores: Record<string, number>
	tags: string[]
	updatedAt: Date
}

export type UserRatingSnapshot = {
	averageOverall: number | null
	strongestAxes: Array<{
		average: number
		key: string
		label: string
	}>
	topTags: string[]
	ratedCount: number
}

export type AnimeAggregateRatingRecord = {
	axisAverages: Record<string, number>
	mediaItemId: string
	overallAvg: number | null
	ratingCount: number
	recommendationStrength: number | null
}

export type AnimeCommunityRatingSummary = {
	averageOverall: number | null
	averageRecommendationStrength: number | null
	completedCount: number
	ratedCount: number
	strongestAxes: Array<{
		average: number
		key: string
		label: string
	}>
	topTags: string[]
	trackedCount: number
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

function readAxisAverages(value: unknown) {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return {} satisfies Record<string, number>
	}

	const entries = Object.entries(value)
		.map(([key, entry]) => [key, toNullableNumber(entry)] as const)
		.filter((entry): entry is readonly [string, number] => entry[1] !== null)

	return Object.fromEntries(entries)
}

async function getAnimeRubricRecord() {
	const [rubric] = await db
		.select({ id: ratingRubrics.id })
		.from(ratingRubrics)
		.where(
			and(
				eq(ratingRubrics.mediaType, 'anime'),
				eq(ratingRubrics.name, ANIME_RUBRIC_NAME),
				eq(ratingRubrics.version, ANIME_RUBRIC_VERSION)
			)
		)
		.limit(1)

	return rubric ?? null
}

async function recomputeAnimeAggregateRatingRecord(mediaItemId: string, rubricId: string) {
	const [[summaryRow], axisRows] = await Promise.all([
		db
			.select({
				averageOverall: sql<string | null>`avg(${userRatings.overallScore})`,
				ratingCount: sql<number>`count(*)`,
			})
			.from(userRatings)
			.where(
				and(
					eq(userRatings.mediaItemId, mediaItemId),
					eq(userRatings.rubricId, rubricId),
					isNotNull(userRatings.overallScore)
				)
			),
		db
			.select({
				average: sql<string>`avg(${userRatingAxisScores.score})`,
				key: ratingAxes.key,
			})
			.from(userRatingAxisScores)
			.innerJoin(ratingAxes, eq(ratingAxes.id, userRatingAxisScores.axisId))
			.innerJoin(userRatings, eq(userRatings.id, userRatingAxisScores.userRatingId))
			.where(
				and(
					eq(userRatings.mediaItemId, mediaItemId),
					eq(userRatings.rubricId, rubricId),
					isNotNull(userRatings.overallScore)
				)
			)
			.groupBy(ratingAxes.key),
	])

	const ratingCount = summaryRow?.ratingCount ?? 0

	await db
		.delete(mediaAggregateScores)
		.where(
			and(
				eq(mediaAggregateScores.mediaItemId, mediaItemId),
				eq(mediaAggregateScores.rubricId, rubricId),
				eq(mediaAggregateScores.scopeType, 'global')
			)
		)

	if (ratingCount === 0) {
		return null
	}

	const axisAverages = Object.fromEntries(
		axisRows
			.map((row) => [row.key, toNullableNumber(row.average)] as const)
			.filter((entry): entry is readonly [string, number] => entry[1] !== null)
	)
	const overallAvg = toNullableNumber(summaryRow?.averageOverall)

	await db.insert(mediaAggregateScores).values({
		axisAveragesJsonb: axisAverages,
		mediaItemId,
		overallAvg: overallAvg?.toFixed(2) ?? null,
		ratingCount,
		rubricId,
		scopeType: 'global',
		updatedAt: new Date(),
	})

	return {
		axisAverages,
		mediaItemId,
		overallAvg,
		ratingCount,
		recommendationStrength: axisAverages.recommendation_strength ?? null,
	} satisfies AnimeAggregateRatingRecord
}

async function listExistingAnimeAggregateRatings(mediaItemIds: string[], rubricId: string) {
	if (mediaItemIds.length === 0) {
		return [] satisfies AnimeAggregateRatingRecord[]
	}

	const rows = await db
		.select({
			axisAveragesJsonb: mediaAggregateScores.axisAveragesJsonb,
			mediaItemId: mediaAggregateScores.mediaItemId,
			overallAvg: mediaAggregateScores.overallAvg,
			ratingCount: mediaAggregateScores.ratingCount,
		})
		.from(mediaAggregateScores)
		.where(
			and(
				inArray(mediaAggregateScores.mediaItemId, mediaItemIds),
				eq(mediaAggregateScores.rubricId, rubricId),
				eq(mediaAggregateScores.scopeType, 'global')
			)
		)

	return rows.map((row) => {
		const axisAverages = readAxisAverages(row.axisAveragesJsonb)

		return {
			axisAverages,
			mediaItemId: row.mediaItemId,
			overallAvg: toNullableNumber(row.overallAvg),
			ratingCount: row.ratingCount,
			recommendationStrength: axisAverages.recommendation_strength ?? null,
		} satisfies AnimeAggregateRatingRecord
	})
}

export async function ensureAnimeRatingRubric() {
	const existingRubric = await getAnimeRubricRecord()

	if (existingRubric) {
		const axisRows = await db
			.select({ key: ratingAxes.key })
			.from(ratingAxes)
			.where(eq(ratingAxes.rubricId, existingRubric.id))

		const existingKeys = new Set(axisRows.map((axis) => axis.key))
		const hasAllAxes = animeRatingAxisBlueprints.every((axis) => existingKeys.has(axis.key))

		if (hasAllAxes) {
			return existingRubric.id
		}
	}

	return db.transaction(async (tx) => {
		const existing = await tx
			.select({ id: ratingRubrics.id })
			.from(ratingRubrics)
			.where(
				and(
					eq(ratingRubrics.mediaType, 'anime'),
					eq(ratingRubrics.name, ANIME_RUBRIC_NAME),
					eq(ratingRubrics.version, ANIME_RUBRIC_VERSION)
				)
			)
			.limit(1)

		if (existing[0]) {
			return existing[0].id
		}

		const [rubric] = await tx
			.insert(ratingRubrics)
			.values({
				isActive: true,
				mediaType: 'anime',
				name: ANIME_RUBRIC_NAME,
				version: ANIME_RUBRIC_VERSION,
			})
			.returning({ id: ratingRubrics.id })

		await tx.insert(ratingAxes).values(
			animeRatingAxisBlueprints.map((axis) => ({
				description: axis.description,
				emoji: axis.emoji,
				key: axis.key,
				label: axis.label,
				maxValue: axis.maxValue,
				minValue: axis.minValue,
				rubricId: rubric.id,
				sortOrder: axis.sortOrder,
				weight: axis.weight,
			}))
		)

		return rubric.id
	})
}

export async function getAnimeAggregateRatingMap(mediaItemIds: string[]) {
	if (mediaItemIds.length === 0) {
		return new Map<string, AnimeAggregateRatingRecord>()
	}

	const rubricId = await ensureAnimeRatingRubric()
	const existingRows = await listExistingAnimeAggregateRatings(mediaItemIds, rubricId)
	const aggregateMap = new Map(existingRows.map((row) => [row.mediaItemId, row]))
	const missingMediaItemIds = mediaItemIds.filter((mediaItemId) => !aggregateMap.has(mediaItemId))

	if (missingMediaItemIds.length === 0) {
		return aggregateMap
	}

	const rowsWithRatings = await db
		.select({ mediaItemId: userRatings.mediaItemId })
		.from(userRatings)
		.where(
			and(
				inArray(userRatings.mediaItemId, missingMediaItemIds),
				eq(userRatings.rubricId, rubricId),
				isNotNull(userRatings.overallScore)
			)
		)
		.groupBy(userRatings.mediaItemId)

	const recomputedRows = await Promise.all(
		rowsWithRatings.map((row) => recomputeAnimeAggregateRatingRecord(row.mediaItemId, rubricId))
	)

	for (const row of recomputedRows) {
		if (row) {
			aggregateMap.set(row.mediaItemId, row)
		}
	}

	return aggregateMap
}

export async function listAnimeRatingAxes(): Promise<RatingAxisRecord[]> {
	const rubricId = await ensureAnimeRatingRubric()
	const rows = await db
		.select({
			description: ratingAxes.description,
			emoji: ratingAxes.emoji,
			id: ratingAxes.id,
			key: ratingAxes.key,
			label: ratingAxes.label,
			maxValue: ratingAxes.maxValue,
			minValue: ratingAxes.minValue,
			sortOrder: ratingAxes.sortOrder,
			weight: ratingAxes.weight,
		})
		.from(ratingAxes)
		.where(eq(ratingAxes.rubricId, rubricId))
		.orderBy(asc(ratingAxes.sortOrder))

	return rows.map((axis) => ({
		...axis,
		group: getAnimeAxisBlueprint(axis.key)?.group ?? 'flavor',
	}))
}

async function getAnimeMediaItemId(malId: number) {
	const [row] = await db
		.select({ mediaItemId: animeDetails.mediaItemId })
		.from(animeDetails)
		.where(eq(animeDetails.jikanMalId, String(malId)))
		.limit(1)

	return row?.mediaItemId ?? null
}

export async function getAnimeUserRating(
	userId: string,
	malId: number
): Promise<AnimeUserRating | null> {
	const rubricId = await ensureAnimeRatingRubric()
	const mediaItemId = await getAnimeMediaItemId(malId)

	if (!mediaItemId) {
		return null
	}

	const [rating] = await db
		.select({
			id: userRatings.id,
			overallScore: userRatings.overallScore,
			reviewText: userRatings.reviewText,
			tagsJsonb: userRatings.tagsJsonb,
			updatedAt: userRatings.updatedAt,
		})
		.from(userRatings)
		.where(
			and(
				eq(userRatings.userId, userId),
				eq(userRatings.mediaItemId, mediaItemId),
				eq(userRatings.rubricId, rubricId)
			)
		)
		.orderBy(desc(userRatings.updatedAt))
		.limit(1)

	if (!rating) {
		return null
	}

	const axisRows = await db
		.select({ key: ratingAxes.key, score: userRatingAxisScores.score })
		.from(userRatingAxisScores)
		.innerJoin(ratingAxes, eq(ratingAxes.id, userRatingAxisScores.axisId))
		.where(eq(userRatingAxisScores.userRatingId, rating.id))

	return {
		isDraft: rating.overallScore === null,
		overallScore: toNullableNumber(rating.overallScore),
		reviewText: rating.reviewText,
		scores: Object.fromEntries(
			axisRows
				.map((axis) => [axis.key, toNullableNumber(axis.score)])
				.filter((entry): entry is [string, number] => typeof entry[1] === 'number')
		),
		tags: Array.isArray(rating.tagsJsonb)
			? rating.tagsJsonb.filter((tag): tag is string => typeof tag === 'string')
			: [],
		updatedAt: rating.updatedAt,
	}
}

export async function saveAnimeUserRating(
	userId: string,
	malId: number,
	scores: Record<string, number>,
	reviewText: string | null,
	fetcher: typeof fetch
) {
	const rubricId = await ensureAnimeRatingRubric()
	const mediaItemId = await ensureAnimeMediaItemId(malId, fetcher)
	const axes = await listAnimeRatingAxes()
	const axisIdMap = new Map(axes.map((axis) => [axis.key, axis.id]))
	const draftSummary = summarizeAnimeRatingDraft(scores)
	const overallScore = draftSummary.overallScore
	const tags = draftSummary.tags

	const existingRatings = await db
		.select({ id: userRatings.id })
		.from(userRatings)
		.where(
			and(
				eq(userRatings.userId, userId),
				eq(userRatings.mediaItemId, mediaItemId),
				eq(userRatings.rubricId, rubricId)
			)
		)

	await db.transaction(async (tx) => {
		const existingIds = existingRatings.map((rating) => rating.id)

		if (existingIds.length > 0) {
			await tx
				.delete(userRatingAxisScores)
				.where(inArray(userRatingAxisScores.userRatingId, existingIds))
			await tx.delete(userRatings).where(inArray(userRatings.id, existingIds))
		}

		const [createdRating] = await tx
			.insert(userRatings)
			.values({
				mediaItemId,
				overallScore: overallScore?.toFixed(2) ?? null,
				reviewText,
				rubricId,
				tagsJsonb: tags,
				userId,
			})
			.returning({ id: userRatings.id })

		const axisValues = Object.entries(scores).flatMap(([key, score]) => {
			const axisId = axisIdMap.get(key)

			if (typeof score !== 'number' || !axisId) {
				return []
			}

			return [
				{
					axisId,
					score: score.toFixed(2),
					userRatingId: createdRating.id,
				},
			]
		})

		if (axisValues.length > 0) {
			await tx.insert(userRatingAxisScores).values(axisValues)
		}
	})

	if (draftSummary.isComplete) {
		await recordAnimeRatingActivity({
			mediaItemId,
			overallScore,
			tags,
			userId,
		})
	} else {
		await clearAnimeRatingActivity({ mediaItemId, userId })
	}

	await recomputeAnimeAggregateRatingRecord(mediaItemId, rubricId)

	return draftSummary
}

export async function getAnimeCommunityRatingSummary(
	malId: number
): Promise<AnimeCommunityRatingSummary | null> {
	const mediaItemId = await getAnimeMediaItemId(malId)

	if (!mediaItemId) {
		return null
	}

	const [aggregateMap, checklistRows, storedRatings] = await Promise.all([
		getAnimeAggregateRatingMap([mediaItemId]),
		db
			.select({ status: userChecklists.status })
			.from(userChecklists)
			.where(eq(userChecklists.mediaItemId, mediaItemId)),
		db
			.select({ tagsJsonb: userRatings.tagsJsonb })
			.from(userRatings)
			.where(and(eq(userRatings.mediaItemId, mediaItemId), isNotNull(userRatings.overallScore))),
	])

	const aggregate = aggregateMap.get(mediaItemId)
	const tagCounts = new Map<string, number>()

	for (const row of storedRatings) {
		const tags = Array.isArray(row.tagsJsonb)
			? row.tagsJsonb.filter((tag): tag is string => typeof tag === 'string' && tag.length > 0)
			: []

		for (const tag of tags) {
			tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
		}
	}

	const strongestAxes = Object.entries(aggregate?.axisAverages ?? {})
		.map(([key, average]) => {
			const axis = getAnimeAxisBlueprint(key)

			if (!axis || axis.group !== 'core') {
				return null
			}

			return {
				average,
				key,
				label: axis.label,
			}
		})
		.filter(
			(
				axis
			): axis is {
				average: number
				key: string
				label: string
			} => axis !== null
		)
		.sort((left, right) => right.average - left.average)
		.slice(0, 3)

	return {
		averageOverall: aggregate?.overallAvg ?? null,
		averageRecommendationStrength: aggregate?.recommendationStrength ?? null,
		completedCount: checklistRows.filter((row) => row.status === 'done').length,
		ratedCount: aggregate?.ratingCount ?? 0,
		strongestAxes,
		topTags: [...tagCounts.entries()]
			.sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
			.slice(0, 3)
			.map(([tag]) => tag),
		trackedCount: checklistRows.length,
	}
}

export async function getUserRatingSnapshot(userId: string): Promise<UserRatingSnapshot> {
	const [[summaryRow], storedRatings, axisRows] = await Promise.all([
		db
			.select({
				averageOverall: sql<string | null>`avg(${userRatings.overallScore})`,
				ratedCount: sql<number>`count(*)`,
			})
			.from(userRatings)
			.where(and(eq(userRatings.userId, userId), isNotNull(userRatings.overallScore))),
		db
			.select({ tagsJsonb: userRatings.tagsJsonb })
			.from(userRatings)
			.where(and(eq(userRatings.userId, userId), isNotNull(userRatings.overallScore))),
		db
			.select({
				average: sql<string>`avg(${userRatingAxisScores.score})`,
				key: ratingAxes.key,
			})
			.from(userRatingAxisScores)
			.innerJoin(ratingAxes, eq(ratingAxes.id, userRatingAxisScores.axisId))
			.innerJoin(userRatings, eq(userRatings.id, userRatingAxisScores.userRatingId))
			.where(and(eq(userRatings.userId, userId), isNotNull(userRatings.overallScore)))
			.groupBy(ratingAxes.key),
	])

	const tagCounts = new Map<string, number>()

	for (const row of storedRatings) {
		const tags = Array.isArray(row.tagsJsonb)
			? row.tagsJsonb.filter((tag): tag is string => typeof tag === 'string' && tag.length > 0)
			: []

		for (const tag of tags) {
			tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
		}
	}

	const strongestAxes = axisRows
		.map((row) => {
			const average = toNullableNumber(row.average)
			const axis = getAnimeAxisBlueprint(row.key)

			if (average === null || !axis) {
				return null
			}

			return {
				average,
				key: row.key,
				label: axis.label,
			}
		})
		.filter(
			(
				axis
			): axis is {
				average: number
				key: string
				label: string
			} => axis !== null
		)
		.sort((left, right) => right.average - left.average)
		.slice(0, 3)

	return {
		averageOverall: toNullableNumber(summaryRow?.averageOverall),
		strongestAxes,
		topTags: [...tagCounts.entries()]
			.sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
			.slice(0, 3)
			.map(([tag]) => tag),
		ratedCount: summaryRow?.ratedCount ?? 0,
	}
}
