import { createDb } from './client'
import { externalSources, ratingAxes, ratingRubrics, vibeBadges } from './schema/index'

const db = createDb()

const [animeRubric] = await db
	.insert(ratingRubrics)
	.values({
		mediaType: 'anime',
		name: 'Anime default rubric',
		version: 1,
		isActive: true,
	})
	.onConflictDoNothing()
	.returning({ id: ratingRubrics.id })

if (animeRubric) {
	await db.insert(ratingAxes).values([
		{
			rubricId: animeRubric.id,
			key: 'craft',
			label: 'Craft',
			weight: '0.16',
			emoji: '🎬',
			sortOrder: 1,
		},
		{
			rubricId: animeRubric.id,
			key: 'fun',
			label: 'Fun',
			weight: '0.16',
			emoji: '🍿',
			sortOrder: 2,
		},
		{
			rubricId: animeRubric.id,
			key: 'emotional_impact',
			label: 'Emotional impact',
			weight: '0.14',
			emoji: '💥',
			sortOrder: 3,
		},
		{
			rubricId: animeRubric.id,
			key: 'rewatchability',
			label: 'Rewatchability',
			weight: '0.12',
			emoji: '🔁',
			sortOrder: 4,
		},
		{
			rubricId: animeRubric.id,
			key: 'pacing',
			label: 'Pacing',
			weight: '0.10',
			emoji: '⏱️',
			sortOrder: 5,
		},
		{
			rubricId: animeRubric.id,
			key: 'spectacle',
			label: 'Spectacle',
			weight: '0.12',
			emoji: '✨',
			sortOrder: 6,
		},
		{
			rubricId: animeRubric.id,
			key: 'weirdness',
			label: 'Weirdness',
			weight: '0.10',
			emoji: '🌀',
			sortOrder: 7,
		},
		{
			rubricId: animeRubric.id,
			key: 'comfort',
			label: 'Comfort',
			weight: '0.05',
			emoji: '🛋️',
			sortOrder: 8,
		},
		{
			rubricId: animeRubric.id,
			key: 'recommendation_strength',
			label: 'Recommendation strength',
			weight: '0.05',
			emoji: '📣',
			sortOrder: 9,
		},
	])
}

await db
	.insert(externalSources)
	.values([
		{ name: 'jikan', baseUrl: 'https://api.jikan.moe/v4' },
		{ name: 'tmdb', baseUrl: 'https://api.themoviedb.org/3' },
		{ name: 'anilist', baseUrl: 'https://graphql.anilist.co' },
	])
	.onConflictDoNothing()

await db
	.insert(vibeBadges)
	.values([
		{ key: 'popcorn_banger', label: 'Popcorn banger', emoji: '🍿' },
		{ key: 'cozy_pick', label: 'Cozy pick', emoji: '🛋️' },
		{ key: 'cry_warning', label: 'Cry warning', emoji: '😭' },
		{ key: 'chaos_goblin', label: 'Chaos goblin', emoji: '🌀' },
		{ key: 'all_timer', label: 'All-timer', emoji: '👑' },
		{ key: 'underdog_gem', label: 'Underdog gem', emoji: '💎' },
	])
	.onConflictDoNothing()

console.log('Seeded core Toasty records')
