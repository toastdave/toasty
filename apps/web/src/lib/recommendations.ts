type RecommendationReasonParams = {
	matchedTasteTags?: string[]
	sharedGenres: string[]
}

const tasteGenreAffinityMap: Record<string, string[]> = {
	Action: ['Action', 'Adventure', 'Martial Arts', 'Mecha', 'Sports'],
	Comedy: ['Comedy', 'Parody', 'Slice of Life'],
	Romance: ['Romance', 'Drama', 'Slice of Life'],
	Spectacle: ['Action', 'Adventure', 'Fantasy', 'Sci-Fi', 'Supernatural'],
	Tension: ['Horror', 'Mystery', 'Psychological', 'Suspense', 'Thriller'],
}

export function buildAnimeRecommendationReason({
	matchedTasteTags = [],
	sharedGenres,
}: RecommendationReasonParams) {
	const uniqueGenres = [...new Set(sharedGenres)].filter(Boolean)
	const uniqueTasteTags = [...new Set(matchedTasteTags)].filter(Boolean)

	if (uniqueTasteTags.length >= 2) {
		return `Matches your ${uniqueTasteTags.slice(0, 2).join(' + ')} taste`
	}

	if (uniqueTasteTags.length === 1) {
		return `Matches your ${uniqueTasteTags[0]} lane`
	}

	if (uniqueGenres.length >= 2) {
		return `Shared ${uniqueGenres.slice(0, 2).join(' + ')} energy`
	}

	if (uniqueGenres.length === 1) {
		return `Shared ${uniqueGenres[0]} DNA`
	}

	return 'Strong fit for the same lane'
}

export function findAnimeRecommendationTasteMatches(
	tasteTags: string[],
	candidateGenres: string[]
) {
	const candidateGenreSet = new Set(candidateGenres)

	return [...new Set(tasteTags)].filter(Boolean).filter((tag) => {
		const genreMatches = tasteGenreAffinityMap[tag]

		if (!genreMatches) {
			return false
		}

		return genreMatches.some((genre) => candidateGenreSet.has(genre))
	})
}

type RecommendationScoreParams = {
	candidateCommunityRatingCount: number
	candidateCommunityScore: number | null
	candidateCompletionCount: number
	candidateScore: number | null
	candidateSeason: string | null
	candidateYear: number | null
	matchedTasteCount: number
	referenceRecommendationStrength: number | null
	referenceSeason: string | null
	referenceYear: number | null
	sharedGenreCount: number
}

export function scoreAnimeRecommendationCandidate({
	candidateCommunityRatingCount,
	candidateCommunityScore,
	candidateCompletionCount,
	candidateScore,
	candidateSeason,
	candidateYear,
	matchedTasteCount,
	referenceRecommendationStrength,
	referenceSeason,
	referenceYear,
	sharedGenreCount,
}: RecommendationScoreParams) {
	let score = sharedGenreCount * 4
	score += matchedTasteCount * 2.25

	if (candidateSeason && referenceSeason && candidateSeason === referenceSeason) {
		score += 0.75
	}

	if (candidateYear && referenceYear && candidateYear === referenceYear) {
		score += 0.5
	}

	if (typeof candidateScore === 'number') {
		score += candidateScore / 24
	}

	if (typeof candidateCommunityScore === 'number') {
		score += candidateCommunityScore / 14
		score += Math.min(candidateCommunityRatingCount, 24) * 0.12
	}

	if (candidateCompletionCount > 0) {
		score += Math.min(candidateCompletionCount, 30) * 0.08
	}

	if (typeof referenceRecommendationStrength === 'number') {
		score += Math.max(referenceRecommendationStrength - 5, 0) * matchedTasteCount * 0.35
	}

	return score
}
