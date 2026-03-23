export function slugifyAnimeTitle(title: string) {
	return title
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 80)
}

export function buildAnimeSlug(title: string, id: number) {
	return `${slugifyAnimeTitle(title)}-${id}`
}

export function extractAnimeId(slug: string) {
	const match = slug.match(/-(\d+)$/)
	if (!match) {
		return null
	}

	const parsed = Number.parseInt(match[1], 10)
	return Number.isNaN(parsed) ? null : parsed
}
