export const tournamentRegions = ['North', 'South', 'East', 'West'] as const

export const openingRoundPairings = [
	[1, 4],
	[2, 3],
] as const

type AnimeTournamentSeedScoreParams = {
	engagementCount: number
	maxEngagementCount: number
	maxPopularityRank: number
	sourcePopularityRank: number | null
	sourceScore: number | null
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
	engagementCount,
	maxEngagementCount,
	maxPopularityRank,
	sourcePopularityRank,
	sourceScore,
}: AnimeTournamentSeedScoreParams) {
	const ratingComponent = (sourceScore ?? 0) / 10
	const popularityComponent =
		typeof sourcePopularityRank === 'number' && maxPopularityRank > 1
			? 1 - (sourcePopularityRank - 1) / (maxPopularityRank - 1)
			: 0
	const engagementComponent =
		maxEngagementCount > 0 ? Math.min(engagementCount / maxEngagementCount, 1) : 0

	return Number(
		(ratingComponent * 60 + popularityComponent * 25 + engagementComponent * 15).toFixed(3)
	)
}
