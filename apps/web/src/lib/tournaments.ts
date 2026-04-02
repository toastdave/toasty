export const tournamentRegions = ['North', 'South', 'East', 'West'] as const

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
