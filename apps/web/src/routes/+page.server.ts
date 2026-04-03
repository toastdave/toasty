import { getDiscoveryShelves } from '$lib/server/discovery'
import { ensureOfficialAnimeLists, listPublicLists } from '$lib/server/lists'
import { getHomeTrackedAnimeRecommendationShelf } from '$lib/server/recommendations'
import { getLandingAnimeCatalog } from '$lib/server/services/jikan/catalog'
import { getAnimeTournamentSeedingPreview } from '$lib/server/tournaments'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ fetch, locals }) => {
	const { currentSeason, topAnime } = await getLandingAnimeCatalog(fetch)
	const [discoveryShelves, featuredLists, recommendationShelf, tournamentPreview] =
		await Promise.all([
			getDiscoveryShelves({ currentSeason, topAnime }),
			(async () => {
				try {
					await ensureOfficialAnimeLists(fetch)
				} catch (error) {
					console.error('Unable to refresh official lists', error)
				}

				return listPublicLists(3)
			})(),
			locals.user ? getHomeTrackedAnimeRecommendationShelf(locals.user.id) : null,
			getAnimeTournamentSeedingPreview(),
		])

	return {
		airingNow: currentSeason.slice(0, 6),
		discoveryShelves,
		featuredLists,
		heroAnime: topAnime.slice(0, 6),
		recommendationShelf,
		tournamentPreview,
	}
}
