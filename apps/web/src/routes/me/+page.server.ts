import { normalizeRedirectTo } from '$lib/auth/redirects'
import { listUserActivity } from '$lib/server/activity'
import { listTrackedAnime } from '$lib/server/checklists'
import { listUserLists } from '$lib/server/lists'
import { ensureUserHandle } from '$lib/server/profiles'
import { getUserRatingSnapshot } from '$lib/server/ratings'
import { getHomeTrackedAnimeRecommendationShelf } from '$lib/server/recommendations'
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
	const [activity, lists, recommendationShelf, trackedAnime, ratingSnapshot] = await Promise.all([
		listUserActivity(locals.user.id),
		listUserLists(locals.user.id),
		getHomeTrackedAnimeRecommendationShelf(locals.user.id),
		listTrackedAnime(locals.user.id),
		getUserRatingSnapshot(locals.user.id),
	])

	return {
		activity,
		...trackedAnime,
		lists,
		publicHandle,
		publicProfilePath: buildProfilePath(publicHandle),
		recommendationShelf,
		ratingSnapshot,
	}
}
