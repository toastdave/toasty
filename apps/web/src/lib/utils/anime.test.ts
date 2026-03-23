import { describe, expect, it } from 'bun:test'
import { buildAnimeSlug, extractAnimeId, slugifyAnimeTitle } from './anime'

describe('anime slug helpers', () => {
	it('slugifies titles', () => {
		expect(slugifyAnimeTitle("Frieren: Beyond Journey's End")).toBe('frieren-beyond-journey-s-end')
	})

	it('builds and extracts ids', () => {
		const slug = buildAnimeSlug('Cowboy Bebop', 1)
		expect(slug).toBe('cowboy-bebop-1')
		expect(extractAnimeId(slug)).toBe(1)
	})
})
