import type { AnimeCard, AnimeDetail, JikanAnime } from './adapters'
import { normalizeAnimeCard, normalizeAnimeDetail } from './adapters'
import { type Fetcher, jikanRequest } from './client'

export async function fetchTopAnime(fetcher: Fetcher): Promise<AnimeCard[]> {
	const response = await jikanRequest<JikanAnime[]>('/top/anime?limit=20', fetcher)
	return response.data.map(normalizeAnimeCard)
}

export async function fetchSchedule(fetcher: Fetcher): Promise<AnimeCard[]> {
	const response = await jikanRequest<JikanAnime[]>('/seasons/now?limit=24', fetcher)
	return response.data.map(normalizeAnimeCard)
}

export async function fetchAnimeDetail(id: number, fetcher: Fetcher): Promise<AnimeDetail> {
	const response = await jikanRequest<JikanAnime>(`/anime/${id}/full`, fetcher)
	return normalizeAnimeDetail(response.data)
}
