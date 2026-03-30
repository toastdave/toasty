import { buildAnimeSlug } from '$lib/utils/anime'

type JikanGenre = {
	name: string
}

type JikanImageSet = {
	jpg?: {
		image_url?: string | null
		large_image_url?: string | null
	}
	webp?: {
		image_url?: string | null
		large_image_url?: string | null
	}
}

export type JikanAnime = {
	mal_id: number
	title: string
	title_english?: string | null
	title_japanese?: string | null
	synopsis?: string | null
	background?: string | null
	type?: string | null
	status?: string | null
	episodes?: number | null
	score?: number | null
	rank?: number | null
	popularity?: number | null
	year?: number | null
	season?: string | null
	source?: string | null
	duration?: string | null
	rating?: string | null
	images?: JikanImageSet
	genres?: JikanGenre[]
	themes?: JikanGenre[]
	demographics?: JikanGenre[]
	studios?: JikanGenre[]
	url?: string
	broadcast?: {
		day?: string | null
		time?: string | null
		timezone?: string | null
		string?: string | null
	} | null
	aired?: {
		from?: string | null
		to?: string | null
		string?: string | null
	} | null
}

export type AnimeCard = {
	id: number
	title: string
	secondaryTitle: string | null
	slug: string
	synopsis: string | null
	posterUrl: string | null
	largePosterUrl: string | null
	type: string | null
	status: string | null
	episodes: number | null
	score: number | null
	rank: number | null
	year: number | null
	season: string | null
	broadcastDay: string | null
	broadcastLabel: string | null
	genres: string[]
	percentComplete: number | null
	sourceUrl: string | null
}

export type AnimeDetail = AnimeCard & {
	background: string | null
	duration: string | null
	rating: string | null
	source: string | null
	studios: string[]
	themes: string[]
	demographics: string[]
	airedLabel: string | null
	broadcastTimeZone: string | null
}

function pickPoster(images: JikanImageSet | undefined, variant: 'default' | 'large') {
	if (variant === 'large') {
		return images?.webp?.large_image_url ?? images?.jpg?.large_image_url ?? null
	}

	return images?.webp?.image_url ?? images?.jpg?.image_url ?? null
}

export function computePercentCompleteFromDateRange(from: Date | null, to: Date | null) {
	if (!from || !to || Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
		return null
	}

	const duration = to.getTime() - from.getTime()
	if (duration <= 0) {
		return null
	}

	const now = Date.now()
	if (now <= from.getTime()) {
		return 0
	}

	if (now >= to.getTime()) {
		return 100
	}

	return Math.round(((now - from.getTime()) / duration) * 100)
}

function computePercentComplete(anime: JikanAnime) {
	return computePercentCompleteFromDateRange(
		anime.aired?.from ? new Date(anime.aired.from) : null,
		anime.aired?.to ? new Date(anime.aired.to) : null
	)
}

export function normalizeAnimeCard(anime: JikanAnime): AnimeCard {
	return {
		id: anime.mal_id,
		title: anime.title,
		secondaryTitle: anime.title_english ?? anime.title_japanese ?? null,
		slug: buildAnimeSlug(anime.title, anime.mal_id),
		synopsis: anime.synopsis ?? null,
		posterUrl: pickPoster(anime.images, 'default'),
		largePosterUrl: pickPoster(anime.images, 'large'),
		type: anime.type ?? null,
		status: anime.status ?? null,
		episodes: anime.episodes ?? null,
		score: anime.score ?? null,
		rank: anime.rank ?? null,
		year: anime.year ?? null,
		season: anime.season ?? null,
		broadcastDay: anime.broadcast?.day ?? null,
		broadcastLabel: anime.broadcast?.string ?? null,
		genres: anime.genres?.map((genre) => genre.name) ?? [],
		percentComplete: computePercentComplete(anime),
		sourceUrl: anime.url ?? null,
	}
}

export function normalizeAnimeDetail(anime: JikanAnime): AnimeDetail {
	const base = normalizeAnimeCard(anime)

	return {
		...base,
		background: anime.background ?? null,
		duration: anime.duration ?? null,
		rating: anime.rating ?? null,
		source: anime.source ?? null,
		studios: anime.studios?.map((studio) => studio.name) ?? [],
		themes: anime.themes?.map((theme) => theme.name) ?? [],
		demographics: anime.demographics?.map((demographic) => demographic.name) ?? [],
		airedLabel: anime.aired?.string ?? null,
		broadcastTimeZone: anime.broadcast?.timezone ?? null,
	}
}
