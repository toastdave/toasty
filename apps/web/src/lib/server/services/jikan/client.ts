import { env } from '$env/dynamic/private'

type Fetcher = typeof fetch

type JikanEnvelope<T> = {
	data: T
	pagination?: {
		has_next_page: boolean
		last_visible_page: number
	}
}

export async function jikanRequest<T>(path: string, fetcher: Fetcher = fetch) {
	const baseUrl = env.JIKAN_BASE_URL || 'https://api.jikan.moe/v4'
	const response = await fetcher(`${baseUrl}${path}`, {
		headers: {
			accept: 'application/json',
		},
	})

	if (!response.ok) {
		throw new Error(`Jikan request failed for ${path} with status ${response.status}`)
	}

	return (await response.json()) as JikanEnvelope<T>
}

export type { Fetcher, JikanEnvelope }
