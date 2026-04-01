const FALLBACK_HANDLE = 'toasty-fan'

export function slugifyProfileHandle(value: string) {
	const normalized = value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 24)

	return normalized || FALLBACK_HANDLE
}

export function buildProfilePath(handle: string) {
	return `/u/${handle}`
}
