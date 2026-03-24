import { getTopAnimeCatalog } from '$lib/server/services/jikan/catalog'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ fetch }) => ({
	anime: await getTopAnimeCatalog(fetch),
})
