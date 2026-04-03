import { normalizeRedirectTo } from '$lib/auth/redirects'
import { getProfileSettings, updateUserProfile } from '$lib/server/profiles'
import { buildProfilePath } from '$lib/utils/profiles'
import { fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

function normalizeOptionalUrl(value: string) {
	if (!value) {
		return null
	}

	try {
		const parsed = new URL(value)
		return ['http:', 'https:'].includes(parsed.protocol) ? parsed.toString() : null
	} catch {
		return null
	}
}

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		throw redirect(
			303,
			`/auth/sign-in?redirectTo=${encodeURIComponent(normalizeRedirectTo(`${url.pathname}${url.search}`))}`
		)
	}

	const profile = await getProfileSettings(locals.user.id)

	if (!profile) {
		throw redirect(303, '/me')
	}

	return {
		profile,
		publicProfilePath: profile.handle ? buildProfilePath(profile.handle) : null,
	}
}

export const actions: Actions = {
	default: async ({ locals, request }) => {
		if (!locals.user) {
			return fail(401, { message: 'Sign in to update your profile.' })
		}

		const formData = await request.formData()
		const name = String(formData.get('name') ?? '').trim()
		const handle = String(formData.get('handle') ?? '').trim()
		const bioRaw = String(formData.get('bio') ?? '').trim()
		const imageRaw = String(formData.get('image') ?? '').trim()

		if (name.length < 2) {
			return fail(400, { message: 'Name should be at least 2 characters.' })
		}

		if (handle.length < 2) {
			return fail(400, { message: 'Choose a handle with at least 2 characters.' })
		}

		if (bioRaw.length > 280) {
			return fail(400, { message: 'Bio should stay within 280 characters.' })
		}

		if (imageRaw.length > 0 && !normalizeOptionalUrl(imageRaw)) {
			return fail(400, { message: 'Avatar URL must be a valid http or https address.' })
		}

		try {
			const nextHandle = await updateUserProfile({
				bio: bioRaw || null,
				handle,
				image: normalizeOptionalUrl(imageRaw),
				name,
				userId: locals.user.id,
			})

			throw redirect(303, buildProfilePath(nextHandle))
		} catch (error) {
			console.error('Unable to update profile', error)
			return fail(400, {
				message: 'That handle is unavailable or the profile could not be updated.',
			})
		}
	},
}
