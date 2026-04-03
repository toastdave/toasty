import { normalizeRedirectTo } from '$lib/auth/redirects'
import { isChecklistStatus } from '$lib/checklists'
import {
	ensureAnimeMediaItemId,
	getAnimeChecklistEntry,
	removeAnimeChecklistEntry,
	saveAnimeChecklistEntry,
} from '$lib/server/checklists'
import { addAnimeToUserList, listUserListOptions } from '$lib/server/lists'
import { getAnimeCommunityRatingSummary, getAnimeUserRating } from '$lib/server/ratings'
import { getAnimeDetailRecommendationShelf } from '$lib/server/recommendations'
import { getAnimeDetailCatalog } from '$lib/server/services/jikan/catalog'
import { buildAnimeSlug } from '$lib/utils/anime'
import { extractAnimeId } from '$lib/utils/anime'
import { error, fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, params, fetch }) => {
	const animeId = extractAnimeId(params.slug)

	if (!animeId) {
		throw error(404, 'Anime not found')
	}

	const anime = await getAnimeDetailCatalog(animeId, fetch)
	const canonicalSlug = buildAnimeSlug(anime.title, anime.id)

	if (params.slug !== canonicalSlug) {
		throw redirect(308, `/anime/${canonicalSlug}`)
	}

	const [checklistEntry, communityRating, recommendationShelf, userLists, userRating] =
		await Promise.all([
			locals.user ? getAnimeChecklistEntry(locals.user.id, animeId) : null,
			getAnimeCommunityRatingSummary(animeId),
			getAnimeDetailRecommendationShelf(animeId, locals.user?.id),
			locals.user ? listUserListOptions(locals.user.id) : [],
			locals.user ? getAnimeUserRating(locals.user.id, animeId) : null,
		])

	return {
		anime,
		checklistEntry,
		communityRating,
		recommendationShelf,
		userLists,
		userRating,
	}
}

export const actions: Actions = {
	default: async ({ fetch, locals, params, request, url }) => {
		if (!locals.user) {
			throw redirect(
				303,
				`/auth/sign-in?redirectTo=${encodeURIComponent(normalizeRedirectTo(`${url.pathname}${url.search}`))}`
			)
		}

		const animeId = extractAnimeId(params.slug)

		if (!animeId) {
			return fail(404, { message: 'Anime not found.' })
		}

		const formData = await request.formData()
		const intent = formData.get('intent')

		let mediaItemId: string

		try {
			mediaItemId = await ensureAnimeMediaItemId(animeId, fetch)
		} catch (cause) {
			console.error('Unable to prepare anime checklist entry', cause)
			return fail(503, {
				message: 'Checklist tracking is unavailable right now. Try again in a moment.',
			})
		}

		if (intent === 'clear') {
			await removeAnimeChecklistEntry(locals.user.id, mediaItemId)
			throw redirect(303, url.pathname)
		}

		if (intent === 'add_to_list') {
			const listId = formData.get('listId')
			const note = formData.get('note')

			if (typeof listId !== 'string' || listId.length === 0) {
				return fail(400, { message: 'Choose one of your lists first.' })
			}

			try {
				await addAnimeToUserList({
					listId,
					mediaItemId,
					note: typeof note === 'string' && note.trim().length > 0 ? note.trim() : null,
					userId: locals.user.id,
				})
			} catch (cause) {
				console.error('Unable to save anime to list', cause)
				return fail(400, { message: 'Unable to save this anime to that list right now.' })
			}

			throw redirect(303, url.pathname)
		}

		const status = formData.get('status')

		if (!isChecklistStatus(status)) {
			return fail(400, { message: 'Choose a valid checklist state.' })
		}

		await saveAnimeChecklistEntry(locals.user.id, mediaItemId, status)
		throw redirect(303, url.pathname)
	},
}
