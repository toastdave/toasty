import { getAnimeTournamentSeedingPreview } from '$lib/server/tournaments'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params }) => {
	const year = Number.parseInt(params.year, 10)

	if (!Number.isInteger(year)) {
		throw error(404, 'Tournament not found')
	}

	const tournament = await getAnimeTournamentSeedingPreview(year)

	if (!tournament || tournament.year !== year) {
		throw error(404, 'Tournament not found')
	}

	return {
		tournament,
	}
}
