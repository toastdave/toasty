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

	<div class="mt-8 grid gap-4 md:grid-cols-3">
		<div class="rounded-[1.5rem] border border-black/8 bg-cream-50/80 p-5">
			<p class="text-sm uppercase tracking-[0.2em] text-ink-700">Current stage</p>
			<p class="mt-3 text-2xl font-semibold text-ink-950">{data.bracket.summary.currentRoundLabel ?? 'Bracket ready'}</p>
		</div>

		<div class="rounded-[1.5rem] border border-black/8 bg-cream-50/80 p-5">
			<p class="text-sm uppercase tracking-[0.2em] text-ink-700">Live matchups</p>
			<p class="mt-3 text-2xl font-semibold text-ink-950">{data.bracket.summary.liveMatchupCount}</p>
		</div>

		<div class="rounded-[1.5rem] border border-black/8 bg-cream-50/80 p-5">
			<p class="text-sm uppercase tracking-[0.2em] text-ink-700">Bracket votes</p>
			<p class="mt-3 text-2xl font-semibold text-ink-950">{data.bracket.summary.totalVotes}</p>
			{#if data.bracket.summary.championTitle}
				<p class="mt-2 text-sm leading-6 text-ink-700">Champion {data.bracket.summary.championTitle}</p>
			{/if}
		</div>
	</div>

	<div class="mt-8 space-y-6">
		{#each data.bracket.rounds as round (round.roundNumber)}
			<div class="rounded-[1.5rem] border border-black/8 bg-cream-50/60 p-6">
				<div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
					<div>
						<p class="text-sm uppercase tracking-[0.2em] text-ink-700">Round {round.roundNumber}</p>
						<h2 class="mt-2 text-2xl font-semibold text-ink-950">{round.label}</h2>
					</div>
					<p class="text-sm text-ink-700">{round.items.length} matchup{round.items.length === 1 ? '' : 's'}</p>
				</div>

				<div class="mt-5 grid gap-4 lg:grid-cols-2">
					{#each round.items as matchup (matchup.id)}
						<div class="rounded-[1.25rem] border border-black/8 bg-white/90 p-5">
							<div class="flex items-center justify-between gap-3">
								<p class="text-xs uppercase tracking-[0.2em] text-ink-700">{matchup.region} • {matchup.label}</p>
								<a class="text-sm font-semibold text-coral-400 hover:text-coral-400/80" href={`/tournaments/anime/${data.bracket.year}/matchups/${matchup.id}`}>
									Open duel
								</a>
							</div>
							<div class="mt-4 grid gap-3">
								<a class={`flex items-center justify-between gap-4 rounded-[1rem] border px-4 py-3 hover:bg-white ${matchup.winnerEntryId === matchup.entryAEntryId ? 'border-mango-300/70 bg-mango-300/15' : 'border-black/8 bg-cream-50/80 hover:border-coral-400/60'}`} href={`/anime/${matchup.entryA.slug}`}>
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
								<a class={`flex items-center justify-between gap-4 rounded-[1rem] border px-4 py-3 hover:bg-white ${matchup.winnerEntryId === matchup.entryBEntryId ? 'border-mango-300/70 bg-mango-300/15' : 'border-black/8 bg-cream-50/80 hover:border-coral-400/60'}`} href={`/anime/${matchup.entryB.slug}`}>
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
		{/each}
	</div>
</section>
