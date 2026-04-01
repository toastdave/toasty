import { describe, expect, it } from 'bun:test'
import { resolveChecklistDates } from './checklists'

describe('checklist transitions', () => {
	it('starts an in-progress entry when needed', () => {
		const now = new Date('2026-03-31T12:00:00.000Z')
		const result = resolveChecklistDates(null, 'in_progress', now)

		expect(result.startedAt).toEqual(now)
		expect(result.completedAt).toBeNull()
	})

	it('keeps the original start date when finishing a show', () => {
		const startedAt = new Date('2026-03-20T12:00:00.000Z')
		const completedAt = new Date('2026-03-31T12:00:00.000Z')
		const result = resolveChecklistDates({ completedAt: null, startedAt }, 'done', completedAt)

		expect(result.startedAt).toEqual(startedAt)
		expect(result.completedAt).toEqual(completedAt)
	})

	it('clears progress dates when moving back to planned', () => {
		const result = resolveChecklistDates(
			{
				completedAt: new Date('2026-03-31T12:00:00.000Z'),
				startedAt: new Date('2026-03-20T12:00:00.000Z'),
			},
			'planned',
			new Date('2026-04-01T12:00:00.000Z')
		)

		expect(result.startedAt).toBeNull()
		expect(result.completedAt).toBeNull()
	})
})
