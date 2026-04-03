<script lang="ts">
import type { PageData } from './$types'

const { data }: { data: PageData } = $props()

const dateFormatter = new Intl.DateTimeFormat('en', {
	dateStyle: 'medium',
	timeStyle: 'short',
})
</script>

<svelte:head>
	<title>{data.tournament.year} Anime Seeding | Toasty</title>
</svelte:head>

<section class="rounded-[2rem] border border-black/8 bg-white/80 p-8 shadow-[0_24px_90px_-60px_rgba(18,23,34,0.65)] backdrop-blur">
	<div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
		<div class="max-w-3xl">
			<p class="text-sm uppercase tracking-[0.28em] text-coral-400">Tournament setup</p>
			<h1 class="mt-3 font-display text-4xl tracking-tight text-ink-950">{data.tournament.headerLabel}</h1>
			<p class="mt-4 text-base leading-7 text-ink-700">
				This snapshot freezes an anime field built from community Toasty scores, recommendation strength, popularity, and completion-aware engagement. It is the setup layer before live voting, deeper bracket rounds, and full historical archives land.
			</p>
		</div>

		<div class="rounded-[1.5rem] border border-black/8 bg-cream-50/80 px-5 py-4 text-sm text-ink-700">
			<p>
				Frozen <span class="font-semibold text-ink-950">{dateFormatter.format(data.tournament.generatedAt)}</span>
			</p>
			<p class="mt-2">
				Field size <span class="font-semibold text-ink-950">{data.tournament.entryCount}</span>
			</p>
			{#if data.bracket}
				<p class="mt-2">
					Bracket <span class="font-semibold text-ink-950">generated</span>
				</p>
			{/if}
		</div>
	</div>

	<div class="mt-8 grid gap-4 md:grid-cols-3">
		{#each data.tournament.methodology as item (item)}
			<div class="rounded-[1.5rem] border border-black/8 bg-cream-50/80 p-5 text-sm leading-7 text-ink-700">
				{item}
			</div>
		{/each}
	</div>

	<div class="mt-8 grid gap-4 md:grid-cols-4">
		{#each data.tournament.regions as region (region.label)}
			<div class="rounded-[1.5rem] border border-black/8 bg-cream-50/80 p-5">
				<p class="text-sm uppercase tracking-[0.2em] text-ink-700">{region.label}</p>
				<p class="mt-3 text-3xl font-semibold text-ink-950">{region.seedCount}</p>
				<p class="mt-2 text-sm text-ink-700">Projected entries in this region</p>
			</div>
		{/each}
	</div>

	<div class="mt-8 rounded-[1.5rem] border border-black/8 bg-cream-50/60 p-6">
		<div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
			<div>
				<p class="text-sm uppercase tracking-[0.2em] text-ink-700">Official seeding snapshot</p>
				<h2 class="mt-2 text-2xl font-semibold text-ink-950">Top projected entrants for {data.tournament.year}</h2>
			</div>
			<div class="flex flex-wrap gap-3">
				{#if data.bracket}
					<a class="text-sm font-semibold text-coral-400 hover:text-coral-400/80" href={`/tournaments/anime/${data.tournament.year}/bracket`}>
						View bracket
					</a>
				{/if}
				<a class="text-sm font-semibold text-coral-400 hover:text-coral-400/80" href="/anime/top">Browse top anime</a>
			</div>
		</div>

		<div class="mt-5 space-y-3">
			{#each data.tournament.seeds as seed (seed.slug)}
				<a class="flex flex-col gap-4 rounded-[1.25rem] border border-black/8 bg-white/90 p-4 hover:border-coral-400/60 hover:bg-white md:flex-row md:items-center md:justify-between" href={`/anime/${seed.slug}`}>
					<div class="flex items-center gap-4">
						<div class="w-14 text-sm font-semibold text-ink-700">#{seed.seed}</div>
						{#if seed.posterUrl}
							<img alt={seed.title} class="h-20 w-14 rounded-[1rem] border border-black/8 object-cover" src={seed.posterUrl} />
						{/if}
						<div>
							<p class="text-xs uppercase tracking-[0.2em] text-ink-700">{seed.region} region</p>
							<h3 class="mt-2 text-lg font-semibold text-ink-950">{seed.title}</h3>
							<p class="mt-2 text-sm text-ink-700">
								{seed.ratingScore !== null
									? `${seed.ratingSourceLabel === 'community' ? 'Community' : 'Source'} ${seed.ratingScore}`
									: 'Score pending'}
								{seed.ratingCount ? ` • ${seed.ratingCount} rating${seed.ratingCount === 1 ? '' : 's'}` : ''}
								{seed.completedCount ? ` • ${seed.completedCount} finished` : ''}
								{seed.popularityRank ? ` • Popularity #${seed.popularityRank}` : ''}
								{seed.engagementCount ? ` • ${seed.engagementCount} tracked` : ''}
							</p>
						</div>
					</div>

					<div class="rounded-full bg-ink-950 px-4 py-2 text-sm font-semibold text-cream-50">
						Seed score {seed.finalSeedScore}
					</div>
				</a>
			{/each}
		</div>
	</div>
</section>
