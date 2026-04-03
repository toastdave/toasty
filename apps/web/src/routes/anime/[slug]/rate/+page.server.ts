import { normalizeRedirectTo } from '$lib/auth/redirects'
import { getAnimeUserRating, listAnimeRatingAxes, saveAnimeUserRating } from '$lib/server/ratings'
import { getAnimeDetailCatalog } from '$lib/server/services/jikan/catalog'
import { buildAnimeSlug, extractAnimeId } from '$lib/utils/anime'
import { error, fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ fetch, locals, params, url }) => {
	if (!locals.user) {
		throw redirect(
			303,
			`/auth/sign-in?redirectTo=${encodeURIComponent(normalizeRedirectTo(`${url.pathname}${url.search}`))}`
		)
	}

	const animeId = extractAnimeId(params.slug)

	if (!animeId) {
		throw error(404, 'Anime not found')
	}

	const anime = await getAnimeDetailCatalog(animeId, fetch)
	const canonicalSlug = buildAnimeSlug(anime.title, anime.id)

	if (params.slug !== canonicalSlug) {
		throw redirect(308, `/anime/${canonicalSlug}/rate`)
	}

	const [axes, userRating] = await Promise.all([
		listAnimeRatingAxes(),
		getAnimeUserRating(locals.user.id, animeId),
	])

	return {
		anime,
		axes,
		userRating,
	}
}

export const actions: Actions = {
	default: async ({ fetch, locals, params, request }) => {
		if (!locals.user) {
			return fail(401, { message: 'Sign in to rate this anime.' })
		}

		const animeId = extractAnimeId(params.slug)

		if (!animeId) {
			return fail(404, { message: 'Anime not found.' })
		}

		const axes = await listAnimeRatingAxes()
		const formData = await request.formData()
		const intent = String(formData.get('intent') ?? 'save_rating')
		const scores: Record<string, number> = {}

		for (const axis of axes) {
			const rawValue = formData.get(axis.key)

			if (typeof rawValue !== 'string' || rawValue.length === 0) {
				continue
			}

			const parsed = Number(rawValue)

			if (!Number.isInteger(parsed) || parsed < axis.minValue || parsed > axis.maxValue) {
				return fail(400, { message: `Choose a valid score for ${axis.label}.` })
			}

			scores[axis.key] = parsed
		}

		const missingCoreAxes = axes.filter(
			(axis) => axis.group === 'core' && typeof scores[axis.key] !== 'number'
		)

		if (intent !== 'save_draft' && missingCoreAxes.length > 0) {
			return fail(400, { message: 'Fill out every core rating dimension before saving.' })
		}

		const reviewTextRaw = formData.get('reviewText')
		const reviewText =
			typeof reviewTextRaw === 'string' && reviewTextRaw.trim().length > 0
				? reviewTextRaw.trim()
				: null

		try {
			const summary = await saveAnimeUserRating(locals.user.id, animeId, scores, reviewText, fetch)

			if (intent === 'save_draft') {
				return {
					message: summary.isComplete
						? 'Draft saved. All core dimensions are in place, so this now counts as a full Toasty rating.'
						: `Draft saved. ${summary.coreCompleteCount} of ${summary.coreTotalCount} core dimensions are filled.`,
					success: true,
				}
			}
		} catch (cause) {
			console.error('Unable to save anime rating', cause)
			return fail(500, { message: 'Unable to save this rating right now.' })
		}

		throw redirect(303, `/anime/${params.slug}`)
	},
}
