import { listAnimeTournamentArchives } from '$lib/server/tournaments'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async () => ({
	archives: await listAnimeTournamentArchives(),
})
