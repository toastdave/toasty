import { describe, expect, it } from 'bun:test'
import { assignTournamentRegion, scoreAnimeTournamentSeed } from './tournaments'

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
})
