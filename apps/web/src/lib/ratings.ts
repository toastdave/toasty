export type RatingAxisGroup = 'core' | 'flavor'

export type RatingAxisBlueprint = {
	description: string
	emoji: string
	group: RatingAxisGroup
	key: string
	label: string
	maxValue: number
	minValue: number
	sortOrder: number
	weight: string
}

export type AnimeRatingDraftSummary = {
	coreCompleteCount: number
	coreTotalCount: number
	isComplete: boolean
	overallScore: number | null
	tags: string[]
}

export const animeRatingAxisBlueprints: RatingAxisBlueprint[] = [
	{
		description: 'How well made and dialed-in it feels overall.',
		emoji: '🎬',
		group: 'core',
		key: 'quality',
		label: 'Quality',
		maxValue: 10,
		minValue: 1,
		sortOrder: 1,
		weight: '0.22',
	},
	{
		description: 'How much of a good time it actually is.',
		emoji: '🍿',
		group: 'core',
		key: 'fun',
		label: 'Fun',
		maxValue: 10,
		minValue: 1,
		sortOrder: 2,
		weight: '0.20',
	},
	{
		description: 'How hard it hits emotionally or lingers after.',
		emoji: '💥',
		group: 'core',
		key: 'emotional_impact',
		label: 'Emotional impact',
		maxValue: 10,
		minValue: 1,
		sortOrder: 3,
		weight: '0.18',
	},
	{
		description: 'How fresh, risky, or distinct it feels.',
		emoji: '🧠',
		group: 'core',
		key: 'originality',
		label: 'Originality',
		maxValue: 10,
		minValue: 1,
		sortOrder: 4,
		weight: '0.14',
	},
	{
		description: 'How much you would want to revisit it later.',
		emoji: '🔁',
		group: 'core',
		key: 'revisit_pull',
		label: 'Revisit pull',
		maxValue: 10,
		minValue: 1,
		sortOrder: 5,
		weight: '0.12',
	},
	{
		description: 'How strongly you would push it on someone else.',
		emoji: '📣',
		group: 'core',
		key: 'recommendation_strength',
		label: 'Recommendation strength',
		maxValue: 10,
		minValue: 1,
		sortOrder: 6,
		weight: '0.14',
	},
	{
		description: 'How much it thrives on motion, fights, or raw momentum.',
		emoji: '⚡',
		group: 'flavor',
		key: 'action',
		label: 'Action',
		maxValue: 10,
		minValue: 1,
		sortOrder: 7,
		weight: '0.00',
	},
	{
		description: 'How strongly it leans into romance or heart-eyes energy.',
		emoji: '💘',
		group: 'flavor',
		key: 'romance',
		label: 'Romance',
		maxValue: 10,
		minValue: 1,
		sortOrder: 8,
		weight: '0.00',
	},
	{
		description: 'How much comedy or playful release it delivers.',
		emoji: '😂',
		group: 'flavor',
		key: 'comedy',
		label: 'Comedy',
		maxValue: 10,
		minValue: 1,
		sortOrder: 9,
		weight: '0.00',
	},
	{
		description: 'How much suspense, pressure, or edge it creates.',
		emoji: '🫀',
		group: 'flavor',
		key: 'tension',
		label: 'Tension',
		maxValue: 10,
		minValue: 1,
		sortOrder: 10,
		weight: '0.00',
	},
	{
		description: 'How much visual or emotional wow factor it carries.',
		emoji: '✨',
		group: 'flavor',
		key: 'spectacle',
		label: 'Spectacle',
		maxValue: 10,
		minValue: 1,
		sortOrder: 11,
		weight: '0.00',
	},
]

const animeAxisMap = new Map(animeRatingAxisBlueprints.map((axis) => [axis.key, axis]))

export function getAnimeAxisBlueprint(key: string) {
	return animeAxisMap.get(key) ?? null
}

export function computeOverallRating(
	scores: Record<string, number>,
	axes = animeRatingAxisBlueprints
) {
	let weightedTotal = 0
	let totalWeight = 0

	for (const axis of axes) {
		const score = scores[axis.key]
		const weight = Number(axis.weight)

		if (typeof score !== 'number' || Number.isNaN(score) || weight <= 0) {
			continue
		}

		weightedTotal += score * weight
		totalWeight += weight
	}

	if (totalWeight <= 0) {
		return null
	}

	return Number((weightedTotal / totalWeight).toFixed(2))
}

export function countCompletedCoreAxes(
	scores: Record<string, number>,
	axes = animeRatingAxisBlueprints
) {
	return axes.filter((axis) => axis.group === 'core' && typeof scores[axis.key] === 'number').length
}

export function hasCompletedCoreAxes(
	scores: Record<string, number>,
	axes = animeRatingAxisBlueprints
) {
	const coreAxes = axes.filter((axis) => axis.group === 'core')

	return coreAxes.length > 0 && countCompletedCoreAxes(scores, axes) === coreAxes.length
}

export function extractDominantFlavorTags(scores: Record<string, number>, limit = 3) {
	return animeRatingAxisBlueprints
		.filter((axis) => axis.group === 'flavor')
		.map((axis) => ({
			key: axis.key,
			label: axis.label,
			score: scores[axis.key] ?? null,
		}))
		.filter(
			(axis): axis is { key: string; label: string; score: number } =>
				typeof axis.score === 'number'
		)
		.sort((left, right) => right.score - left.score)
		.slice(0, limit)
		.filter((axis) => axis.score >= 7)
		.map((axis) => axis.label)
}

export function summarizeAnimeRatingDraft(
	scores: Record<string, number>,
	axes = animeRatingAxisBlueprints
): AnimeRatingDraftSummary {
	const coreTotalCount = axes.filter((axis) => axis.group === 'core').length
	const coreCompleteCount = countCompletedCoreAxes(scores, axes)
	const isComplete = coreTotalCount > 0 && coreCompleteCount === coreTotalCount

	return {
		coreCompleteCount,
		coreTotalCount,
		isComplete,
		overallScore: isComplete ? computeOverallRating(scores, axes) : null,
		tags: extractDominantFlavorTags(scores),
	}
}
