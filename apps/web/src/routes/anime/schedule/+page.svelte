<script lang="ts">
import type { PageData } from './$types'

const { data }: { data: PageData } = $props()

const dayLink = (day: string) => (day === 'all' ? '/anime/schedule' : `/anime/schedule?day=${day}`)
</script>

<svelte:head>
	<title>Current Schedule | Toasty</title>
</svelte:head>

<section class="rounded-[2rem] border border-black/8 bg-white/80 p-8 shadow-[0_24px_90px_-60px_rgba(18,23,34,0.65)] backdrop-blur">
	<div class="max-w-3xl">
		<p class="text-sm uppercase tracking-[0.28em] text-sky-300">Season board</p>
		<h1 class="mt-3 font-display text-4xl tracking-tight text-ink-950">Current anime release schedule</h1>
		<p class="mt-4 text-base leading-7 text-ink-700">
			Browse the season by day, scan what is still airing, and only trust progress numbers when the
			release window is actually clear.
		</p>
	</div>

	<div class="mt-8 flex flex-wrap gap-3">
		{#each data.dayTabs as dayTab}
			<a
				class={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${dayTab.isActive ? 'bg-ink-950 text-cream-50' : 'border border-black/8 bg-white text-ink-800 hover:bg-cream-100'}`}
				href={dayLink(dayTab.value)}
			>
				{dayTab.label} <span class="opacity-70">{dayTab.count}</span>
			</a>
		{/each}
	</div>

	<div class="mt-5 text-sm text-ink-700">
		Showing <span class="font-semibold text-ink-950">{data.anime.length}</span> of
		<span class="font-semibold text-ink-950">{data.totalAnime}</span> current season titles.
	</div>

	{#if data.anime.length > 0}
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
							{anime.percentComplete !== null ? `${anime.percentComplete}%` : 'Pending'}
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
	{:else}
		<div class="mt-8 rounded-[1.5rem] border border-dashed border-black/10 bg-cream-50/70 p-6 text-sm leading-7 text-ink-700">
			Nothing matches this day yet. Try another tab or open the full season board again.
		</div>
	{/if}
</section>
