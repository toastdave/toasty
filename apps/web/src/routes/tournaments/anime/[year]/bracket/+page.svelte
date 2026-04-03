<script lang="ts">
import type { PageData } from './$types'

const { data }: { data: PageData } = $props()
</script>

<svelte:head>
	<title>{data.bracket.year} Anime Bracket | Toasty</title>
</svelte:head>

<section class="rounded-[2rem] border border-black/8 bg-white/80 p-8 shadow-[0_24px_90px_-60px_rgba(18,23,34,0.65)] backdrop-blur">
	<div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
		<div class="max-w-3xl">
			<p class="text-sm uppercase tracking-[0.28em] text-coral-400">Tournament bracket</p>
			<h1 class="mt-3 font-display text-4xl tracking-tight text-ink-950">{data.bracket.headerLabel}</h1>
			<p class="mt-4 text-base leading-7 text-ink-700">
				The first playable tournament structure is now generated directly from the stored seeding snapshot. This bracket view shows the frozen regions and the opening round pairings that come out of that field.
			</p>
		</div>

		<a class="rounded-full bg-ink-950 px-5 py-3 text-sm font-semibold text-cream-50 hover:bg-ink-800" href={`/tournaments/anime/${data.bracket.year}`}>
			View seeding snapshot
		</a>
	</div>

	<div class="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
		{#each data.bracket.regions as region (region.label)}
			<div class="rounded-[1.5rem] border border-black/8 bg-cream-50/80 p-5">
				<p class="text-sm uppercase tracking-[0.2em] text-ink-700">{region.label}</p>
				<div class="mt-4 space-y-3">
					{#each region.items as seed (seed.slug)}
						<a class="flex items-center gap-3 rounded-[1rem] border border-black/8 bg-white/90 p-3 hover:border-coral-400/60 hover:bg-white" href={`/anime/${seed.slug}`}>
							<div class="w-10 text-sm font-semibold text-ink-700">#{seed.seed}</div>
							<div class="min-w-0 flex-1">
								<p class="line-clamp-2 font-semibold text-ink-950">{seed.title}</p>
								<p class="mt-1 text-sm text-ink-700">{seed.finalSeedScore} seed score</p>
							</div>
						</a>
					{/each}
				</div>
			</div>
		{/each}
	</div>

	<div class="mt-8 rounded-[1.5rem] border border-black/8 bg-cream-50/60 p-6">
		<div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
			<div>
				<p class="text-sm uppercase tracking-[0.2em] text-ink-700">Opening round</p>
				<h2 class="mt-2 text-2xl font-semibold text-ink-950">First generated matchups</h2>
			</div>
			<p class="text-sm text-ink-700">Round {data.bracket.openingRoundMatchups[0]?.roundNumber ?? 1}</p>
		</div>

		<div class="mt-5 grid gap-4 lg:grid-cols-2">
			{#each data.bracket.openingRoundMatchups as matchup (matchup.id)}
				<div class="rounded-[1.25rem] border border-black/8 bg-white/90 p-5">
					<div class="flex items-center justify-between gap-3">
						<p class="text-xs uppercase tracking-[0.2em] text-ink-700">{matchup.label}</p>
						<a class="text-sm font-semibold text-coral-400 hover:text-coral-400/80" href={`/tournaments/anime/${data.bracket.year}/matchups/${matchup.id}`}>
							Open duel
						</a>
					</div>
					<div class="mt-4 grid gap-3">
						<a class="flex items-center justify-between gap-4 rounded-[1rem] border border-black/8 bg-cream-50/80 px-4 py-3 hover:border-coral-400/60 hover:bg-white" href={`/anime/${matchup.entryA.slug}`}>
							<div>
								<p class="text-xs uppercase tracking-[0.2em] text-ink-700">Seed #{matchup.entryA.seed}</p>
								<h3 class="mt-2 font-semibold text-ink-950">{matchup.entryA.title}</h3>
								<p class="mt-2 text-sm text-ink-700">
									{matchup.entryA.ratingScore !== null
										? `${matchup.entryA.ratingSourceLabel === 'community' ? 'Community' : 'Source'} ${matchup.entryA.ratingScore}`
										: 'Score pending'}
								</p>
							</div>
							<span class="rounded-full bg-ink-950 px-3 py-1 text-sm font-semibold text-cream-50">{matchup.entryA.finalSeedScore}</span>
						</a>
						<div class="text-center text-xs uppercase tracking-[0.28em] text-ink-700">vs</div>
						<a class="flex items-center justify-between gap-4 rounded-[1rem] border border-black/8 bg-cream-50/80 px-4 py-3 hover:border-coral-400/60 hover:bg-white" href={`/anime/${matchup.entryB.slug}`}>
							<div>
								<p class="text-xs uppercase tracking-[0.2em] text-ink-700">Seed #{matchup.entryB.seed}</p>
								<h3 class="mt-2 font-semibold text-ink-950">{matchup.entryB.title}</h3>
								<p class="mt-2 text-sm text-ink-700">
									{matchup.entryB.ratingScore !== null
										? `${matchup.entryB.ratingSourceLabel === 'community' ? 'Community' : 'Source'} ${matchup.entryB.ratingScore}`
										: 'Score pending'}
								</p>
							</div>
							<span class="rounded-full bg-ink-950 px-3 py-1 text-sm font-semibold text-cream-50">{matchup.entryB.finalSeedScore}</span>
						</a>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>
