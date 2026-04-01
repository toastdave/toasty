import { listTrackedAnime } from '$lib/server/checklists'
import { db } from '$lib/server/db'
import { buildProfilePath, slugifyProfileHandle } from '$lib/utils/profiles'
import { user } from '@toasty/db/schema'
import { eq } from 'drizzle-orm'

export type PublicProfile = Awaited<ReturnType<typeof getPublicProfileByHandle>>

async function getExistingHandle(handle: string) {
	const [existingUser] = await db
		.select({ id: user.id })
		.from(user)
		.where(eq(user.handle, handle))
		.limit(1)

	return existingUser ?? null
}

export async function ensureUserHandle(userId: string, displayName: string) {
	const [existingUser] = await db
		.select({ handle: user.handle, name: user.name })
		.from(user)
		.where(eq(user.id, userId))
		.limit(1)

	if (!existingUser) {
		throw new Error('User not found while ensuring public handle')
	}

	if (existingUser.handle) {
		return existingUser.handle
	}

	const baseHandle = slugifyProfileHandle(displayName || existingUser.name)
	let nextHandle = baseHandle
	let suffix = 2

	while (await getExistingHandle(nextHandle)) {
		nextHandle = `${baseHandle}-${suffix}`
		suffix += 1
	}

	await db
		.update(user)
		.set({
			handle: nextHandle,
			updatedAt: new Date(),
		})
		.where(eq(user.id, userId))

	return nextHandle
}

export async function getPublicProfileByHandle(handle: string) {
	const [profileUser] = await db
		.select({
			bio: user.bio,
			createdAt: user.createdAt,
			handle: user.handle,
			id: user.id,
			image: user.image,
			name: user.name,
		})
		.from(user)
		.where(eq(user.handle, handle))
		.limit(1)

	if (!profileUser?.handle) {
		return null
	}

	const trackedAnime = await listTrackedAnime(profileUser.id)

	return {
		bio: profileUser.bio,
		createdAt: profileUser.createdAt,
		handle: profileUser.handle,
		image: profileUser.image,
		name: profileUser.name,
		profilePath: buildProfilePath(profileUser.handle),
		sections: trackedAnime.sections,
		total: trackedAnime.total,
	}
}
