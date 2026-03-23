import { describe, expect, it } from 'bun:test'
import { mediaItems, ratingRubrics, user } from './index'

describe('schema exports', () => {
	it('exposes auth, media, and rating tables', () => {
		expect(user).toBeDefined()
		expect(mediaItems).toBeDefined()
		expect(ratingRubrics).toBeDefined()
	})
})
