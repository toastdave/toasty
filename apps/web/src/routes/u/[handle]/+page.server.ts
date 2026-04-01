import { getPublicProfileByHandle } from '$lib/server/profiles'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params }) => {
	const profile = await getPublicProfileByHandle(params.handle)

	if (!profile) {
		throw error(404, 'Profile not found')
	}

	return {
		profile,
	}
}
