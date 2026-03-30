import { getCurrentSeasonCatalog } from '$lib/server/services/jikan/catalog'
import type { PageServerLoad } from './$types'

const dayOrder = [
	'monday',
	'tuesday',
	'wednesday',
	'thursday',
	'friday',
	'saturday',
	'sunday',
] as const

const dayLabelByValue = {
	all: 'All airing shows',
	friday: 'Friday',
	monday: 'Monday',
	saturday: 'Saturday',
	sunday: 'Sunday',
	thursday: 'Thursday',
	tuesday: 'Tuesday',
	unscheduled: 'Unscheduled',
	wednesday: 'Wednesday',
} as const

type ScheduleDay = keyof typeof dayLabelByValue

function normalizeDay(day: string | null): ScheduleDay {
	if (!day) {
		return 'all'
	}

	const normalizedDay = day.toLowerCase()

	if (normalizedDay === 'all' || normalizedDay === 'unscheduled') {
		return normalizedDay
	}

	return dayOrder.includes(normalizedDay as (typeof dayOrder)[number])
		? (normalizedDay as ScheduleDay)
		: 'all'
}

function getAnimeDay(day: string | null) {
	if (!day) {
		return null
	}

	const normalizedDay = day.toLowerCase()
	return dayOrder.includes(normalizedDay as (typeof dayOrder)[number]) ? normalizedDay : null
}

export const load: PageServerLoad = async ({ fetch, url }) => {
	const allAnime = await getCurrentSeasonCatalog(fetch)
	const activeDay = normalizeDay(url.searchParams.get('day'))
	const filteredAnime = allAnime.filter((anime) => {
		const animeDay = getAnimeDay(anime.broadcastDay)

		if (activeDay === 'all') {
			return true
		}

		if (activeDay === 'unscheduled') {
			return animeDay === null
		}

		return animeDay === activeDay
	})

	const dayTabs = ['all', ...dayOrder, 'unscheduled'].map((value) => ({
		count: allAnime.filter((anime) => {
			const animeDay = getAnimeDay(anime.broadcastDay)

			if (value === 'all') {
				return true
			}

			if (value === 'unscheduled') {
				return animeDay === null
			}

			return animeDay === value
		}).length,
		isActive: activeDay === value,
		label: dayLabelByValue[value as ScheduleDay],
		value,
	}))

	return {
		activeDay,
		anime: filteredAnime,
		dayTabs,
		totalAnime: allAnime.length,
	}
}
