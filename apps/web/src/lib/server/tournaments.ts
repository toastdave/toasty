import { recordTournamentVoteActivity } from '$lib/server/activity'
import { db } from '$lib/server/db'
import { getAnimeAggregateRatingMap } from '$lib/server/ratings'
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
	aggregateRatingCount: number
	communityRatingScore: number | null
	completionCount: number
	engagementCount: number
	mediaItemId: string
	posterUrl: string | null
	recommendationStrength: number | null
	slug: string
	sourcePopularityRank: number | null
	sourceScore: string | number | null
	title: string
	year: number
}

export type AnimeTournamentSeed = {
	completedCount: number
	engagementCount: number
	finalSeedScore: number
	popularityRank: number | null
	posterUrl: string | null
	region: (typeof tournamentRegions)[number]
	ratingCount: number
	ratingScore: number | null
	ratingSourceLabel: 'community' | 'source'
	recommendationStrength: number | null
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

export type AnimeTournamentArchiveCard = {
	entryCount: number
	hasBracket: boolean
	status: 'active' | 'complete' | 'draft' | 'preview'
	updatedAt: Date
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

	const mediaItemIds = rows.map((row) => row.mediaItemId)
	const [aggregateMap, checklistRows] = await Promise.all([
		getAnimeAggregateRatingMap(mediaItemIds),
		db
			.select({ mediaItemId: userChecklists.mediaItemId, status: userChecklists.status })
			.from(userChecklists)
			.where(inArray(userChecklists.mediaItemId, mediaItemIds)),
	])
	const completionMap = new Map<string, number>()

	for (const row of checklistRows) {
		if (row.status !== 'done') {
			continue
		}

		completionMap.set(row.mediaItemId, (completionMap.get(row.mediaItemId) ?? 0) + 1)
	}

	return rows
		.map((row) => {
			const aggregate = aggregateMap.get(row.mediaItemId)

			return {
				aggregateRatingCount: aggregate?.ratingCount ?? 0,
				communityRatingScore: aggregate?.overallAvg ?? null,
				completionCount: completionMap.get(row.mediaItemId) ?? 0,
				engagementCount: row.engagementCount,
				mediaItemId: row.mediaItemId,
				posterUrl: row.posterUrl,
				recommendationStrength: aggregate?.recommendationStrength ?? null,
				slug: row.slug,
				sourcePopularityRank: row.sourcePopularityRank,
				sourceScore: row.sourceScore,
				title: row.title,
				year: row.year ?? year,
			}
		})
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
	const candidateMap = new Map(
		(await listAnimeSeedCandidates(year)).map((candidate) => [candidate.mediaItemId, candidate])
	)

	return rows.slice(0, 16).map((row, index) => {
		const candidate = candidateMap.get(row.mediaItemId)

		return {
			completedCount: candidate?.completionCount ?? 0,
			engagementCount: candidate?.engagementCount ?? 0,
			finalSeedScore: toNullableNumber(row.finalSeedScore) ?? 0,
			mediaItemId: row.mediaItemId,
			popularityRank: row.popularityRank,
			posterUrl: row.posterUrl,
			region: assignTournamentRegion(index),
			ratingCount: candidate?.aggregateRatingCount ?? 0,
			ratingScore: toNullableNumber(row.compositeScore),
			ratingSourceLabel:
				candidate?.communityRatingScore !== null ? ('community' as const) : ('source' as const),
			recommendationStrength: candidate?.recommendationStrength ?? null,
			seed: index + 1,
			slug: row.slug,
			title: row.title,
			year: row.year,
		}
	})
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
	const maxCompletionCount = Math.max(
		...candidates.map((candidate) => candidate.completionCount),
		0
	)
	const maxEngagementCount = Math.max(
		...candidates.map((candidate) => candidate.engagementCount),
		0
	)
	const now = new Date()

	const rankedCandidates = candidates
		.map((candidate) => ({
			aggregateRatingCount: candidate.aggregateRatingCount,
			completedCount: candidate.completionCount,
			communityRatingScore: candidate.communityRatingScore,
			engagementCount: candidate.engagementCount,
			finalSeedScore: scoreAnimeTournamentSeed({
				aggregateRatingCount: candidate.aggregateRatingCount,
				communityOverallScore: candidate.communityRatingScore,
				completionCount: candidate.completionCount,
				maxCompletionCount,
				maxEngagementCount,
				maxPopularityRank,
				recommendationStrength: candidate.recommendationStrength,
				sourcePopularityRank: candidate.sourcePopularityRank,
				sourceScore: toNullableNumber(candidate.sourceScore),
				trackedCount: candidate.engagementCount,
			}),
			mediaItemId: candidate.mediaItemId,
			popularityRank: candidate.sourcePopularityRank,
			posterUrl: candidate.posterUrl,
			ratingCount: candidate.aggregateRatingCount,
			ratingScore: candidate.communityRatingScore ?? toNullableNumber(candidate.sourceScore),
			ratingSourceLabel:
				candidate.communityRatingScore !== null ? ('community' as const) : ('source' as const),
			recommendationStrength: candidate.recommendationStrength,
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
		completedCount: candidate.completedCount,
		engagementCount: candidate.engagementCount,
		finalSeedScore: candidate.finalSeedScore,
		mediaItemId: candidate.mediaItemId,
		popularityRank: candidate.popularityRank,
		posterUrl: candidate.posterUrl,
		region: assignTournamentRegion(index),
		ratingCount: candidate.ratingCount,
		ratingScore: candidate.ratingScore,
		ratingSourceLabel: candidate.ratingSourceLabel,
		recommendationStrength: candidate.recommendationStrength,
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
			'Community Toasty scores now outrank source scores whenever enough ratings exist.',
			'Recommendation strength and completion volume sharpen the field beyond raw hype.',
			'Popularity rank and total tracking keep broad awareness in the mix without deciding the bracket alone.',
		],
		regions: tournamentRegions.map((label) => ({
			label,
			seedCount: seeds.filter((seed) => seed.region === label).length,
		})),
		seeds,
		year,
	}
}

export async function listAnimeTournamentArchives(): Promise<AnimeTournamentArchiveCard[]> {
	const [rankingRows, tournamentRows] = await Promise.all([
		db
			.select({
				entryCount: sql<number>`count(*)`,
				updatedAt: sql<Date>`max(${mediaYearlyRankings.createdAt})`,
				year: mediaYearlyRankings.year,
			})
			.from(mediaYearlyRankings)
			.where(eq(mediaYearlyRankings.mediaType, 'anime'))
			.groupBy(mediaYearlyRankings.year)
			.orderBy(desc(mediaYearlyRankings.year)),
		db
			.select({
				status: tournaments.status,
				updatedAt: tournaments.updatedAt,
				year: tournaments.year,
			})
			.from(tournaments)
			.where(eq(tournaments.mediaType, 'anime'))
			.orderBy(desc(tournaments.year), desc(tournaments.updatedAt)),
	])

	const tournamentMap = new Map<number, (typeof tournamentRows)[number]>()

	for (const tournament of tournamentRows) {
		if (!tournamentMap.has(tournament.year)) {
			tournamentMap.set(tournament.year, tournament)
		}
	}

	return rankingRows.map((row) => {
		const tournament = tournamentMap.get(row.year)

		return {
			entryCount: row.entryCount,
			hasBracket: Boolean(tournament),
			status: tournament?.status ?? 'preview',
			updatedAt: tournament?.updatedAt ?? row.updatedAt,
			year: row.year,
		}
	})
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

	const selectedEntry = voteEntryId === matchup.entryAEntryId ? matchup.entryA : matchup.entryB
	const opponentEntry = voteEntryId === matchup.entryAEntryId ? matchup.entryB : matchup.entryA

	await recordTournamentVoteActivity({
		matchupId,
		opponentTitle: opponentEntry.title,
		selectedTitle: selectedEntry.title,
		userId,
		year,
	})
}
