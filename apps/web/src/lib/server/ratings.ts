import {
	type RatingAxisGroup,
	animeRatingAxisBlueprints,
	computeOverallRating,
	extractDominantFlavorTags,
	getAnimeAxisBlueprint,
} from '$lib/ratings'
import { ensureAnimeMediaItemId } from '$lib/server/checklists'
import { db } from '$lib/server/db'
import {
	animeDetails,
	ratingAxes,
	ratingRubrics,
	userRatingAxisScores,
	userRatings,
} from '@toasty/db/schema'
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm'

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
	overallScore: number | null
	reviewText: string | null
	scores: Record<string, number>
	tags: string[]
	updatedAt: Date
}

export type UserRatingSnapshot = {
	averageOverall: number | null
	ratedCount: number
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
	const overallScore = computeOverallRating(scores)
	const tags = extractDominantFlavorTags(scores)

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

	return overallScore
}

export async function getUserRatingSnapshot(userId: string): Promise<UserRatingSnapshot> {
	const [row] = await db
		.select({
			averageOverall: sql<string | null>`avg(${userRatings.overallScore})`,
			ratedCount: sql<number>`count(*)`,
		})
		.from(userRatings)
		.where(eq(userRatings.userId, userId))

	return {
		averageOverall: toNullableNumber(row?.averageOverall),
		ratedCount: row?.ratedCount ?? 0,
	}
}
