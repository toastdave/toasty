import type { AnimeCard, AnimeDetail, JikanAnime } from './adapters'
import { normalizeAnimeCard, normalizeAnimeDetail } from './adapters'
import { type Fetcher, jikanRequest } from './client'

export async function fetchTopAnimeRaw(fetcher: Fetcher): Promise<JikanAnime[]> {
	const response = await jikanRequest<JikanAnime[]>('/top/anime?limit=20', fetcher)
	return response.data
}

export async function fetchTopAnime(fetcher: Fetcher): Promise<AnimeCard[]> {
	return (await fetchTopAnimeRaw(fetcher)).map(normalizeAnimeCard)
}

export async function fetchCurrentSeasonRaw(fetcher: Fetcher): Promise<JikanAnime[]> {
	const response = await jikanRequest<JikanAnime[]>('/seasons/now?limit=24', fetcher)
	return response.data
}

export async function fetchSchedule(fetcher: Fetcher): Promise<AnimeCard[]> {
	return (await fetchCurrentSeasonRaw(fetcher)).map(normalizeAnimeCard)
}

export async function fetchAnimeDetailRaw(id: number, fetcher: Fetcher): Promise<JikanAnime> {
	const response = await jikanRequest<JikanAnime>(`/anime/${id}/full`, fetcher)
	return response.data
}

export async function fetchAnimeDetail(id: number, fetcher: Fetcher): Promise<AnimeDetail> {
	return normalizeAnimeDetail(await fetchAnimeDetailRaw(id, fetcher))
}
