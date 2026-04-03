import {
	syncJikanAnimeDetailCatalog,
	syncJikanTrendingCatalog,
} from '../src/lib/server/services/jikan/catalog'
import {
	advanceAnimeTournament,
	publishAnimeTournament,
	refreshAnimeTournamentSeedingSnapshot,
} from '../src/lib/server/tournaments'

function readYear(value: string | undefined) {
	const year = value ? Number.parseInt(value, 10) : Number.NaN

	if (!Number.isInteger(year)) {
		throw new Error('Provide a valid year')
	}

	return year
}

async function main() {
	const [domain, action, value] = process.argv.slice(2)

	if (domain === 'sync' && action === 'trending') {
		const result = await syncJikanTrendingCatalog(fetch)
		console.log(JSON.stringify(result, null, 2))
		return
	}

	if (domain === 'sync' && action === 'detail') {
		const malId = readYear(value)
		const result = await syncJikanAnimeDetailCatalog(malId, fetch)
		console.log(JSON.stringify(result, null, 2))
		return
	}

	if (domain === 'tournament' && action === 'seed') {
		const result = await refreshAnimeTournamentSeedingSnapshot(readYear(value))
		console.log(JSON.stringify(result, null, 2))
		return
	}

	if (domain === 'tournament' && action === 'publish') {
		const result = await publishAnimeTournament(readYear(value))
		console.log(JSON.stringify(result, null, 2))
		return
	}

	if (domain === 'tournament' && action === 'advance') {
		const result = await advanceAnimeTournament(readYear(value))
		console.log(JSON.stringify(result, null, 2))
		return
	}

	throw new Error(
		'Usage: bun run scripts/ops.ts sync trending | sync detail <malId> | tournament seed <year> | tournament publish <year> | tournament advance <year>'
	)
}

main()
	.then(() => {
		process.exit(0)
	})
	.catch((error) => {
		console.error(error instanceof Error ? error.message : error)
		process.exit(1)
	})
