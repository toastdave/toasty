import { describe, expect, it } from 'bun:test'
import {
	buildAnimeRecommendationReason,
	scoreAnimeRecommendationCandidate,
} from './recommendations'

describe('recommendation helpers', () => {
	it('builds readable recommendation reasons from shared genres', () => {
		expect(buildAnimeRecommendationReason(['Action', 'Fantasy', 'Fantasy'])).toBe(
			'Shared Action + Fantasy energy'
		)
		expect(buildAnimeRecommendationReason(['Romance'])).toBe('Shared Romance DNA')
	})

	it('favors overlap first and then metadata affinity', () => {
		const strongerMatch = scoreAnimeRecommendationCandidate({
			candidateScore: 8.5,
			candidateSeason: 'spring',
			candidateYear: 2024,
			referenceSeason: 'spring',
			referenceYear: 2024,
			sharedGenreCount: 3,
		})
		const weakerMatch = scoreAnimeRecommendationCandidate({
			candidateScore: 9.5,
			candidateSeason: 'fall',
			candidateYear: 2022,
			referenceSeason: 'spring',
			referenceYear: 2024,
			sharedGenreCount: 1,
		})

		expect(strongerMatch).toBeGreaterThan(weakerMatch)
	})
})
