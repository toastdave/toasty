import { describe, expect, it } from 'bun:test'
import {
	assignTournamentRegion,
	buildOpeningRoundPairings,
	groupSeedsIntoRegions,
	scoreAnimeTournamentSeed,
} from './tournaments'

describe('tournament helpers', () => {
	it('cycles regions in bracket order', () => {
		expect(assignTournamentRegion(0)).toBe('North')
		expect(assignTournamentRegion(1)).toBe('South')
		expect(assignTournamentRegion(4)).toBe('North')
	})

	it('weights stronger quality and engagement higher', () => {
		const strongerSeed = scoreAnimeTournamentSeed({
			aggregateRatingCount: 10,
			communityOverallScore: 8.9,
			completionCount: 8,
			maxCompletionCount: 8,
			maxEngagementCount: 12,
			maxPopularityRank: 300,
			recommendationStrength: 9,
			sourcePopularityRank: 8,
			sourceScore: 9.1,
			trackedCount: 12,
		})
		const weakerSeed = scoreAnimeTournamentSeed({
			aggregateRatingCount: 1,
			communityOverallScore: 7.2,
			completionCount: 1,
			maxCompletionCount: 8,
			maxEngagementCount: 12,
			maxPopularityRank: 300,
			recommendationStrength: 5,
			sourcePopularityRank: 140,
			sourceScore: 7.8,
			trackedCount: 1,
		})

		expect(strongerSeed).toBeGreaterThan(weakerSeed)
	})

	it('groups seeds into stable regions and opening pairings', () => {
		const regions = groupSeedsIntoRegions([
			{ region: 'North' as const, seed: 4 },
			{ region: 'North' as const, seed: 1 },
			{ region: 'North' as const, seed: 3 },
			{ region: 'North' as const, seed: 2 },
		])

		expect(regions[0].items.map((seed) => seed.seed)).toEqual([1, 2, 3, 4])

		const pairings = buildOpeningRoundPairings(regions[0].items)

		expect(pairings).toHaveLength(2)
		expect(pairings[0].entryA.seed).toBe(1)
		expect(pairings[0].entryB.seed).toBe(4)
	})
})
