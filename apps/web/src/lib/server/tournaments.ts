import { db } from '$lib/server/db'
import {
	assignTournamentRegion,
	scoreAnimeTournamentSeed,
	tournamentRegions,
} from '$lib/tournaments'
import { animeDetails, mediaItems, userChecklists } from '@toasty/db/schema'
import { desc, eq, isNotNull, sql } from 'drizzle-orm'

type SeedCandidateRow = {
	engagementCount: number
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
			posterUrl: row.posterUrl,
			slug: row.slug,
			sourcePopularityRank: row.sourcePopularityRank,
			sourceScore: row.sourceScore,
			title: row.title,
			year: row.year ?? year,
		}))
		.filter((row) => Boolean(row.slug))
}

export async function getAnimeTournamentSeedingPreview(
	preferredYear?: number
): Promise<AnimeTournamentSeedingPreview | null> {
	const year = await getAnimeCandidateYear(preferredYear)

	if (!year) {
		return null
	}

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

	const seeds = candidates
		.map((candidate) => ({
			engagementCount: candidate.engagementCount,
			finalSeedScore: scoreAnimeTournamentSeed({
				engagementCount: candidate.engagementCount,
				maxEngagementCount,
				maxPopularityRank,
				sourcePopularityRank: candidate.sourcePopularityRank,
				sourceScore: toNullableNumber(candidate.sourceScore),
			}),
			popularityRank: candidate.sourcePopularityRank,
			posterUrl: candidate.posterUrl,
			ratingScore: toNullableNumber(candidate.sourceScore),
			slug: candidate.slug,
			title: candidate.title,
			year: candidate.year,
		}))
		.sort((left, right) => right.finalSeedScore - left.finalSeedScore)
		.slice(0, 16)
		.map((candidate, index) => ({
			...candidate,
			region: assignTournamentRegion(index),
			seed: index + 1,
		}))

	return {
		entryCount: seeds.length,
		generatedAt: new Date(),
		headerLabel: `Official seeding preview for the ${year} anime bracket`,
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
