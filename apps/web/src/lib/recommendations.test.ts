import { describe, expect, it } from 'bun:test'
import {
	buildAnimeRecommendationReason,
	findAnimeRecommendationTasteMatches,
	scoreAnimeRecommendationCandidate,
} from './recommendations'

describe('recommendation helpers', () => {
	it('builds readable recommendation reasons from shared genres', () => {
		expect(buildAnimeRecommendationReason({ sharedGenres: ['Action', 'Fantasy', 'Fantasy'] })).toBe(
			'Shared Action + Fantasy energy'
		)
		expect(buildAnimeRecommendationReason({ sharedGenres: ['Romance'] })).toBe('Shared Romance DNA')
	})

	it('prefers taste-tag language when a candidate matches user flavor lanes', () => {
		expect(
			buildAnimeRecommendationReason({
				matchedTasteTags: ['Spectacle', 'Tension'],
				sharedGenres: ['Fantasy', 'Mystery'],
			})
		).toBe('Matches your Spectacle + Tension taste')
	})

	it('maps dominant taste tags onto candidate genres', () => {
		expect(
			findAnimeRecommendationTasteMatches(['Spectacle', 'Comedy'], ['Fantasy', 'Drama'])
		).toEqual(['Spectacle'])
	})

	it('favors overlap first and then metadata affinity', () => {
		const strongerMatch = scoreAnimeRecommendationCandidate({
			candidateScore: 8.5,
			candidateSeason: 'spring',
			candidateYear: 2024,
			matchedTasteCount: 2,
			referenceRecommendationStrength: 9,
			referenceSeason: 'spring',
			referenceYear: 2024,
			sharedGenreCount: 3,
		})
		const weakerMatch = scoreAnimeRecommendationCandidate({
			candidateScore: 9.5,
			candidateSeason: 'fall',
			candidateYear: 2022,
			matchedTasteCount: 0,
			referenceRecommendationStrength: 9,
			referenceSeason: 'spring',
			referenceYear: 2024,
			sharedGenreCount: 1,
		})

		expect(strongerMatch).toBeGreaterThan(weakerMatch)
	})
})
