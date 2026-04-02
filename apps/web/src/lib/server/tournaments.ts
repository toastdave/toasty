import { db } from '$lib/server/db'
import {
	assignTournamentRegion,
	buildOpeningRoundPairings,
	groupSeedsIntoRegions,
	scoreAnimeTournamentSeed,
	tournamentRegions,
} from '$lib/tournaments'
import {
	animeDetails,
	matchupVotes,
	matchups,
	mediaItems,
	mediaYearlyRankings,
	tournamentEntries,
	tournaments,
	userChecklists,
} from '@toasty/db/schema'
import { and, asc, desc, eq, inArray, isNotNull, sql } from 'drizzle-orm'

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

type StoredAnimeSeedRecord = AnimeTournamentSeed & {
	mediaItemId: string
}

export type AnimeTournamentBracket = {
	generatedAt: Date
	headerLabel: string
	openingRoundMatchups: Array<{
		entryA: AnimeTournamentSeed
		entryB: AnimeTournamentSeed
		id: string
		label: string
		region: (typeof tournamentRegions)[number]
		roundNumber: number
	}>
	regions: Array<{
		items: AnimeTournamentSeed[]
		label: (typeof tournamentRegions)[number]
	}>
	slug: string
	tournamentId: string
	year: number
}

export type AnimeTournamentMatchupDetail = {
	entryA: AnimeTournamentSeed
	entryAEntryId: string
	entryAVotes: number
	entryB: AnimeTournamentSeed
	entryBEntryId: string
	entryBVotes: number
	id: string
	label: string
	region: (typeof tournamentRegions)[number]
	roundNumber: number
	status: 'scheduled' | 'open' | 'closed' | 'finalized'
	totalVotes: number
	userVoteEntryId: string | null
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

async function listStoredAnimeSeeds(year: number): Promise<StoredAnimeSeedRecord[]> {
	const rows = await db
		.select({
			compositeScore: mediaYearlyRankings.compositeScore,
			createdAt: mediaYearlyRankings.createdAt,
			engagementRank: mediaYearlyRankings.engagementRank,
			finalSeedScore: mediaYearlyRankings.finalSeedScore,
			mediaItemId: mediaYearlyRankings.mediaItemId,
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
		mediaItemId: row.mediaItemId,
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
		mediaItemId: candidate.mediaItemId,
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

async function getStoredAnimeTournament(year: number) {
	const [tournament] = await db
		.select({ id: tournaments.id, slug: tournaments.slug, updatedAt: tournaments.updatedAt })
		.from(tournaments)
		.where(and(eq(tournaments.year, year), eq(tournaments.mediaType, 'anime')))
		.orderBy(desc(tournaments.createdAt))
		.limit(1)

	return tournament ?? null
}

async function ensureOpeningRoundMatchupsOpen(tournamentId: string) {
	await db
		.update(matchups)
		.set({ status: 'open' })
		.where(
			and(
				eq(matchups.tournamentId, tournamentId),
				eq(matchups.roundNumber, 1),
				eq(matchups.status, 'scheduled')
			)
		)
}

async function createAnimeTournamentBracket(year: number, seeds: StoredAnimeSeedRecord[]) {
	const tournament = await db.transaction(async (tx) => {
		const [createdTournament] = await tx
			.insert(tournaments)
			.values({
				mediaType: 'anime',
				name: `${year} Anime Bracket`,
				slug: `anime-${year}-bracket`,
				status: 'draft',
				year,
			})
			.returning({ id: tournaments.id, slug: tournaments.slug, updatedAt: tournaments.updatedAt })

		const orderedSeeds = [...seeds].sort((left, right) => left.seed - right.seed)
		const createdEntries = await tx
			.insert(tournamentEntries)
			.values(
				orderedSeeds.map((seed) => ({
					entryLabel: `${seed.region} seed ${seed.seed}`,
					mediaItemId: seed.mediaItemId,
					region: seed.region,
					seed: seed.seed,
					tournamentId: createdTournament.id,
				}))
			)
			.returning({
				id: tournamentEntries.id,
				region: tournamentEntries.region,
				seed: tournamentEntries.seed,
			})

		const regionEntries = createdEntries.filter(
			(entry): entry is { id: string; region: (typeof tournamentRegions)[number]; seed: number } =>
				Boolean(entry.region)
		)

		for (const regionGroup of groupSeedsIntoRegions(regionEntries)) {
			const pairings = buildOpeningRoundPairings(regionGroup.items)

			await tx.insert(matchups).values(
				pairings.map((pairing, index) => ({
					entryAId: pairing.entryA.id,
					entryBId: pairing.entryB.id,
					matchupNumber: index + 1,
					roundNumber: 1,
					status: 'scheduled' as const,
					tournamentId: createdTournament.id,
				}))
			)
		}

		return createdTournament
	})

	return tournament
}

export async function getAnimeTournamentBracket(
	year: number
): Promise<AnimeTournamentBracket | null> {
	const seeds = await listStoredAnimeSeeds(year)

	if (seeds.length === 0) {
		return null
	}

	let tournament = await getStoredAnimeTournament(year)

	if (!tournament) {
		tournament = await createAnimeTournamentBracket(year, seeds)
	}

	await ensureOpeningRoundMatchupsOpen(tournament.id)

	const matchupRows = await db
		.select({
			entryAId: matchups.entryAId,
			entryBId: matchups.entryBId,
			id: matchups.id,
			matchupNumber: matchups.matchupNumber,
			roundNumber: matchups.roundNumber,
		})
		.from(matchups)
		.where(and(eq(matchups.tournamentId, tournament.id), eq(matchups.roundNumber, 1)))
		.orderBy(asc(matchups.matchupNumber))

	const entryRows = await db
		.select({
			id: tournamentEntries.id,
			region: tournamentEntries.region,
			seed: tournamentEntries.seed,
		})
		.from(tournamentEntries)
		.where(eq(tournamentEntries.tournamentId, tournament.id))

	const entryMap = new Map(entryRows.map((entry) => [entry.id, entry]))
	const seedMap = new Map(seeds.map((seed) => [`${seed.region}:${seed.seed}`, seed]))

	const openingRoundMatchups = matchupRows
		.map((matchup) => {
			const entryA = entryMap.get(matchup.entryAId)
			const entryB = entryMap.get(matchup.entryBId)

			if (!entryA?.region || !entryB?.region) {
				return null
			}

			const seedA = seedMap.get(`${entryA.region}:${entryA.seed}`)
			const seedB = seedMap.get(`${entryB.region}:${entryB.seed}`)

			if (!seedA || !seedB) {
				return null
			}

			return {
				entryA: seedA,
				entryB: seedB,
				id: matchup.id,
				label: `${entryA.region} region • Match ${matchup.matchupNumber}`,
				region: entryA.region,
				roundNumber: matchup.roundNumber,
			}
		})
		.filter(Boolean) as AnimeTournamentBracket['openingRoundMatchups']

	return {
		generatedAt: tournament.updatedAt,
		headerLabel: `${year} Anime Bracket`,
		openingRoundMatchups,
		regions: groupSeedsIntoRegions(seeds).map((group) => ({
			items: group.items,
			label: group.region,
		})),
		slug: tournament.slug,
		tournamentId: tournament.id,
		year,
	}
}

export async function getAnimeTournamentMatchupDetail(
	year: number,
	matchupId: string,
	userId?: string
): Promise<AnimeTournamentMatchupDetail | null> {
	const [matchup] = await db
		.select({
			entryAId: matchups.entryAId,
			entryBId: matchups.entryBId,
			id: matchups.id,
			matchupNumber: matchups.matchupNumber,
			roundNumber: matchups.roundNumber,
			status: matchups.status,
			tournamentId: tournaments.id,
			year: tournaments.year,
		})
		.from(matchups)
		.innerJoin(tournaments, eq(tournaments.id, matchups.tournamentId))
		.where(
			and(
				eq(matchups.id, matchupId),
				eq(tournaments.year, year),
				eq(tournaments.mediaType, 'anime')
			)
		)
		.limit(1)

	if (!matchup) {
		return null
	}

	if (matchup.roundNumber === 1 && matchup.status === 'scheduled') {
		await ensureOpeningRoundMatchupsOpen(matchup.tournamentId)
		matchup.status = 'open'
	}

	const seeds = await listStoredAnimeSeeds(year)
	const entryRows = await db
		.select({
			id: tournamentEntries.id,
			region: tournamentEntries.region,
			seed: tournamentEntries.seed,
		})
		.from(tournamentEntries)
		.where(inArray(tournamentEntries.id, [matchup.entryAId, matchup.entryBId]))

	const entryMap = new Map(entryRows.map((entry) => [entry.id, entry]))
	const entryA = entryMap.get(matchup.entryAId)
	const entryB = entryMap.get(matchup.entryBId)

	if (!entryA?.region || !entryB?.region) {
		return null
	}

	const seedMap = new Map(seeds.map((seed) => [`${seed.region}:${seed.seed}`, seed]))
	const seedA = seedMap.get(`${entryA.region}:${entryA.seed}`)
	const seedB = seedMap.get(`${entryB.region}:${entryB.seed}`)

	if (!seedA || !seedB) {
		return null
	}

	const matchupRegion = entryA.region as (typeof tournamentRegions)[number]

	const voteRows = await db
		.select({ count: sql<number>`count(*)`, voteEntryId: matchupVotes.voteEntryId })
		.from(matchupVotes)
		.where(eq(matchupVotes.matchupId, matchup.id))
		.groupBy(matchupVotes.voteEntryId)

	const voteCountMap = new Map(voteRows.map((row) => [row.voteEntryId, row.count]))
	const [userVote] = userId
		? await db
				.select({ voteEntryId: matchupVotes.voteEntryId })
				.from(matchupVotes)
				.where(and(eq(matchupVotes.matchupId, matchup.id), eq(matchupVotes.userId, userId)))
				.orderBy(desc(matchupVotes.createdAt))
				.limit(1)
		: [null]

	const entryAVotes = voteCountMap.get(matchup.entryAId) ?? 0
	const entryBVotes = voteCountMap.get(matchup.entryBId) ?? 0

	return {
		entryA: seedA,
		entryAEntryId: matchup.entryAId,
		entryAVotes,
		entryB: seedB,
		entryBEntryId: matchup.entryBId,
		entryBVotes,
		id: matchup.id,
		label: `${matchupRegion} region • Match ${matchup.matchupNumber}`,
		region: matchupRegion,
		roundNumber: matchup.roundNumber,
		status: matchup.status,
		totalVotes: entryAVotes + entryBVotes,
		userVoteEntryId: userVote?.voteEntryId ?? null,
		year: matchup.year,
	}
}

export async function submitAnimeTournamentVote(
	year: number,
	matchupId: string,
	userId: string,
	voteEntryId: string
) {
	const matchup = await getAnimeTournamentMatchupDetail(year, matchupId, userId)

	if (!matchup) {
		throw new Error('Matchup not found')
	}

	if (![matchup.entryAEntryId, matchup.entryBEntryId].includes(voteEntryId)) {
		throw new Error('Vote target is not part of this matchup')
	}

	if (!['open', 'scheduled'].includes(matchup.status)) {
		throw new Error('Voting is closed for this matchup')
	}

	await db.transaction(async (tx) => {
		await tx
			.delete(matchupVotes)
			.where(and(eq(matchupVotes.matchupId, matchupId), eq(matchupVotes.userId, userId)))

		await tx.insert(matchupVotes).values({
			matchupId,
			userId,
			voteEntryId,
		})
	})
}
