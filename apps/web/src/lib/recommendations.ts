export function buildAnimeRecommendationReason(sharedGenres: string[]) {
	const uniqueGenres = [...new Set(sharedGenres)].filter(Boolean)

	if (uniqueGenres.length >= 2) {
		return `Shared ${uniqueGenres.slice(0, 2).join(' + ')} energy`
	}

	if (uniqueGenres.length === 1) {
		return `Shared ${uniqueGenres[0]} DNA`
	}

	return 'Strong fit for the same lane'
}

type RecommendationScoreParams = {
	candidateScore: number | null
	candidateSeason: string | null
	candidateYear: number | null
	referenceSeason: string | null
	referenceYear: number | null
	sharedGenreCount: number
}

export function scoreAnimeRecommendationCandidate({
	candidateScore,
	candidateSeason,
	candidateYear,
	referenceSeason,
	referenceYear,
	sharedGenreCount,
}: RecommendationScoreParams) {
	let score = sharedGenreCount * 4

	if (candidateSeason && referenceSeason && candidateSeason === referenceSeason) {
		score += 0.75
	}

	if (candidateYear && referenceYear && candidateYear === referenceYear) {
		score += 0.5
	}

	if (typeof candidateScore === 'number') {
		score += candidateScore / 20
	}

	return score
}
