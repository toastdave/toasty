import { getAnimeTournamentBracket } from '$lib/server/tournaments'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params }) => {
	const year = Number.parseInt(params.year, 10)

	if (!Number.isInteger(year)) {
		throw error(404, 'Bracket not found')
	}

	const bracket = await getAnimeTournamentBracket(year)

	if (!bracket || bracket.year !== year) {
		throw error(404, 'Bracket not found')
	}

	return {
		bracket,
	}
}
