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
			engagementCount: 12,
			maxEngagementCount: 12,
			maxPopularityRank: 300,
			sourcePopularityRank: 8,
			sourceScore: 9.1,
		})
		const weakerSeed = scoreAnimeTournamentSeed({
			engagementCount: 1,
			maxEngagementCount: 12,
			maxPopularityRank: 300,
			sourcePopularityRank: 140,
			sourceScore: 7.8,
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
