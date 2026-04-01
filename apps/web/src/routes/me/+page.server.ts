import { normalizeRedirectTo } from '$lib/auth/redirects'
import { listTrackedAnime } from '$lib/server/checklists'
import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		throw redirect(
			303,
			`/auth/sign-in?redirectTo=${encodeURIComponent(normalizeRedirectTo(`${url.pathname}${url.search}`))}`
		)
	}

	return listTrackedAnime(locals.user.id)
}
