import { db } from '$lib/server/db'
import {
	assignTournamentRegion,
	scoreAnimeTournamentSeed,
	tournamentRegions,
} from '$lib/tournaments'
import { animeDetails, mediaItems, mediaYearlyRankings, userChecklists } from '@toasty/db/schema'
import { and, asc, desc, eq, isNotNull, sql } from 'drizzle-orm'

type SeedCandidateRow = {
	engagementCount: number
	mediaItemId: string
	posterUrl: string | null
	slug: string
	sourcePopularityRank: number | null
	sourceScore: string | number | null
	title: string
	year: number
}

export type AnimeTournamentSeed = {
	engagementCount: number
	finalSeedScore: number
	popularityRank: number | null
	posterUrl: string | null
	region: (typeof tournamentRegions)[number]
	ratingScore: number | null
	seed: number
	slug: string
	title: string
	year: number
}

export type AnimeTournamentSeedingPreview = {
	entryCount: number
	generatedAt: Date
	headerLabel: string
	isFrozenSnapshot: boolean
	methodology: string[]
	regions: Array<{
		label: (typeof tournamentRegions)[number]
		seedCount: number
	}>
	seeds: AnimeTournamentSeed[]
	year: number
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

async function getAnimeCandidateYear(preferredYear?: number) {
	if (preferredYear) {
		const [matchingYear] = await db
			.select({ count: sql<number>`count(*)`, year: animeDetails.year })
			.from(animeDetails)
			.where(eq(animeDetails.year, preferredYear))
			.groupBy(animeDetails.year)
			.limit(1)

		if (matchingYear?.year) {
			return matchingYear.year
		}
	}

	const yearRows = await db
		.select({ count: sql<number>`count(*)`, year: animeDetails.year })
		.from(animeDetails)
		.where(isNotNull(animeDetails.year))
		.groupBy(animeDetails.year)
		.orderBy(desc(animeDetails.year))

	const latestDenseYear = yearRows.find((row) => row.year !== null && row.count >= 8)

	if (latestDenseYear?.year) {
		return latestDenseYear.year
	}

	return yearRows[0]?.year ?? null
}

async function listAnimeSeedCandidates(year: number): Promise<SeedCandidateRow[]> {
	const rows = await db
		.select({
			engagementCount: sql<number>`count(${userChecklists.userId})`,
			mediaItemId: mediaItems.id,
			posterUrl: mediaItems.imageUrlPoster,
			slug: mediaItems.slug,
			sourcePopularityRank: animeDetails.sourcePopularity,
			sourceScore: animeDetails.sourceScore,
			title: mediaItems.title,
			year: animeDetails.year,
		})
		.from(animeDetails)
		.innerJoin(mediaItems, eq(mediaItems.id, animeDetails.mediaItemId))
		.leftJoin(userChecklists, eq(userChecklists.mediaItemId, mediaItems.id))
		.where(eq(animeDetails.year, year))
		.groupBy(
			mediaItems.id,
			mediaItems.imageUrlPoster,
			mediaItems.slug,
			mediaItems.title,
			animeDetails.sourcePopularity,
			animeDetails.sourceScore,
			animeDetails.year
		)

	return rows
		.map((row) => ({
			engagementCount: row.engagementCount,
			mediaItemId: row.mediaItemId,
			posterUrl: row.posterUrl,
			slug: row.slug,
			sourcePopularityRank: row.sourcePopularityRank,
			sourceScore: row.sourceScore,
			title: row.title,
			year: row.year ?? year,
		}))
		.filter((row) => Boolean(row.slug))
}

async function listStoredAnimeSeeds(year: number): Promise<AnimeTournamentSeed[]> {
	const rows = await db
		.select({
			compositeScore: mediaYearlyRankings.compositeScore,
			createdAt: mediaYearlyRankings.createdAt,
			engagementRank: mediaYearlyRankings.engagementRank,
			finalSeedScore: mediaYearlyRankings.finalSeedScore,
			popularityRank: mediaYearlyRankings.popularityRank,
			posterUrl: mediaItems.imageUrlPoster,
			slug: mediaItems.slug,
			title: mediaItems.title,
			year: mediaYearlyRankings.year,
		})
		.from(mediaYearlyRankings)
		.innerJoin(mediaItems, eq(mediaItems.id, mediaYearlyRankings.mediaItemId))
		.where(and(eq(mediaYearlyRankings.year, year), eq(mediaYearlyRankings.mediaType, 'anime')))
		.orderBy(desc(mediaYearlyRankings.finalSeedScore), asc(mediaItems.title))

	return rows.slice(0, 16).map((row, index) => ({
		engagementCount: row.engagementRank ?? 0,
		finalSeedScore: toNullableNumber(row.finalSeedScore) ?? 0,
		popularityRank: row.popularityRank,
		posterUrl: row.posterUrl,
		region: assignTournamentRegion(index),
		ratingScore: toNullableNumber(row.compositeScore),
		seed: index + 1,
		slug: row.slug,
		title: row.title,
		year: row.year,
	}))
}

async function getStoredAnimeSnapshotCreatedAt(year: number) {
	const [row] = await db
		.select({ createdAt: mediaYearlyRankings.createdAt })
		.from(mediaYearlyRankings)
		.where(and(eq(mediaYearlyRankings.year, year), eq(mediaYearlyRankings.mediaType, 'anime')))
		.orderBy(asc(mediaYearlyRankings.createdAt))
		.limit(1)

	return row?.createdAt ?? null
}

async function createAnimeTournamentSeedingSnapshot(year: number) {
	const candidates = await listAnimeSeedCandidates(year)

	if (candidates.length === 0) {
		return null
	}

	const popularityRanks = candidates
		.map((candidate) => candidate.sourcePopularityRank)
		.filter((rank): rank is number => typeof rank === 'number' && rank > 0)
	const maxPopularityRank = Math.max(...popularityRanks, 1)
	const maxEngagementCount = Math.max(
		...candidates.map((candidate) => candidate.engagementCount),
		0
	)
	const now = new Date()

	const rankedCandidates = candidates
		.map((candidate) => ({
			engagementCount: candidate.engagementCount,
			finalSeedScore: scoreAnimeTournamentSeed({
				engagementCount: candidate.engagementCount,
				maxEngagementCount,
				maxPopularityRank,
				sourcePopularityRank: candidate.sourcePopularityRank,
				sourceScore: toNullableNumber(candidate.sourceScore),
			}),
			mediaItemId: candidate.mediaItemId,
			popularityRank: candidate.sourcePopularityRank,
			posterUrl: candidate.posterUrl,
			ratingScore: toNullableNumber(candidate.sourceScore),
			slug: candidate.slug,
			title: candidate.title,
			year: candidate.year,
		}))
		.sort((left, right) => right.finalSeedScore - left.finalSeedScore)
		.slice(0, 16)

	await db.transaction(async (tx) => {
		await tx
			.delete(mediaYearlyRankings)
			.where(and(eq(mediaYearlyRankings.year, year), eq(mediaYearlyRankings.mediaType, 'anime')))

		await tx.insert(mediaYearlyRankings).values(
			rankedCandidates.map((candidate, index) => ({
				compositeScore: candidate.ratingScore?.toFixed(2) ?? null,
				createdAt: now,
				engagementRank: candidate.engagementCount,
				finalSeedScore: candidate.finalSeedScore.toFixed(3),
				mediaItemId: candidate.mediaItemId,
				mediaType: 'anime' as const,
				popularityRank: candidate.popularityRank,
				ratingRank: index + 1,
				year,
			}))
		)
	})

	return rankedCandidates.map((candidate, index) => ({
		engagementCount: candidate.engagementCount,
		finalSeedScore: candidate.finalSeedScore,
		popularityRank: candidate.popularityRank,
		posterUrl: candidate.posterUrl,
		region: assignTournamentRegion(index),
		ratingScore: candidate.ratingScore,
		seed: index + 1,
		slug: candidate.slug,
		title: candidate.title,
		year: candidate.year,
	}))
}

export async function getAnimeTournamentSeedingPreview(
	preferredYear?: number
): Promise<AnimeTournamentSeedingPreview | null> {
	const year = await getAnimeCandidateYear(preferredYear)

	if (!year) {
		return null
	}

	let isFrozenSnapshot = true
	let generatedAt = await getStoredAnimeSnapshotCreatedAt(year)
	let seeds = await listStoredAnimeSeeds(year)

	if (seeds.length === 0) {
		const createdSeeds = await createAnimeTournamentSeedingSnapshot(year)

		if (!createdSeeds) {
			return null
		}

		seeds = createdSeeds
		generatedAt = new Date()
		isFrozenSnapshot = true
	}

	if (seeds.length === 0 || !generatedAt) {
		return null
	}

	return {
		entryCount: seeds.length,
		generatedAt,
		headerLabel: `Frozen seeding snapshot for the ${year} anime bracket`,
		isFrozenSnapshot,
		methodology: [
			'Universal quality signal from source score carries the heaviest weight.',
			'Popularity rank helps separate established contenders from weaker candidates.',
			'Checklist engagement adds a live community signal without overpowering quality.',
		],
		regions: tournamentRegions.map((label) => ({
			label,
			seedCount: seeds.filter((seed) => seed.region === label).length,
		})),
		seeds,
		year,
	}
}
