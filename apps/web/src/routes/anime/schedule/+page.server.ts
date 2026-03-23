import { fetchSchedule } from '$lib/server/services/jikan'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ fetch }) => ({
	anime: await fetchSchedule(fetch),
})
