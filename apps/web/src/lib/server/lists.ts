import { recordCreatedListActivity } from '$lib/server/activity'
import { ensureAnimeMediaItemId } from '$lib/server/checklists'
import { db } from '$lib/server/db'
import { getLandingAnimeCatalog } from '$lib/server/services/jikan/catalog'
import { animeDetails, listItems, lists, mediaItems, user } from '@toasty/db/schema'
import { and, asc, desc, eq, inArray, or, sql } from 'drizzle-orm'

type ListVisibility = 'private' | 'public' | 'unlisted'

const OFFICIAL_LISTS = [
	{
		description:
			'A first Toasty shelf built from enduring chart anchors that are still useful onboarding picks.',
		slug: 'toasty-starter-pack',
		title: 'Toasty Starter Pack',
		type: 'top' as const,
	},
	{
		description:
			'A rolling edit of the current anime season so the airing board feels like a shareable collection.',
		slug: 'current-season-pulse',
		title: 'Current Season Pulse',
		type: 'season' as const,
	},
]

export type ListCard = {
	coverItems: Array<{
		posterUrl: string | null
		slug: string
		title: string
	}>
	description: string | null
	id: string
	isOfficial: boolean
	itemCount: number
	ownerHandle: string | null
	ownerName: string | null
	slug: string
	title: string
	updatedAt: Date
	visibility: ListVisibility
}

export type UserListOption = {
	id: string
	itemCount: number
	slug: string
	title: string
	visibility: ListVisibility
}

export type ListDetail = {
	description: string | null
	id: string
	items: Array<{
		note: string | null
		position: number
		posterUrl: string | null
		score: number | null
		slug: string
		title: string
		year: number | null
	}>
	isOfficial: boolean
	ownerHandle: string | null
	ownerName: string | null
	slug: string
	title: string
	updatedAt: Date
	visibility: ListVisibility
}

function buildListSlug(value: string) {
	const normalized = value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 48)

	return normalized || 'watch-list'
}

function toNullableNumber(value: unknown) {
	if (typeof value === 'number') {
		return Number.isFinite(value) ? value : null
	}

	if (typeof value === 'string' && value.length > 0) {
		const parsed = Number(value)
		return Number.isFinite(parsed) ? parsed : null
	}

	return null
}

async function getExistingListSlug(slug: string) {
	const [existingList] = await db
		.select({ id: lists.id })
		.from(lists)
		.where(eq(lists.slug, slug))
		.limit(1)

	return existingList ?? null
}

async function getUniqueListSlug(baseSlug: string) {
	let nextSlug = baseSlug
	let suffix = 2

	while (await getExistingListSlug(nextSlug)) {
		nextSlug = `${baseSlug}-${suffix}`.slice(0, 48)
		suffix += 1
	}

	return nextSlug
}

async function listCoverItemsByListId(listIds: string[]) {
	if (listIds.length === 0) {
		return new Map<string, ListCard['coverItems']>()
	}

	const rows = await db
		.select({
			listId: listItems.listId,
			posterUrl: mediaItems.imageUrlPoster,
			slug: mediaItems.slug,
			title: mediaItems.title,
		})
		.from(listItems)
		.innerJoin(mediaItems, eq(mediaItems.id, listItems.mediaItemId))
		.where(inArray(listItems.listId, listIds))
		.orderBy(asc(listItems.position), asc(mediaItems.title))

	const coverMap = new Map<string, ListCard['coverItems']>()

	for (const row of rows) {
		if (!row.slug) {
			continue
		}

		const currentItems = coverMap.get(row.listId) ?? []

		if (currentItems.length >= 3) {
			continue
		}

		currentItems.push({ posterUrl: row.posterUrl, slug: row.slug, title: row.title })
		coverMap.set(row.listId, currentItems)
	}

	return coverMap
}

async function mapRowsToListCards(
	rows: Array<{
		description: string | null
		id: string
		isOfficial: boolean
		itemCount: number
		ownerHandle: string | null
		ownerName: string | null
		slug: string
		title: string
		updatedAt: Date
		visibility: ListVisibility
	}>
) {
	const coverMap = await listCoverItemsByListId(rows.map((row) => row.id))

	return rows.map((row) => ({
		coverItems: coverMap.get(row.id) ?? [],
		...row,
	})) satisfies ListCard[]
}

export async function ensureOfficialAnimeLists(fetcher: typeof fetch) {
	const { currentSeason: seasonAnime, topAnime } = await getLandingAnimeCatalog(fetcher)

	for (const config of OFFICIAL_LISTS) {
		const sourceItems = (config.type === 'season' ? seasonAnime : topAnime).slice(0, 8)
		const [existingList] = await db
			.select({ id: lists.id })
			.from(lists)
			.where(eq(lists.slug, config.slug))
			.limit(1)

		const listId = existingList
			? existingList.id
			: (
					await db
						.insert(lists)
						.values({
							description: config.description,
							isOfficial: true,
							mediaType: 'anime',
							slug: config.slug,
							title: config.title,
							visibility: 'public',
						})
						.returning({ id: lists.id })
				)[0].id

		await db
			.update(lists)
			.set({
				description: config.description,
				isOfficial: true,
				mediaType: 'anime',
				title: config.title,
				updatedAt: new Date(),
				visibility: 'public',
			})
			.where(eq(lists.id, listId))

		const mediaItemIds = [] as string[]

		for (const anime of sourceItems) {
			mediaItemIds.push(await ensureAnimeMediaItemId(anime.id, fetcher))
		}

		await db.delete(listItems).where(eq(listItems.listId, listId))

		if (mediaItemIds.length > 0) {
			await db.insert(listItems).values(
				mediaItemIds.map((mediaItemId, index) => ({
					listId,
					mediaItemId,
					position: index + 1,
				}))
			)
		}
	}
}

export async function listPublicLists(limit = 12) {
	const rows = await db
		.select({
			description: lists.description,
			id: lists.id,
			isOfficial: lists.isOfficial,
			itemCount: sql<number>`count(${listItems.id})`,
			ownerHandle: user.handle,
			ownerName: user.name,
			slug: lists.slug,
			title: lists.title,
			updatedAt: lists.updatedAt,
			visibility: lists.visibility,
		})
		.from(lists)
		.leftJoin(listItems, eq(listItems.listId, lists.id))
		.leftJoin(user, eq(user.id, lists.ownerUserId))
		.where(or(eq(lists.visibility, 'public'), eq(lists.isOfficial, true)))
		.groupBy(lists.id, user.handle, user.name)
		.orderBy(desc(lists.isOfficial), desc(lists.updatedAt), asc(lists.title))
		.limit(limit)

	return mapRowsToListCards(rows)
}

export async function listUserLists(userId: string) {
	const rows = await db
		.select({
			description: lists.description,
			id: lists.id,
			isOfficial: lists.isOfficial,
			itemCount: sql<number>`count(${listItems.id})`,
			ownerHandle: user.handle,
			ownerName: user.name,
			slug: lists.slug,
			title: lists.title,
			updatedAt: lists.updatedAt,
			visibility: lists.visibility,
		})
		.from(lists)
		.leftJoin(listItems, eq(listItems.listId, lists.id))
		.leftJoin(user, eq(user.id, lists.ownerUserId))
		.where(eq(lists.ownerUserId, userId))
		.groupBy(lists.id, user.handle, user.name)
		.orderBy(desc(lists.updatedAt), asc(lists.title))

	return mapRowsToListCards(rows)
}

export async function listPublicListsByUser(userId: string, limit = 6) {
	const rows = await db
		.select({
			description: lists.description,
			id: lists.id,
			isOfficial: lists.isOfficial,
			itemCount: sql<number>`count(${listItems.id})`,
			ownerHandle: user.handle,
			ownerName: user.name,
			slug: lists.slug,
			title: lists.title,
			updatedAt: lists.updatedAt,
			visibility: lists.visibility,
		})
		.from(lists)
		.leftJoin(listItems, eq(listItems.listId, lists.id))
		.leftJoin(user, eq(user.id, lists.ownerUserId))
		.where(and(eq(lists.ownerUserId, userId), eq(lists.visibility, 'public')))
		.groupBy(lists.id, user.handle, user.name)
		.orderBy(desc(lists.updatedAt), asc(lists.title))
		.limit(limit)

	return mapRowsToListCards(rows)
}

export async function listUserListOptions(userId: string) {
	const rows = await db
		.select({
			id: lists.id,
			itemCount: sql<number>`count(${listItems.id})`,
			slug: lists.slug,
			title: lists.title,
			visibility: lists.visibility,
		})
		.from(lists)
		.leftJoin(listItems, eq(listItems.listId, lists.id))
		.where(eq(lists.ownerUserId, userId))
		.groupBy(lists.id)
		.orderBy(desc(lists.updatedAt), asc(lists.title))

	return rows satisfies UserListOption[]
}

export async function createUserList(params: {
	description?: string | null
	title: string
	userId: string
	visibility: ListVisibility
}) {
	const slug = await getUniqueListSlug(buildListSlug(params.title))
	const [createdList] = await db
		.insert(lists)
		.values({
			description: params.description ?? null,
			mediaType: 'anime',
			ownerUserId: params.userId,
			slug,
			title: params.title,
			visibility: params.visibility,
		})
		.returning({ id: lists.id, slug: lists.slug, title: lists.title })

	await recordCreatedListActivity({
		listId: createdList.id,
		slug: createdList.slug,
		title: createdList.title,
		userId: params.userId,
	})

	return createdList
}

export async function addAnimeToUserList(params: {
	listId: string
	mediaItemId: string
	note?: string | null
	userId: string
}) {
	const [list] = await db
		.select({ id: lists.id })
		.from(lists)
		.where(and(eq(lists.id, params.listId), eq(lists.ownerUserId, params.userId)))
		.limit(1)

	if (!list) {
		throw new Error('List not found')
	}

	const [existingItem] = await db
		.select({ id: listItems.id })
		.from(listItems)
		.where(and(eq(listItems.listId, params.listId), eq(listItems.mediaItemId, params.mediaItemId)))
		.limit(1)

	if (existingItem) {
		await db
			.update(listItems)
			.set({ note: params.note ?? null })
			.where(eq(listItems.id, existingItem.id))
	} else {
		const [positionRow] = await db
			.select({ maxPosition: sql<number>`coalesce(max(${listItems.position}), 0)` })
			.from(listItems)
			.where(eq(listItems.listId, params.listId))

		await db.insert(listItems).values({
			listId: params.listId,
			mediaItemId: params.mediaItemId,
			note: params.note ?? null,
			position: (positionRow?.maxPosition ?? 0) + 1,
		})
	}

	await db.update(lists).set({ updatedAt: new Date() }).where(eq(lists.id, params.listId))
}

export async function getListBySlug(
	slug: string,
	viewerUserId?: string
): Promise<ListDetail | null> {
	const [list] = await db
		.select({
			description: lists.description,
			id: lists.id,
			isOfficial: lists.isOfficial,
			ownerHandle: user.handle,
			ownerName: user.name,
			ownerUserId: lists.ownerUserId,
			slug: lists.slug,
			title: lists.title,
			updatedAt: lists.updatedAt,
			visibility: lists.visibility,
		})
		.from(lists)
		.leftJoin(user, eq(user.id, lists.ownerUserId))
		.where(eq(lists.slug, slug))
		.limit(1)

	if (!list) {
		return null
	}

	const canView =
		list.isOfficial ||
		list.visibility !== 'private' ||
		(viewerUserId ? viewerUserId === list.ownerUserId : false)

	if (!canView) {
		return null
	}

	const items = await db
		.select({
			note: listItems.note,
			position: listItems.position,
			posterUrl: mediaItems.imageUrlPoster,
			score: animeDetails.sourceScore,
			slug: mediaItems.slug,
			title: mediaItems.title,
			year: animeDetails.year,
		})
		.from(listItems)
		.innerJoin(mediaItems, eq(mediaItems.id, listItems.mediaItemId))
		.leftJoin(animeDetails, eq(animeDetails.mediaItemId, mediaItems.id))
		.where(eq(listItems.listId, list.id))
		.orderBy(asc(listItems.position), asc(mediaItems.title))

	return {
		description: list.description,
		id: list.id,
		items: items
			.filter((item) => Boolean(item.slug))
			.map((item) => ({
				note: item.note,
				position: item.position,
				posterUrl: item.posterUrl,
				score: toNullableNumber(item.score),
				slug: item.slug,
				title: item.title,
				year: item.year,
			})),
		isOfficial: list.isOfficial,
		ownerHandle: list.ownerHandle,
		ownerName: list.ownerName,
		slug: list.slug,
		title: list.title,
		updatedAt: list.updatedAt,
		visibility: list.visibility,
	}
}
