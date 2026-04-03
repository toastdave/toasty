import {
	deleteUserList,
	getListBySlug,
	moveAnimeWithinUserList,
	removeAnimeFromUserList,
	updateListItemNote,
	updateUserList,
} from '$lib/server/lists'
import { error, fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, params }) => {
	const list = await getListBySlug(params.slug, locals.user?.id)

	if (!list) {
		throw error(404, 'List not found')
	}

	return {
		list,
	}
}

export const actions: Actions = {
	delete: async ({ locals, request }) => {
		if (!locals.user) {
			return fail(401, { message: 'Sign in to manage this list.' })
		}

		const formData = await request.formData()
		const listId = String(formData.get('listId') ?? '')

		if (!listId) {
			return fail(400, { message: 'List not found.' })
		}

		try {
			await deleteUserList({ listId, userId: locals.user.id })
		} catch (cause) {
			console.error('Unable to delete list', cause)
			return fail(400, { message: 'Unable to delete this list right now.' })
		}

		throw redirect(303, '/lists')
	},
	move: async ({ locals, request }) => {
		if (!locals.user) {
			return fail(401, { message: 'Sign in to manage this list.' })
		}

		const formData = await request.formData()
		const direction = String(formData.get('direction') ?? '')
		const itemId = String(formData.get('itemId') ?? '')
		const listId = String(formData.get('listId') ?? '')

		if (!itemId || !listId || !['up', 'down'].includes(direction)) {
			return fail(400, { message: 'Choose a valid list item move.' })
		}

		try {
			await moveAnimeWithinUserList({
				direction: direction as 'down' | 'up',
				itemId,
				listId,
				userId: locals.user.id,
			})
		} catch (cause) {
			console.error('Unable to reorder list item', cause)
			return fail(400, { message: 'Unable to reorder this list right now.' })
		}

		return { message: 'List order updated.', success: true }
	},
	remove: async ({ locals, request }) => {
		if (!locals.user) {
			return fail(401, { message: 'Sign in to manage this list.' })
		}

		const formData = await request.formData()
		const itemId = String(formData.get('itemId') ?? '')
		const listId = String(formData.get('listId') ?? '')

		if (!itemId || !listId) {
			return fail(400, { message: 'Choose a valid list item.' })
		}

		try {
			await removeAnimeFromUserList({ itemId, listId, userId: locals.user.id })
		} catch (cause) {
			console.error('Unable to remove list item', cause)
			return fail(400, { message: 'Unable to remove that title right now.' })
		}

		return { message: 'Title removed from the list.', success: true }
	},
	update: async ({ locals, request }) => {
		if (!locals.user) {
			return fail(401, { message: 'Sign in to manage this list.' })
		}

		const formData = await request.formData()
		const descriptionRaw = String(formData.get('description') ?? '').trim()
		const listId = String(formData.get('listId') ?? '')
		const title = String(formData.get('title') ?? '').trim()
		const visibilityValue = String(formData.get('visibility') ?? 'public')

		if (!listId || title.length < 3) {
			return fail(400, { message: 'List title should be at least 3 characters.' })
		}

		if (descriptionRaw.length > 500) {
			return fail(400, { message: 'List descriptions should stay within 500 characters.' })
		}

		if (!['public', 'unlisted', 'private'].includes(visibilityValue)) {
			return fail(400, { message: 'Choose a valid list visibility.' })
		}

		try {
			await updateUserList({
				description: descriptionRaw || null,
				listId,
				title,
				userId: locals.user.id,
				visibility: visibilityValue as 'private' | 'public' | 'unlisted',
			})
		} catch (cause) {
			console.error('Unable to update list', cause)
			return fail(400, { message: 'Unable to update this list right now.' })
		}

		return { message: 'List details updated.', success: true }
	},
	updateNote: async ({ locals, request }) => {
		if (!locals.user) {
			return fail(401, { message: 'Sign in to manage this list.' })
		}

		const formData = await request.formData()
		const itemId = String(formData.get('itemId') ?? '')
		const listId = String(formData.get('listId') ?? '')
		const noteRaw = String(formData.get('note') ?? '').trim()

		if (!itemId || !listId) {
			return fail(400, { message: 'Choose a valid list item.' })
		}

		if (noteRaw.length > 280) {
			return fail(400, { message: 'List notes should stay within 280 characters.' })
		}

		try {
			await updateListItemNote({
				itemId,
				listId,
				note: noteRaw || null,
				userId: locals.user.id,
			})
		} catch (cause) {
			console.error('Unable to update list note', cause)
			return fail(400, { message: 'Unable to save that note right now.' })
		}

		return { message: 'List note updated.', success: true }
	},
}
