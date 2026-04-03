import { listUserActivity } from '$lib/server/activity'
import { listTrackedAnime } from '$lib/server/checklists'
import { db } from '$lib/server/db'
import { listPublicListsByUser } from '$lib/server/lists'
import { getUserRatingSnapshot } from '$lib/server/ratings'
import { getHomeTrackedAnimeRecommendationShelf } from '$lib/server/recommendations'
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

export async function getProfileSettings(userId: string) {
	const [profileUser] = await db
		.select({
			bio: user.bio,
			handle: user.handle,
			id: user.id,
			image: user.image,
			name: user.name,
		})
		.from(user)
		.where(eq(user.id, userId))
		.limit(1)

	return profileUser ?? null
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

export async function updateUserProfile(params: {
	bio: string | null
	handle: string
	image: string | null
	name: string
	userId: string
}) {
	const nextHandle = slugifyProfileHandle(params.handle)
	const existingHandle = await getExistingHandle(nextHandle)

	if (existingHandle && existingHandle.id !== params.userId) {
		throw new Error('Handle is already taken')
	}

	await db
		.update(user)
		.set({
			bio: params.bio,
			handle: nextHandle,
			image: params.image,
			name: params.name,
			updatedAt: new Date(),
		})
		.where(eq(user.id, params.userId))

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

	const [activity, publicLists, recommendationShelf, trackedAnime, ratingSnapshot] =
		await Promise.all([
			listUserActivity(profileUser.id),
			listPublicListsByUser(profileUser.id),
			getHomeTrackedAnimeRecommendationShelf(profileUser.id),
			listTrackedAnime(profileUser.id),
			getUserRatingSnapshot(profileUser.id),
		])

	return {
		activity,
		bio: profileUser.bio,
		createdAt: profileUser.createdAt,
		handle: profileUser.handle,
		image: profileUser.image,
		lists: publicLists,
		name: profileUser.name,
		profilePath: buildProfilePath(profileUser.handle),
		recommendationShelf,
		ratingSnapshot,
		sections: trackedAnime.sections,
		total: trackedAnime.total,
	}
}
