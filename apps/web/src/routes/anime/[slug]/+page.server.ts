import { getAnimeDetailCatalog } from '$lib/server/services/jikan/catalog'
import { extractAnimeId } from '$lib/utils/anime'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, fetch }) => {
	const animeId = extractAnimeId(params.slug)

	if (!animeId) {
		throw error(404, 'Anime not found')
	}

	return {
		anime: await getAnimeDetailCatalog(animeId, fetch),
	}
}
