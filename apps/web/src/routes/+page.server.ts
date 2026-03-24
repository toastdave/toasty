import { getLandingAnimeCatalog } from '$lib/server/services/jikan/catalog'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ fetch }) => {
	const { currentSeason, topAnime } = await getLandingAnimeCatalog(fetch)

	return {
		airingNow: currentSeason.slice(0, 6),
		heroAnime: topAnime.slice(0, 6),
	}
}
