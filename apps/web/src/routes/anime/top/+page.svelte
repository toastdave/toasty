<script lang="ts">
import type { PageData } from './$types'

const { data }: { data: PageData } = $props()
</script>

<svelte:head>
	<title>Top Anime | Toasty</title>
</svelte:head>

<section class="rounded-[2rem] border border-black/8 bg-white/80 p-8 shadow-[0_24px_90px_-60px_rgba(18,23,34,0.65)] backdrop-blur">
	<p class="text-sm uppercase tracking-[0.28em] text-coral-400">Leaderboard</p>
	<h1 class="mt-3 font-display text-4xl tracking-tight text-ink-950">Top anime all time</h1>
	<p class="mt-4 max-w-2xl text-base leading-7 text-ink-700">
		A quick-start chart for when you want the safest possible recommendation, the biggest classics,
		or a reminder of what still belongs on your list.
	</p>

	{#if data.anime.length > 0}
		<div class="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
			{#each data.anime as anime}
				<a class="rounded-[1.5rem] border border-black/8 bg-cream-50/70 p-5 hover:border-coral-400/60 hover:bg-white" href={`/anime/${anime.slug}`}>
					<div class="flex gap-4">
						{#if anime.posterUrl}
							<img alt={anime.title} class="h-28 w-20 rounded-[1.25rem] border border-black/8 object-cover" src={anime.posterUrl} />
						{/if}

						<div class="min-w-0 flex-1">
							<div class="flex items-start justify-between gap-4">
								<div>
									<p class="text-xs uppercase tracking-[0.22em] text-ink-700">Rank #{anime.rank ?? '-'}</p>
									<h2 class="mt-2 line-clamp-2 text-xl font-semibold text-ink-950">{anime.title}</h2>
								</div>
								<span class="rounded-full bg-ink-950 px-3 py-1 text-sm font-semibold text-cream-50">
									{anime.score ?? 'TBD'}
								</span>
							</div>
							<p class="mt-3 text-sm text-ink-700">{anime.type ?? 'Anime'}{anime.year ? ` • ${anime.year}` : ''}</p>
							<p class="mt-4 line-clamp-4 text-sm leading-6 text-ink-700">
								{anime.synopsis ?? 'Synopsis pending.'}
							</p>
						</div>
					</div>
				</a>
			{/each}
		</div>
	{:else}
		<div class="mt-8 rounded-[1.5rem] border border-dashed border-black/10 bg-cream-50/70 p-6 text-sm leading-7 text-ink-700">
			The chart is taking a breather right now. Try the current schedule or refresh in a bit.
		</div>
	{/if}
</section>
