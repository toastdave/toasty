import { fetchSchedule, fetchTopAnime } from '$lib/server/services/jikan'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ fetch }) => {
	const [topAnime, schedule] = await Promise.all([fetchTopAnime(fetch), fetchSchedule(fetch)])

	return {
		heroAnime: topAnime.slice(0, 6),
		airingNow: schedule.slice(0, 6),
	}
}
