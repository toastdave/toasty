export function normalizeRedirectTo(redirectTo: string | null | undefined) {
	if (!redirectTo || !redirectTo.startsWith('/')) {
		return '/'
	}

	return redirectTo
}
