import { normalizeRedirectTo } from '$lib/auth/redirects'
import { listTrackedAnime } from '$lib/server/checklists'
import { ensureUserHandle } from '$lib/server/profiles'
import { getUserRatingSnapshot } from '$lib/server/ratings'
import { buildProfilePath } from '$lib/utils/profiles'
import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		throw redirect(
			303,
			`/auth/sign-in?redirectTo=${encodeURIComponent(normalizeRedirectTo(`${url.pathname}${url.search}`))}`
		)
	}

	const publicHandle = await ensureUserHandle(locals.user.id, locals.user.name)
	const [trackedAnime, ratingSnapshot] = await Promise.all([
		listTrackedAnime(locals.user.id),
		getUserRatingSnapshot(locals.user.id),
	])

	return {
		...trackedAnime,
		publicHandle,
		publicProfilePath: buildProfilePath(publicHandle),
		ratingSnapshot,
	}
}
