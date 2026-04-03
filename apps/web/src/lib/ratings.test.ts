import { describe, expect, it } from 'bun:test'
import {
	computeOverallRating,
	extractDominantFlavorTags,
	hasCompletedCoreAxes,
	summarizeAnimeRatingDraft,
} from './ratings'

describe('rating helpers', () => {
	it('computes an overall score from weighted core axes only', () => {
		const overall = computeOverallRating({
			action: 10,
			emotional_impact: 9,
			fun: 8,
			originality: 7,
			quality: 9,
			recommendation_strength: 8,
			revisit_pull: 6,
		})

		expect(overall).toBeGreaterThan(7.5)
		expect(overall).toBeLessThan(9.5)
	})

	it('extracts the strongest flavor tags', () => {
		expect(
			extractDominantFlavorTags({
				action: 9,
				comedy: 6,
				romance: 8,
				spectacle: 10,
				tension: 7,
			})
		).toEqual(['Spectacle', 'Action', 'Romance'])
	})

	it('detects when a draft has all required core axes', () => {
		expect(
			hasCompletedCoreAxes({
				emotional_impact: 8,
				fun: 8,
				originality: 7,
				quality: 9,
				recommendation_strength: 8,
				revisit_pull: 7,
			})
		).toBe(true)

		expect(
			hasCompletedCoreAxes({
				emotional_impact: 8,
				fun: 8,
				quality: 9,
				recommendation_strength: 8,
				revisit_pull: 7,
			})
		).toBe(false)
	})

	it('keeps partial drafts out of the public overall score', () => {
		expect(
			summarizeAnimeRatingDraft({
				action: 8,
				fun: 8,
				quality: 9,
				spectacle: 9,
			})
		).toEqual({
			coreCompleteCount: 2,
			coreTotalCount: 6,
			isComplete: false,
			overallScore: null,
			tags: ['Spectacle', 'Action'],
		})
	})
})
