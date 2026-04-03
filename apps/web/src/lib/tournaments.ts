export const tournamentRegions = ['North', 'South', 'East', 'West'] as const

export const openingRoundPairings = [
	[1, 4],
	[2, 3],
] as const

type AnimeTournamentSeedScoreParams = {
	aggregateRatingCount: number
	communityOverallScore: number | null
	completionCount: number
	maxCompletionCount: number
	maxEngagementCount: number
	maxPopularityRank: number
	recommendationStrength: number | null
	sourcePopularityRank: number | null
	sourceScore: number | null
	trackedCount: number
}

export function assignTournamentRegion(seedIndex: number) {
	return tournamentRegions[seedIndex % tournamentRegions.length]
}

export function groupSeedsIntoRegions<
	T extends { region: (typeof tournamentRegions)[number]; seed: number },
>(seeds: T[]) {
	return tournamentRegions.map((region) => ({
		items: seeds
			.filter((seed) => seed.region === region)
			.sort((left, right) => left.seed - right.seed),
		region,
	}))
}

export function buildOpeningRoundPairings<T extends { seed: number }>(seeds: T[]) {
	return openingRoundPairings
		.map(([seedA, seedB]) => ({
			entryA: seeds.find((seed) => seed.seed === seedA) ?? null,
			entryB: seeds.find((seed) => seed.seed === seedB) ?? null,
		}))
		.filter((pairing): pairing is { entryA: T; entryB: T } =>
			Boolean(pairing.entryA && pairing.entryB)
		)
}

export function scoreAnimeTournamentSeed({
	aggregateRatingCount,
	communityOverallScore,
	completionCount,
	maxCompletionCount,
	maxEngagementCount,
	maxPopularityRank,
	recommendationStrength,
	sourcePopularityRank,
	sourceScore,
	trackedCount,
}: AnimeTournamentSeedScoreParams) {
	const qualitySignal = communityOverallScore ?? sourceScore ?? 0
	const qualityComponent = qualitySignal / 10
	const ratingConfidenceComponent = Math.min(aggregateRatingCount / 12, 1)
	const popularityComponent =
		typeof sourcePopularityRank === 'number' && maxPopularityRank > 1
			? 1 - (sourcePopularityRank - 1) / (maxPopularityRank - 1)
			: 0
	const recommendationComponent =
		typeof recommendationStrength === 'number' ? recommendationStrength / 10 : 0
	const completionComponent =
		maxCompletionCount > 0 ? Math.min(completionCount / maxCompletionCount, 1) : 0
	const engagementComponent =
		maxEngagementCount > 0 ? Math.min(trackedCount / maxEngagementCount, 1) : 0

	return Number(
		(
			qualityComponent * 42 +
			ratingConfidenceComponent * 8 +
			recommendationComponent * 14 +
			popularityComponent * 16 +
			completionComponent * 12 +
			engagementComponent * 8
		).toFixed(3)
	)
}
