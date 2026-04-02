import { getHomeTrackedAnimeRecommendationShelf } from '$lib/server/recommendations'
import { getLandingAnimeCatalog } from '$lib/server/services/jikan/catalog'
import { getAnimeTournamentSeedingPreview } from '$lib/server/tournaments'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ fetch, locals }) => {
	const { currentSeason, topAnime } = await getLandingAnimeCatalog(fetch)
	const recommendationShelf = locals.user
		? await getHomeTrackedAnimeRecommendationShelf(locals.user.id)
		: null
	const tournamentPreview = await getAnimeTournamentSeedingPreview()

	return {
		airingNow: currentSeason.slice(0, 6),
		heroAnime: topAnime.slice(0, 6),
		recommendationShelf,
		tournamentPreview,
	}
}
