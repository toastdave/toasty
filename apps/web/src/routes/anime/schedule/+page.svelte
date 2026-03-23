<script lang="ts">
import type { PageData } from './$types'

const { data }: { data: PageData } = $props()
</script>

<svelte:head>
	<title>Current Schedule | Toasty</title>
</svelte:head>

<section class="rounded-[2rem] border border-black/8 bg-white/80 p-8 shadow-[0_24px_90px_-60px_rgba(18,23,34,0.65)] backdrop-blur">
	<div class="max-w-3xl">
		<p class="text-sm uppercase tracking-[0.28em] text-sky-300">Season board</p>
		<h1 class="mt-3 font-display text-4xl tracking-tight text-ink-950">Current anime release schedule</h1>
		<p class="mt-4 text-base leading-7 text-ink-700">
			Percent complete is shown only when the current Jikan payload includes a dependable date
			window. Dub release tracking stays out of scope until we add a better source.
		</p>
	</div>

	<div class="mt-8 grid gap-4 lg:grid-cols-2">
		{#each data.anime as anime}
			<a class="rounded-[1.5rem] border border-black/8 bg-cream-50/70 p-5 hover:border-sky-300/70 hover:bg-white" href={`/anime/${anime.slug}`}>
				<div class="flex items-start justify-between gap-4">
					<div>
						<h2 class="text-xl font-semibold text-ink-950">{anime.title}</h2>
						<p class="mt-2 text-sm text-ink-700">
							{anime.broadcastLabel ?? anime.status ?? 'Broadcast pending'}
						</p>
					</div>
					<span class="rounded-full bg-foam-200 px-3 py-1 text-sm font-semibold text-ink-950">
						{anime.percentComplete !== null ? `${anime.percentComplete}%` : 'TBD'}
					</span>
				</div>

				<p class="mt-4 text-sm text-ink-700">
					{anime.type ?? 'Anime'}{anime.episodes ? ` • ${anime.episodes} eps` : ''}
					{anime.season ? ` • ${anime.season}` : ''}
				</p>

				{#if anime.genres.length > 0}
					<p class="mt-3 text-sm text-ink-700">{anime.genres.slice(0, 3).join(' • ')}</p>
				{/if}
			</a>
		{/each}
	</div>
</section>
