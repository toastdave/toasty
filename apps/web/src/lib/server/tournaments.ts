import { recordTournamentVoteActivity } from '$lib/server/activity'
import { db } from '$lib/server/db'
import { getAnimeAggregateRatingMap } from '$lib/server/ratings'
import {
	assignTournamentRegion,
	buildOpeningRoundPairings,
	groupSeedsIntoRegions,
	openingRoundPairings,
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
	userRatings,
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
		entryAEntryId: string
		entryB: AnimeTournamentSeed
		entryBEntryId: string
		id: string
		label: string
		region: (typeof tournamentRegions)[number]
		roundNumber: number
	}>
	regions: Array<{
		items: AnimeTournamentSeed[]
		label: (typeof tournamentRegions)[number]
	}>
	rounds: Array<{
		items: Array<{
			entryA: AnimeTournamentSeed
			entryAEntryId: string
			entryB: AnimeTournamentSeed
			entryBEntryId: string
			id: string
			label: string
			region: (typeof tournamentRegions)[number] | 'Final Four' | 'Title Match'
			roundNumber: number
			status: 'scheduled' | 'open' | 'closed' | 'finalized'
			winnerEntryId: string | null
		}>
		label: string
		roundNumber: number
	}>
	slug: string
	summary: {
		championTitle: string | null
		currentRoundLabel: string | null
		liveMatchupCount: number
		totalVotes: number
	}
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
	region: (typeof tournamentRegions)[number] | 'Final Four' | 'Title Match'
	roundNumber: number
	status: 'scheduled' | 'open' | 'closed' | 'finalized'
	totalVotes: number
	upsetLabel: string | null
	userVoteEntryId: string | null
	year: number
}

export type AnimeTournamentArchiveCard = {
	championTitle: string | null
	currentRoundLabel: string | null
	entryCount: number
	hasBracket: boolean
	status: 'active' | 'complete' | 'draft' | 'preview'
	totalVotes: number
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

function toDate(value: unknown) {
	if (value instanceof Date) {
		return value
	}

	if (typeof value === 'string' || typeof value === 'number') {
		const parsed = new Date(value)
		return Number.isNaN(parsed.getTime()) ? null : parsed
	}

	return null
}

function toTournamentRegion(value: string | null) {
	return tournamentRegions.includes(value as (typeof tournamentRegions)[number])
		? (value as (typeof tournamentRegions)[number])
		: null
}

function getRoundLabel(roundNumber: number) {
	if (roundNumber === 1) {
		return 'Opening round'
	}

	if (roundNumber === 2) {
		return 'Regional finals'
	}

	if (roundNumber === 3) {
		return 'Final Four'
	}

	if (roundNumber === 4) {
		return 'Championship'
	}

	return `Round ${roundNumber}`
}

function getRoundRegionLabel(roundNumber: number, region: (typeof tournamentRegions)[number]) {
	if (roundNumber <= 2) {
		return region
	}

	if (roundNumber === 3) {
		return 'Final Four' as const
	}

	return 'Title Match' as const
}

function getCurrentRoundLabel(
	rows: Array<{ roundNumber: number; status: 'scheduled' | 'open' | 'closed' | 'finalized' }>
) {
	const nextRound = rows.find((row) => row.status !== 'finalized')

	if (nextRound) {
		return getRoundLabel(nextRound.roundNumber)
	}

	const lastRound = rows.at(-1)
	return lastRound ? getRoundLabel(lastRound.roundNumber) : null
}

function getUpsetLabel(params: {
	entryASeed: number
	entryAVotes: number
	entryBSeed: number
	entryBVotes: number
	status: 'scheduled' | 'open' | 'closed' | 'finalized'
	winnerEntryId: string | null
	entryAEntryId: string
	entryBEntryId: string
}) {
	const lowerSeedEntryId =
		params.entryASeed > params.entryBSeed ? params.entryAEntryId : params.entryBEntryId
	const lowerSeed = Math.max(params.entryASeed, params.entryBSeed)
	const higherSeed = Math.min(params.entryASeed, params.entryBSeed)

	if (lowerSeed === higherSeed) {
		return null
	}

	const lowerSeedLeading =
		(params.entryASeed > params.entryBSeed && params.entryAVotes > params.entryBVotes) ||
		(params.entryBSeed > params.entryASeed && params.entryBVotes > params.entryAVotes)

	if (params.status === 'finalized' && params.winnerEntryId === lowerSeedEntryId) {
		return `Upset locked in: #${lowerSeed} over #${higherSeed}`
	}

	if (params.status !== 'scheduled' && lowerSeedLeading) {
		return `Upset watch: #${lowerSeed} is leading #${higherSeed}`
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
			seed: Math.floor(index / tournamentRegions.length) + 1,
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
		seed: Math.floor(index / tournamentRegions.length) + 1,
		slug: candidate.slug,
		title: candidate.title,
		year: candidate.year,
	}))
}

export async function refreshAnimeTournamentSeedingSnapshot(year: number) {
	return createAnimeTournamentSeedingSnapshot(year)
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
				id: tournaments.id,
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

	return Promise.all(
		rankingRows.map(async (row) => {
			const tournament = tournamentMap.get(row.year)
			const meta = tournament ? await getTournamentMeta(tournament.id) : null

			return {
				championTitle: meta?.championTitle ?? null,
				currentRoundLabel: meta?.currentRoundLabel ?? null,
				entryCount: row.entryCount,
				hasBracket: Boolean(tournament),
				status: tournament?.status ?? 'preview',
				totalVotes: meta?.totalVotes ?? 0,
				updatedAt: toDate(tournament?.updatedAt ?? row.updatedAt) ?? new Date(),
				year: row.year,
			}
		})
	)
}

async function getStoredAnimeTournament(year: number) {
	const [tournament] = await db
		.select({
			endsAt: tournaments.endsAt,
			id: tournaments.id,
			slug: tournaments.slug,
			startsAt: tournaments.startsAt,
			status: tournaments.status,
			updatedAt: tournaments.updatedAt,
		})
		.from(tournaments)
		.where(and(eq(tournaments.year, year), eq(tournaments.mediaType, 'anime')))
		.orderBy(desc(tournaments.createdAt))
		.limit(1)

	return tournament ?? null
}

async function getTournamentMeta(tournamentId: string) {
	const [matchupRows, [voteSummary], [championRow]] = await Promise.all([
		db
			.select({
				roundNumber: matchups.roundNumber,
				status: matchups.status,
				winnerEntryId: matchups.winnerEntryId,
			})
			.from(matchups)
			.where(eq(matchups.tournamentId, tournamentId))
			.orderBy(asc(matchups.roundNumber), asc(matchups.matchupNumber)),
		db
			.select({ totalVotes: sql<number>`count(*)` })
			.from(matchupVotes)
			.innerJoin(matchups, eq(matchups.id, matchupVotes.matchupId))
			.where(eq(matchups.tournamentId, tournamentId)),
		db
			.select({ title: mediaItems.title })
			.from(matchups)
			.innerJoin(tournamentEntries, eq(tournamentEntries.id, matchups.winnerEntryId))
			.innerJoin(mediaItems, eq(mediaItems.id, tournamentEntries.mediaItemId))
			.where(and(eq(matchups.tournamentId, tournamentId), eq(matchups.status, 'finalized')))
			.orderBy(desc(matchups.roundNumber), desc(matchups.matchupNumber))
			.limit(1),
	])

	return {
		championTitle: championRow?.title ?? null,
		currentRoundLabel: getCurrentRoundLabel(matchupRows),
		totalVotes: voteSummary?.totalVotes ?? 0,
	}
}

async function openTournamentRound(tournamentId: string, roundNumber: number) {
	await db
		.update(matchups)
		.set({ startsAt: new Date(), status: 'open' })
		.where(
			and(
				eq(matchups.tournamentId, tournamentId),
				eq(matchups.roundNumber, roundNumber),
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
			.returning({
				endsAt: tournaments.endsAt,
				id: tournaments.id,
				slug: tournaments.slug,
				startsAt: tournaments.startsAt,
				status: tournaments.status,
				updatedAt: tournaments.updatedAt,
			})

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

		for (const [regionIndex, regionGroup] of groupSeedsIntoRegions(regionEntries).entries()) {
			const pairings = buildOpeningRoundPairings(regionGroup.items)

			await tx.insert(matchups).values(
				pairings.map((pairing, index) => ({
					entryAId: pairing.entryA.id,
					entryBId: pairing.entryB.id,
					matchupNumber: regionIndex * openingRoundPairings.length + index + 1,
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

async function listTournamentEntryRows(tournamentId: string) {
	return db
		.select({
			id: tournamentEntries.id,
			region: tournamentEntries.region,
			seed: tournamentEntries.seed,
		})
		.from(tournamentEntries)
		.where(eq(tournamentEntries.tournamentId, tournamentId))
		.then((rows) =>
			rows.map((row) => ({
				id: row.id,
				region: toTournamentRegion(row.region),
				seed: row.seed,
			}))
		)
}

function resolveWinningEntryId(params: {
	entryA: { id: string; seed: number }
	entryAVotes: number
	entryB: { id: string; seed: number }
	entryBVotes: number
	seedA: AnimeTournamentSeed
	seedB: AnimeTournamentSeed
}) {
	if (params.entryAVotes > params.entryBVotes) {
		return params.entryA.id
	}

	if (params.entryBVotes > params.entryAVotes) {
		return params.entryB.id
	}

	if (params.entryA.seed !== params.entryB.seed) {
		return params.entryA.seed < params.entryB.seed ? params.entryA.id : params.entryB.id
	}

	return (params.seedA.finalSeedScore ?? 0) >= (params.seedB.finalSeedScore ?? 0)
		? params.entryA.id
		: params.entryB.id
}

async function createNextRoundMatchups(params: {
	entryMap: Map<
		string,
		{ id: string; region: (typeof tournamentRegions)[number] | null; seed: number }
	>
	finalizedMatchups: Array<{
		matchupNumber: number
		region: (typeof tournamentRegions)[number]
		winnerEntryId: string
	}>
	roundNumber: number
	tournamentId: string
}) {
	const nextRoundNumber = params.roundNumber + 1
	const existingNextRound = await db
		.select({ id: matchups.id })
		.from(matchups)
		.where(
			and(eq(matchups.tournamentId, params.tournamentId), eq(matchups.roundNumber, nextRoundNumber))
		)
		.limit(1)

	if (existingNextRound[0]) {
		await openTournamentRound(params.tournamentId, nextRoundNumber)
		return
	}

	const now = new Date()
	const nextRoundValues = [] as Array<{
		entryAId: string
		entryBId: string
		matchupNumber: number
		roundNumber: number
		status: 'open'
		startsAt: Date
		tournamentId: string
	}>

	if (params.roundNumber === 1) {
		for (const region of tournamentRegions) {
			const regionWinners = params.finalizedMatchups
				.filter((matchup) => matchup.region === region)
				.sort((left, right) => left.matchupNumber - right.matchupNumber)

			if (regionWinners.length >= 2) {
				nextRoundValues.push({
					entryAId: regionWinners[0].winnerEntryId,
					entryBId: regionWinners[1].winnerEntryId,
					matchupNumber: nextRoundValues.length + 1,
					roundNumber: nextRoundNumber,
					startsAt: now,
					status: 'open',
					tournamentId: params.tournamentId,
				})
			}
		}
	} else if (params.roundNumber === 2) {
		const winnerByRegion = new Map(
			params.finalizedMatchups.map((matchup) => [matchup.region, matchup.winnerEntryId])
		)
		const semifinalPairs = [
			['North', 'South'],
			['East', 'West'],
		] as const

		for (const [regionA, regionB] of semifinalPairs) {
			const winnerA = winnerByRegion.get(regionA)
			const winnerB = winnerByRegion.get(regionB)

			if (winnerA && winnerB) {
				nextRoundValues.push({
					entryAId: winnerA,
					entryBId: winnerB,
					matchupNumber: nextRoundValues.length + 1,
					roundNumber: nextRoundNumber,
					startsAt: now,
					status: 'open',
					tournamentId: params.tournamentId,
				})
			}
		}
	} else if (params.roundNumber === 3 && params.finalizedMatchups.length >= 2) {
		nextRoundValues.push({
			entryAId: params.finalizedMatchups[0].winnerEntryId,
			entryBId: params.finalizedMatchups[1].winnerEntryId,
			matchupNumber: 1,
			roundNumber: nextRoundNumber,
			startsAt: now,
			status: 'open',
			tournamentId: params.tournamentId,
		})
	}

	if (nextRoundValues.length > 0) {
		await db.insert(matchups).values(nextRoundValues)
	}
}

export async function publishAnimeTournament(year: number) {
	let seeds = await listStoredAnimeSeeds(year)

	if (seeds.length === 0) {
		const createdSeeds = await createAnimeTournamentSeedingSnapshot(year)

		if (!createdSeeds) {
			return null
		}

		seeds = createdSeeds
	}

	let tournament = await getStoredAnimeTournament(year)

	if (!tournament) {
		tournament = await createAnimeTournamentBracket(year, seeds)
	}

	await db
		.update(tournaments)
		.set({ startsAt: tournament.startsAt ?? new Date(), status: 'active', updatedAt: new Date() })
		.where(eq(tournaments.id, tournament.id))

	await openTournamentRound(tournament.id, 1)

	return getStoredAnimeTournament(year)
}

export async function advanceAnimeTournament(year: number) {
	const tournament = await publishAnimeTournament(year)

	if (!tournament) {
		return null
	}

	const seeds = await listStoredAnimeSeeds(year)
	const seedMap = new Map(seeds.map((seed) => [`${seed.region}:${seed.seed}`, seed]))
	const entryRows = await listTournamentEntryRows(tournament.id)
	const entryMap = new Map(entryRows.map((entry) => [entry.id, entry]))
	const [nextRound] = await db
		.select({ roundNumber: matchups.roundNumber })
		.from(matchups)
		.where(and(eq(matchups.tournamentId, tournament.id), sql`${matchups.status} <> 'finalized'`))
		.orderBy(asc(matchups.roundNumber), asc(matchups.matchupNumber))
		.limit(1)

	if (!nextRound) {
		return tournament
	}

	const roundMatchups = await db
		.select({
			entryAId: matchups.entryAId,
			entryBId: matchups.entryBId,
			id: matchups.id,
			matchupNumber: matchups.matchupNumber,
			roundNumber: matchups.roundNumber,
		})
		.from(matchups)
		.where(
			and(eq(matchups.tournamentId, tournament.id), eq(matchups.roundNumber, nextRound.roundNumber))
		)
		.orderBy(asc(matchups.matchupNumber))

	const voteRows = await db
		.select({
			count: sql<number>`count(*)`,
			matchupId: matchupVotes.matchupId,
			voteEntryId: matchupVotes.voteEntryId,
		})
		.from(matchupVotes)
		.where(
			inArray(
				matchupVotes.matchupId,
				roundMatchups.map((matchup) => matchup.id)
			)
		)
		.groupBy(matchupVotes.matchupId, matchupVotes.voteEntryId)

	const voteCountMap = new Map<string, Map<string, number>>()

	for (const row of voteRows) {
		const counts = voteCountMap.get(row.matchupId) ?? new Map<string, number>()
		counts.set(row.voteEntryId, row.count)
		voteCountMap.set(row.matchupId, counts)
	}

	const finalizedMatchups = roundMatchups.flatMap((matchup) => {
		const entryA = entryMap.get(matchup.entryAId)
		const entryB = entryMap.get(matchup.entryBId)

		if (!entryA?.region || !entryB?.region) {
			return []
		}

		const seedA = seedMap.get(`${entryA.region}:${entryA.seed}`)
		const seedB = seedMap.get(`${entryB.region}:${entryB.seed}`)

		if (!seedA || !seedB) {
			return []
		}

		const matchupVotesForEntry = voteCountMap.get(matchup.id) ?? new Map<string, number>()
		const entryAVotes = matchupVotesForEntry.get(matchup.entryAId) ?? 0
		const entryBVotes = matchupVotesForEntry.get(matchup.entryBId) ?? 0
		const winnerEntryId = resolveWinningEntryId({
			entryA,
			entryAVotes,
			entryB,
			entryBVotes,
			seedA,
			seedB,
		})

		return [
			{
				id: matchup.id,
				matchupNumber: matchup.matchupNumber,
				region: entryA.region,
				winnerEntryId,
			},
		]
	})

	const now = new Date()

	for (const matchup of finalizedMatchups) {
		await db
			.update(matchups)
			.set({ endsAt: now, status: 'finalized', winnerEntryId: matchup.winnerEntryId })
			.where(eq(matchups.id, matchup.id))
	}

	if (finalizedMatchups.length === 1 && nextRound.roundNumber >= 4) {
		await db
			.update(tournaments)
			.set({ endsAt: now, status: 'complete', updatedAt: now })
			.where(eq(tournaments.id, tournament.id))

		return getStoredAnimeTournament(year)
	}

	await createNextRoundMatchups({
		entryMap,
		finalizedMatchups,
		roundNumber: nextRound.roundNumber,
		tournamentId: tournament.id,
	})

	await db
		.update(tournaments)
		.set({ status: 'active', updatedAt: now })
		.where(eq(tournaments.id, tournament.id))

	return getStoredAnimeTournament(year)
}

export async function getAnimeTournamentBracket(
	year: number
): Promise<AnimeTournamentBracket | null> {
	const seeds = await listStoredAnimeSeeds(year)

	if (seeds.length === 0) {
		return null
	}

	const tournament = await getStoredAnimeTournament(year)

	if (!tournament) {
		return null
	}

	const [matchupRows, meta] = await Promise.all([
		db
			.select({
				entryAId: matchups.entryAId,
				entryBId: matchups.entryBId,
				id: matchups.id,
				matchupNumber: matchups.matchupNumber,
				roundNumber: matchups.roundNumber,
				status: matchups.status,
				winnerEntryId: matchups.winnerEntryId,
			})
			.from(matchups)
			.where(eq(matchups.tournamentId, tournament.id))
			.orderBy(asc(matchups.roundNumber), asc(matchups.matchupNumber)),
		getTournamentMeta(tournament.id),
	])

	const entryRows = await listTournamentEntryRows(tournament.id)

	const entryMap = new Map(entryRows.map((entry) => [entry.id, entry]))
	const seedMap = new Map(seeds.map((seed) => [`${seed.region}:${seed.seed}`, seed]))
	const roundItems = matchupRows
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

			const regionLabel = getRoundRegionLabel(matchup.roundNumber, entryA.region)

			return {
				entryA: seedA,
				entryAEntryId: matchup.entryAId,
				entryB: seedB,
				entryBEntryId: matchup.entryBId,
				id: matchup.id,
				label: `${getRoundLabel(matchup.roundNumber)} • Match ${matchup.matchupNumber}`,
				region: regionLabel,
				roundNumber: matchup.roundNumber,
				status: matchup.status,
				winnerEntryId: matchup.winnerEntryId,
			}
		})
		.filter(Boolean) as AnimeTournamentBracket['rounds'][number]['items']
	const rounds = [...new Set(roundItems.map((item) => item.roundNumber))].map((roundNumber) => ({
		items: roundItems.filter((item) => item.roundNumber === roundNumber),
		label: getRoundLabel(roundNumber),
		roundNumber,
	}))
	const openingRoundMatchups = roundItems.filter(
		(item) => item.roundNumber === 1
	) as AnimeTournamentBracket['openingRoundMatchups']

	return {
		generatedAt: tournament.updatedAt,
		headerLabel: `${year} Anime Bracket`,
		openingRoundMatchups,
		regions: groupSeedsIntoRegions(seeds).map((group) => ({
			items: group.items,
			label: group.region,
		})),
		rounds,
		slug: tournament.slug,
		summary: {
			championTitle: meta.championTitle,
			currentRoundLabel: meta.currentRoundLabel,
			liveMatchupCount: matchupRows.filter((matchup) => matchup.status === 'open').length,
			totalVotes: meta.totalVotes,
		},
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
			winnerEntryId: matchups.winnerEntryId,
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

	const seeds = await listStoredAnimeSeeds(year)
	const entryRows = await db
		.select({
			id: tournamentEntries.id,
			region: tournamentEntries.region,
			seed: tournamentEntries.seed,
		})
		.from(tournamentEntries)
		.where(inArray(tournamentEntries.id, [matchup.entryAId, matchup.entryBId]))

	const entryMap = new Map(
		entryRows.map((entry) => [entry.id, { ...entry, region: toTournamentRegion(entry.region) }])
	)
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

	const matchupRegion = getRoundRegionLabel(matchup.roundNumber, entryA.region)

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
		label: `${getRoundLabel(matchup.roundNumber)} • Match ${matchup.matchupNumber}`,
		region: matchupRegion,
		roundNumber: matchup.roundNumber,
		status: matchup.status,
		totalVotes: entryAVotes + entryBVotes,
		upsetLabel: getUpsetLabel({
			entryAEntryId: matchup.entryAId,
			entryASeed: seedA.seed,
			entryAVotes,
			entryBEntryId: matchup.entryBId,
			entryBSeed: seedB.seed,
			entryBVotes,
			status: matchup.status,
			winnerEntryId: matchup.winnerEntryId,
		}),
		userVoteEntryId: userVote?.voteEntryId ?? null,
		year: matchup.year,
	}
}

async function ensureTournamentVoterEligible(userId: string) {
	const [[ratingSummary], [checklistSummary]] = await Promise.all([
		db
			.select({ count: sql<number>`count(*)` })
			.from(userRatings)
			.where(and(eq(userRatings.userId, userId), isNotNull(userRatings.overallScore))),
		db
			.select({
				completedCount: sql<number>`count(*) filter (where ${userChecklists.status} = 'done')`,
				trackedCount: sql<number>`count(*)`,
			})
			.from(userChecklists)
			.where(eq(userChecklists.userId, userId)),
	])

	const ratingCount = ratingSummary?.count ?? 0
	const completedCount = checklistSummary?.completedCount ?? 0
	const trackedCount = checklistSummary?.trackedCount ?? 0

	if (ratingCount > 0 || completedCount > 0 || trackedCount >= 3) {
		return
	}

	throw new Error('Build a little Toasty history before voting in tournament matchups')
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

	if (matchup.status !== 'open') {
		throw new Error('Voting is closed for this matchup')
	}

	await ensureTournamentVoterEligible(userId)

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
