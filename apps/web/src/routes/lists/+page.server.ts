import {
	createUserList,
	ensureOfficialAnimeLists,
	listPublicLists,
	listUserLists,
} from '$lib/server/lists'
import { fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ fetch, locals }) => {
	try {
		await ensureOfficialAnimeLists(fetch)
	} catch (error) {
		console.error('Unable to refresh official lists', error)
	}

	const [publicLists, userLists] = await Promise.all([
		listPublicLists(),
		locals.user ? listUserLists(locals.user.id) : [],
	])

	return {
		publicLists,
		userLists,
	}
}

export const actions: Actions = {
	create: async ({ locals, request }) => {
		if (!locals.user) {
			return fail(401, { message: 'Sign in to create a list.' })
		}

		const formData = await request.formData()
		const title = String(formData.get('title') ?? '').trim()
		const descriptionRaw = String(formData.get('description') ?? '').trim()
		const visibilityValue = String(formData.get('visibility') ?? 'public')

		if (title.length < 3) {
			return fail(400, { message: 'List title should be at least 3 characters.' })
		}

		if (descriptionRaw.length > 500) {
			return fail(400, { message: 'List descriptions should stay within 500 characters.' })
		}

		if (!['public', 'unlisted', 'private'].includes(visibilityValue)) {
			return fail(400, { message: 'Choose a valid list visibility.' })
		}

		try {
			await createUserList({
				description: descriptionRaw || null,
				title,
				userId: locals.user.id,
				visibility: visibilityValue as 'private' | 'public' | 'unlisted',
			})
		} catch (error) {
			console.error('Unable to create list', error)
			return fail(400, { message: 'Unable to create that list right now.' })
		}

		return { success: true }
	},
}
