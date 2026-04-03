import { getListBySlug } from '$lib/server/lists'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, params }) => {
	const list = await getListBySlug(params.slug, locals.user?.id)

	if (!list) {
		throw error(404, 'List not found')
	}

	return {
		list,
	}
}
