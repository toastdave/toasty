import { db } from '$lib/server/db'
import { slugifyAnimeTitle } from '$lib/utils/anime'
import {
	animeDetails,
	externalSourceItems,
	externalSources,
	genres,
	ingestJobs,
	mediaItemGenres,
	mediaItems,
	trendSnapshotItems,
	trendSnapshots,
} from '@toasty/db/schema'
import { and, desc, eq, inArray } from 'drizzle-orm'
import type { AnimeCard, AnimeDetail, JikanAnime } from './adapters'
import { computePercentCompleteFromDateRange, normalizeAnimeDetail } from './adapters'
import type { Fetcher } from './client'
import {
	fetchAnimeDetailRaw,
	fetchCurrentSeasonRaw,
	fetchSchedule,
	fetchTopAnime,
	fetchTopAnimeRaw,
} from './index'

type DatabaseExecutor = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0]

const CURRENT_SEASON_LABEL = 'Jikan Current Season'
const DETAIL_MAX_AGE_MS = 1000 * 60 * 60 * 24
const JIKAN_BASE_URL = 'https://api.jikan.moe/v4'
const SNAPSHOT_MAX_AGE_MS = 1000 * 60 * 60 * 6
const TOP_ANIME_LABEL = 'Jikan Top Anime'

type TrendWindow = 'all_time' | 'daily' | 'monthly' | 'weekly'

type SnapshotRecord = {
	createdAt: Date
	id: string
	label: string | null
	window: TrendWindow
}

type PersistedAnimeRecord = {
	mediaItemId: string
	sourceScore: number | null
}

type StoredAnimeDetailRecord = {
	anime: AnimeDetail
	lastFetchedAt: Date | null
}

function asStringArray(value: unknown) {
	if (!Array.isArray(value)) {
		return []
	}

	return value.filter((entry): entry is string => typeof entry === 'string')
}

function buildGenreSlug(name: string) {
	return slugifyAnimeTitle(name)
}

function parseDate(value: string | null | undefined) {
	if (!value) {
		return null
	}

	const parsed = new Date(value)
	return Number.isNaN(parsed.getTime()) ? null : parsed
}

function parseDurationMinutes(duration: string | null | undefined) {
	if (!duration) {
		return null
	}

	const hours = duration.match(/(\d+)\s*hr/i)
	const minutes = duration.match(/(\d+)\s*min/i)
	const total =
		(hours ? Number.parseInt(hours[1], 10) * 60 : 0) +
		(minutes ? Number.parseInt(minutes[1], 10) : 0)

	return total > 0 ? total : null
}

function pickOriginalTitle(anime: JikanAnime) {
	if (anime.title_japanese && anime.title_japanese !== anime.title) {
		return anime.title_japanese
	}

	return anime.title_english && anime.title_english !== anime.title ? anime.title_english : null
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

function snapshotIsStale(snapshot: SnapshotRecord | null) {
	if (!snapshot) {
		return true
	}

	return Date.now() - snapshot.createdAt.getTime() > SNAPSHOT_MAX_AGE_MS
}

async function getOrCreateJikanSource(database: DatabaseExecutor) {
	const [existingSource] = await database
		.select({ id: externalSources.id })
		.from(externalSources)
		.where(eq(externalSources.name, 'jikan'))
		.limit(1)

	if (existingSource) {
		return existingSource
	}

	const [createdSource] = await database
		.insert(externalSources)
		.values({
			baseUrl: JIKAN_BASE_URL,
			name: 'jikan',
		})
		.returning({ id: externalSources.id })

	return createdSource
}

async function createIngestJob(jobType: 'lookup' | 'trending', metadata: Record<string, unknown>) {
	const source = await getOrCreateJikanSource(db)
	const [job] = await db
		.insert(ingestJobs)
		.values({
			jobType,
			metadataJsonb: metadata,
			sourceId: source.id,
			startedAt: new Date(),
			status: 'running',
		})
		.returning({ id: ingestJobs.id, sourceId: ingestJobs.sourceId })

	return job
}

async function finalizeIngestJob(
	jobId: string,
	status: 'failed' | 'success',
	metadata: Record<string, unknown>,
	errorMessage?: string
) {
	await db
		.update(ingestJobs)
		.set({
			errorMessage,
			finishedAt: new Date(),
			metadataJsonb: metadata,
			status,
		})
		.where(eq(ingestJobs.id, jobId))
}

async function ensureGenres(database: DatabaseExecutor, names: string[]) {
	const uniqueNames = [...new Set(names.filter(Boolean))]

	if (uniqueNames.length === 0) {
		return new Map<string, string>()
	}

	await database
		.insert(genres)
		.values(
			uniqueNames.map((name) => ({
				name,
				slug: buildGenreSlug(name),
			}))
		)
		.onConflictDoNothing()

	const rows = await database
		.select({ id: genres.id, name: genres.name })
		.from(genres)
		.where(inArray(genres.name, uniqueNames))

	return new Map(rows.map((row: { id: string; name: string }) => [row.name, row.id]))
}

async function persistAnimeRecord(
	database: DatabaseExecutor,
	sourceId: string,
	anime: JikanAnime
): Promise<PersistedAnimeRecord> {
	const externalId = String(anime.mal_id)
	const [mapping] = await database
		.select({ mediaItemId: externalSourceItems.mediaItemId })
		.from(externalSourceItems)
		.where(
			and(
				eq(externalSourceItems.sourceId, sourceId),
				eq(externalSourceItems.externalId, externalId)
			)
		)
		.limit(1)

	const [detailRecord] = mapping
		? [null]
		: await database
				.select({ mediaItemId: animeDetails.mediaItemId })
				.from(animeDetails)
				.where(eq(animeDetails.jikanMalId, externalId))
				.limit(1)

	let mediaItemId = mapping?.mediaItemId ?? detailRecord?.mediaItemId ?? null
	const airedFrom = parseDate(anime.aired?.from)
	const airedTo = parseDate(anime.aired?.to)
	const primaryPosterUrl = anime.images?.webp?.image_url ?? anime.images?.jpg?.image_url ?? null
	const largePosterUrl =
		anime.images?.webp?.large_image_url ?? anime.images?.jpg?.large_image_url ?? null
	const mediaValues = {
		canonicalUrl: anime.url ?? null,
		description: anime.synopsis ?? null,
		imageUrlBackdrop: largePosterUrl,
		imageUrlPoster: primaryPosterUrl,
		originalTitle: pickOriginalTitle(anime),
		releaseDate: airedFrom,
		runtimeMinutes: parseDurationMinutes(anime.duration),
		slug: `${slugifyAnimeTitle(anime.title)}-${anime.mal_id}`,
		title: anime.title,
		type: 'anime' as const,
		updatedAt: new Date(),
	}

	if (mediaItemId) {
		await database.update(mediaItems).set(mediaValues).where(eq(mediaItems.id, mediaItemId))
	} else {
		const [createdMediaItem] = await database
			.insert(mediaItems)
			.values(mediaValues)
			.returning({ id: mediaItems.id })

		mediaItemId = createdMediaItem.id
	}

	const detailValues = {
		airedFrom,
		airedLabel: anime.aired?.string ?? null,
		airedTo,
		airingStatus: anime.status ?? null,
		background: anime.background ?? null,
		broadcastDay: anime.broadcast?.day ?? null,
		broadcastLabel: anime.broadcast?.string ?? null,
		broadcastTime: anime.broadcast?.time ?? null,
		broadcastTimezone: anime.broadcast?.timezone ?? null,
		demographicsJsonb: anime.demographics?.map((demographic) => demographic.name) ?? [],
		episodeCount: anime.episodes ?? null,
		format: anime.type ?? null,
		jikanMalId: externalId,
		ratingLabel: anime.rating ?? null,
		season: anime.season ?? null,
		sourceMaterial: anime.source ?? null,
		sourcePopularity: anime.popularity ?? null,
		sourceRank: anime.rank ?? null,
		sourceScore: anime.score?.toString() ?? null,
		studiosJsonb: anime.studios?.map((studio) => studio.name) ?? [],
		themesJsonb: anime.themes?.map((theme) => theme.name) ?? [],
		year: anime.year ?? null,
	}

	const [existingAnimeDetail] = await database
		.select({ mediaItemId: animeDetails.mediaItemId })
		.from(animeDetails)
		.where(eq(animeDetails.mediaItemId, mediaItemId))
		.limit(1)

	if (existingAnimeDetail) {
		await database
			.update(animeDetails)
			.set(detailValues)
			.where(eq(animeDetails.mediaItemId, mediaItemId))
	} else {
		await database.insert(animeDetails).values({ mediaItemId, ...detailValues })
	}

	if (mapping) {
		await database
			.update(externalSourceItems)
			.set({
				lastFetchedAt: new Date(),
				rawPayloadJsonb: anime,
				sourceUrl: anime.url ?? null,
			})
			.where(
				and(
					eq(externalSourceItems.sourceId, sourceId),
					eq(externalSourceItems.externalId, externalId)
				)
			)
	} else {
		await database.insert(externalSourceItems).values({
			externalId,
			lastFetchedAt: new Date(),
			mediaItemId,
			rawPayloadJsonb: anime,
			sourceId,
			sourceUrl: anime.url ?? null,
		})
	}

	await database.delete(mediaItemGenres).where(eq(mediaItemGenres.mediaItemId, mediaItemId))

	const genreIdByName = await ensureGenres(database, anime.genres?.map((genre) => genre.name) ?? [])
	const genreIds = (anime.genres?.map((genre) => genreIdByName.get(genre.name)).filter(Boolean) ??
		[]) as string[]

	if (genreIds.length > 0) {
		await database.insert(mediaItemGenres).values(
			genreIds.map((genreId) => ({
				genreId,
				mediaItemId,
			}))
		)
	}

	return {
		mediaItemId,
		sourceScore: anime.score ?? null,
	}
}

async function createTrendSnapshot(
	database: DatabaseExecutor,
	params: {
		items: PersistedAnimeRecord[]
		label: string
		sourceId: string
		window: TrendWindow
	}
) {
	const [snapshot] = await database
		.insert(trendSnapshots)
		.values({
			createdAt: new Date(),
			label: params.label,
			mediaType: 'anime',
			snapshotDate: new Date(),
			sourceId: params.sourceId,
			window: params.window,
		})
		.returning({ id: trendSnapshots.id })

	await database.insert(trendSnapshotItems).values(
		params.items.map((item, index) => ({
			mediaItemId: item.mediaItemId,
			metadataJsonb: {},
			rank: index + 1,
			score: item.sourceScore?.toString() ?? null,
			trendSnapshotId: snapshot.id,
		}))
	)

	return snapshot.id
}

async function getLatestSnapshot(label: string, window: TrendWindow) {
	const [snapshot] = await db
		.select({
			createdAt: trendSnapshots.createdAt,
			id: trendSnapshots.id,
			label: trendSnapshots.label,
			window: trendSnapshots.window,
		})
		.from(trendSnapshots)
		.where(and(eq(trendSnapshots.label, label), eq(trendSnapshots.window, window)))
		.orderBy(desc(trendSnapshots.snapshotDate), desc(trendSnapshots.createdAt))
		.limit(1)

	return snapshot ?? null
}

async function getGenreMap(mediaItemIds: string[]) {
	if (mediaItemIds.length === 0) {
		return new Map<string, string[]>()
	}

	const rows = await db
		.select({ genreName: genres.name, mediaItemId: mediaItemGenres.mediaItemId })
		.from(mediaItemGenres)
		.innerJoin(genres, eq(genres.id, mediaItemGenres.genreId))
		.where(inArray(mediaItemGenres.mediaItemId, mediaItemIds))

	const genreMap = new Map<string, string[]>()

	for (const row of rows) {
		const existingGenres = genreMap.get(row.mediaItemId) ?? []
		existingGenres.push(row.genreName)
		genreMap.set(row.mediaItemId, existingGenres)
	}

	return genreMap
}

async function listSnapshotAnimeCards(snapshotId: string): Promise<AnimeCard[]> {
	const rows = await db
		.select({
			airedFrom: animeDetails.airedFrom,
			airedTo: animeDetails.airedTo,
			broadcastDay: animeDetails.broadcastDay,
			broadcastLabel: animeDetails.broadcastLabel,
			episodes: animeDetails.episodeCount,
			largePosterUrl: mediaItems.imageUrlBackdrop,
			malId: animeDetails.jikanMalId,
			mediaItemId: mediaItems.id,
			posterUrl: mediaItems.imageUrlPoster,
			rank: trendSnapshotItems.rank,
			score: animeDetails.sourceScore,
			season: animeDetails.season,
			secondaryTitle: mediaItems.originalTitle,
			slug: mediaItems.slug,
			sourceUrl: mediaItems.canonicalUrl,
			status: animeDetails.airingStatus,
			synopsis: mediaItems.description,
			title: mediaItems.title,
			type: animeDetails.format,
			year: animeDetails.year,
		})
		.from(trendSnapshotItems)
		.innerJoin(mediaItems, eq(mediaItems.id, trendSnapshotItems.mediaItemId))
		.innerJoin(animeDetails, eq(animeDetails.mediaItemId, mediaItems.id))
		.where(eq(trendSnapshotItems.trendSnapshotId, snapshotId))
		.orderBy(trendSnapshotItems.rank)

	const genreMap = await getGenreMap(rows.map((row) => row.mediaItemId))

	return rows.map((row) => ({
		broadcastDay: row.broadcastDay,
		broadcastLabel: row.broadcastLabel,
		episodes: row.episodes,
		genres: genreMap.get(row.mediaItemId) ?? [],
		id: Number.parseInt(row.malId ?? '0', 10),
		largePosterUrl: row.largePosterUrl,
		percentComplete: computePercentCompleteFromDateRange(row.airedFrom, row.airedTo),
		posterUrl: row.posterUrl,
		rank: row.rank,
		score: toNullableNumber(row.score),
		season: row.season,
		secondaryTitle: row.secondaryTitle,
		slug: row.slug,
		sourceUrl: row.sourceUrl,
		status: row.status,
		synopsis: row.synopsis,
		title: row.title,
		type: row.type,
		year: row.year,
	}))
}

async function getStoredAnimeDetailByMalId(malId: number): Promise<StoredAnimeDetailRecord | null> {
	const [row] = await db
		.select({
			airedFrom: animeDetails.airedFrom,
			airedLabel: animeDetails.airedLabel,
			airedTo: animeDetails.airedTo,
			background: animeDetails.background,
			broadcastDay: animeDetails.broadcastDay,
			broadcastLabel: animeDetails.broadcastLabel,
			broadcastTimezone: animeDetails.broadcastTimezone,
			demographicsJsonb: animeDetails.demographicsJsonb,
			durationMinutes: mediaItems.runtimeMinutes,
			episodes: animeDetails.episodeCount,
			format: animeDetails.format,
			largePosterUrl: mediaItems.imageUrlBackdrop,
			lastFetchedAt: externalSourceItems.lastFetchedAt,
			mediaItemId: mediaItems.id,
			posterUrl: mediaItems.imageUrlPoster,
			ratingLabel: animeDetails.ratingLabel,
			score: animeDetails.sourceScore,
			season: animeDetails.season,
			secondaryTitle: mediaItems.originalTitle,
			slug: mediaItems.slug,
			sourceMaterial: animeDetails.sourceMaterial,
			sourceUrl: mediaItems.canonicalUrl,
			status: animeDetails.airingStatus,
			studiosJsonb: animeDetails.studiosJsonb,
			synopsis: mediaItems.description,
			themesJsonb: animeDetails.themesJsonb,
			title: mediaItems.title,
			type: animeDetails.format,
			year: animeDetails.year,
		})
		.from(animeDetails)
		.innerJoin(mediaItems, eq(mediaItems.id, animeDetails.mediaItemId))
		.leftJoin(externalSourceItems, eq(externalSourceItems.mediaItemId, mediaItems.id))
		.where(eq(animeDetails.jikanMalId, String(malId)))
		.limit(1)

	if (!row) {
		return null
	}

	const genreMap = await getGenreMap([row.mediaItemId])

	return {
		anime: {
			airedLabel: row.airedLabel,
			background: row.background,
			broadcastDay: row.broadcastDay,
			broadcastLabel: row.broadcastLabel,
			broadcastTimeZone: row.broadcastTimezone,
			demographics: asStringArray(row.demographicsJsonb),
			duration: typeof row.durationMinutes === 'number' ? `${row.durationMinutes} min` : null,
			episodes: row.episodes,
			genres: genreMap.get(row.mediaItemId) ?? [],
			id: malId,
			largePosterUrl: row.largePosterUrl,
			percentComplete: computePercentCompleteFromDateRange(row.airedFrom, row.airedTo),
			posterUrl: row.posterUrl,
			rank: null,
			rating: row.ratingLabel,
			score: toNullableNumber(row.score),
			season: row.season,
			secondaryTitle: row.secondaryTitle,
			slug: row.slug,
			source: row.sourceMaterial,
			sourceUrl: row.sourceUrl,
			status: row.status,
			studios: asStringArray(row.studiosJsonb),
			synopsis: row.synopsis,
			themes: asStringArray(row.themesJsonb),
			title: row.title,
			type: row.type,
			year: row.year,
		},
		lastFetchedAt: row.lastFetchedAt ?? null,
	}
}

function detailIsFresh(record: StoredAnimeDetailRecord | null) {
	if (!record?.lastFetchedAt) {
		return false
	}

	return Date.now() - record.lastFetchedAt.getTime() <= DETAIL_MAX_AGE_MS
}

export async function syncJikanTrendingCatalog(fetcher: Fetcher) {
	const job = await createIngestJob('trending', {
		targets: [TOP_ANIME_LABEL, CURRENT_SEASON_LABEL],
	})

	try {
		const source = await getOrCreateJikanSource(db)
		const [topAnime, currentSeason] = await Promise.all([
			fetchTopAnimeRaw(fetcher),
			fetchCurrentSeasonRaw(fetcher),
		])

		const result = await db.transaction(async (transaction) => {
			const topItems: PersistedAnimeRecord[] = []
			for (const anime of topAnime) {
				topItems.push(await persistAnimeRecord(transaction, source.id, anime))
			}

			const seasonItems: PersistedAnimeRecord[] = []
			for (const anime of currentSeason) {
				seasonItems.push(await persistAnimeRecord(transaction, source.id, anime))
			}

			const topSnapshotId = await createTrendSnapshot(transaction, {
				items: topItems,
				label: TOP_ANIME_LABEL,
				sourceId: source.id,
				window: 'all_time',
			})

			const seasonSnapshotId = await createTrendSnapshot(transaction, {
				items: seasonItems,
				label: CURRENT_SEASON_LABEL,
				sourceId: source.id,
				window: 'daily',
			})

			return {
				seasonCount: seasonItems.length,
				seasonSnapshotId,
				topCount: topItems.length,
				topSnapshotId,
			}
		})

		await finalizeIngestJob(job.id, 'success', result)
		return result
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown Jikan sync failure'
		await finalizeIngestJob(
			job.id,
			'failed',
			{ targets: [TOP_ANIME_LABEL, CURRENT_SEASON_LABEL] },
			message
		)
		throw error
	}
}

export async function syncJikanAnimeDetailCatalog(malId: number, fetcher: Fetcher) {
	const job = await createIngestJob('lookup', { malId })

	try {
		const source = await getOrCreateJikanSource(db)
		const anime = await fetchAnimeDetailRaw(malId, fetcher)

		const result = await db.transaction(async (transaction) => {
			const persisted = await persistAnimeRecord(transaction, source.id, anime)
			return {
				malId,
				mediaItemId: persisted.mediaItemId,
			}
		})

		await finalizeIngestJob(job.id, 'success', result)
		return result
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown anime detail sync failure'
		await finalizeIngestJob(job.id, 'failed', { malId }, message)
		throw error
	}
}

async function ensureFreshTrendingCatalog(fetcher: Fetcher, label: string, window: TrendWindow) {
	const latestSnapshot = await getLatestSnapshot(label, window)

	if (snapshotIsStale(latestSnapshot)) {
		await syncJikanTrendingCatalog(fetcher)
	}
}

export async function getLandingAnimeCatalog(fetcher: Fetcher) {
	try {
		const [topSnapshot, seasonSnapshot] = await Promise.all([
			getLatestSnapshot(TOP_ANIME_LABEL, 'all_time'),
			getLatestSnapshot(CURRENT_SEASON_LABEL, 'daily'),
		])

		if (snapshotIsStale(topSnapshot) || snapshotIsStale(seasonSnapshot)) {
			await syncJikanTrendingCatalog(fetcher)
		}

		const [latestTopSnapshot, latestSeasonSnapshot] = await Promise.all([
			getLatestSnapshot(TOP_ANIME_LABEL, 'all_time'),
			getLatestSnapshot(CURRENT_SEASON_LABEL, 'daily'),
		])

		if (latestTopSnapshot && latestSeasonSnapshot) {
			const [topAnime, currentSeason] = await Promise.all([
				listSnapshotAnimeCards(latestTopSnapshot.id),
				listSnapshotAnimeCards(latestSeasonSnapshot.id),
			])

			if (topAnime.length > 0 && currentSeason.length > 0) {
				return { currentSeason, topAnime }
			}
		}
	} catch (error) {
		console.error('Failed to load landing anime catalog, falling back to Jikan', error)
	}

	const [topAnime, currentSeason] = await Promise.all([
		fetchTopAnime(fetcher),
		fetchSchedule(fetcher),
	])
	return { currentSeason, topAnime }
}

export async function getTopAnimeCatalog(fetcher: Fetcher): Promise<AnimeCard[]> {
	try {
		await ensureFreshTrendingCatalog(fetcher, TOP_ANIME_LABEL, 'all_time')
		const latestSnapshot = await getLatestSnapshot(TOP_ANIME_LABEL, 'all_time')

		if (latestSnapshot) {
			const cards = await listSnapshotAnimeCards(latestSnapshot.id)
			if (cards.length > 0) {
				return cards
			}
		}
	} catch (error) {
		console.error('Failed to load top anime from catalog, falling back to Jikan', error)
	}

	return fetchTopAnime(fetcher)
}

export async function getCurrentSeasonCatalog(fetcher: Fetcher): Promise<AnimeCard[]> {
	try {
		await ensureFreshTrendingCatalog(fetcher, CURRENT_SEASON_LABEL, 'daily')
		const latestSnapshot = await getLatestSnapshot(CURRENT_SEASON_LABEL, 'daily')

		if (latestSnapshot) {
			const cards = await listSnapshotAnimeCards(latestSnapshot.id)
			if (cards.length > 0) {
				return cards
			}
		}
	} catch (error) {
		console.error('Failed to load current season from catalog, falling back to Jikan', error)
	}

	return fetchSchedule(fetcher)
}

export async function getAnimeDetailCatalog(malId: number, fetcher: Fetcher): Promise<AnimeDetail> {
	const storedAnimeRecord = await getStoredAnimeDetailByMalId(malId)

	if (storedAnimeRecord && detailIsFresh(storedAnimeRecord)) {
		return storedAnimeRecord.anime
	}

	try {
		await syncJikanAnimeDetailCatalog(malId, fetcher)
		const storedAnime = await getStoredAnimeDetailByMalId(malId)

		if (storedAnime) {
			return storedAnime.anime
		}
	} catch (error) {
		console.error('Failed to load anime detail from catalog, falling back to Jikan', error)

		if (storedAnimeRecord) {
			return storedAnimeRecord.anime
		}
	}

	return normalizeAnimeDetail(await fetchAnimeDetailRaw(malId, fetcher))
}

export { CURRENT_SEASON_LABEL, TOP_ANIME_LABEL }
