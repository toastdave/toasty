import { normalizeRedirectTo } from '$lib/auth/redirects'
import { getAnimeTournamentMatchupDetail, submitAnimeTournamentVote } from '$lib/server/tournaments'
import { error, fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, params }) => {
	const year = Number.parseInt(params.year, 10)

	if (!Number.isInteger(year)) {
		throw error(404, 'Matchup not found')
	}

	const matchup = await getAnimeTournamentMatchupDetail(year, params.matchupId, locals.user?.id)

	if (!matchup) {
		throw error(404, 'Matchup not found')
	}

	return {
		matchup,
	}
}

export const actions: Actions = {
	default: async ({ locals, params, request, url }) => {
		if (!locals.user) {
			throw redirect(
				303,
				`/auth/sign-in?redirectTo=${encodeURIComponent(normalizeRedirectTo(`${url.pathname}${url.search}`))}`
			)
		}

		const year = Number.parseInt(params.year, 10)

		if (!Number.isInteger(year)) {
			return fail(404, { message: 'Matchup not found.' })
		}

		const formData = await request.formData()
		const voteEntryId = formData.get('voteEntryId')

		if (typeof voteEntryId !== 'string' || voteEntryId.length === 0) {
			return fail(400, { message: 'Choose a title to vote for.' })
		}

		try {
			await submitAnimeTournamentVote(year, params.matchupId, locals.user.id, voteEntryId)
		} catch (cause) {
			console.error('Unable to submit tournament vote', cause)
			return fail(400, { message: 'This matchup cannot accept that vote right now.' })
		}

		throw redirect(303, url.pathname)
	},
}
