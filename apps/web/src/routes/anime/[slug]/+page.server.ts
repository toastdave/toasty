import { getAnimeDetailCatalog } from '$lib/server/services/jikan/catalog'
import { buildAnimeSlug } from '$lib/utils/anime'
import { extractAnimeId } from '$lib/utils/anime'
import { error, redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, fetch }) => {
	const animeId = extractAnimeId(params.slug)

	if (!animeId) {
		throw error(404, 'Anime not found')
	}

	const anime = await getAnimeDetailCatalog(animeId, fetch)
	const canonicalSlug = buildAnimeSlug(anime.title, anime.id)

	if (params.slug !== canonicalSlug) {
		throw redirect(308, `/anime/${canonicalSlug}`)
	}

	return {
		anime,
	}
}
