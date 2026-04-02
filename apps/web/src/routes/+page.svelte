<script lang="ts">
import { siteConfig } from '$lib/config/site'
import type { PageData } from './$types'

const { data }: { data: PageData } = $props()

const futureTracks = [
	'Faster seasonal browsing',
	'Personal watch queues',
	'Big editorial-style lists',
	'Year-end bracket season',
	'More media beyond anime',
]
</script>

<svelte:head>
	<title>{siteConfig.name} | Anime charts and future bracket chaos</title>
</svelte:head>

<section class="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
	<div class="rounded-[2rem] border border-black/8 bg-white/70 p-8 shadow-[0_24px_100px_-52px_rgba(18,23,34,0.6)] backdrop-blur sm:p-10">
		<div class="flex flex-wrap gap-2 text-sm font-medium text-ink-700">
			<span class="rounded-full bg-ink-950 px-3 py-1 text-cream-50">Anime-first</span>
			<span class="rounded-full border border-black/8 px-3 py-1">Jikan-backed</span>
			<span class="rounded-full border border-black/8 px-3 py-1">Tournament-ready</span>
		</div>

		<h1 class="mt-6 max-w-3xl font-display text-5xl leading-none tracking-tight text-ink-950 sm:text-6xl">
			Your next anime night starts with charts, schedules, and zero digging.
		</h1>
		<p class="mt-5 max-w-2xl text-lg leading-8 text-ink-700">
			Toasty helps you scan the all-timers, keep up with what is airing right now, and find the
			show that actually fits tonight.
		</p>

		<div class="mt-8 flex flex-wrap gap-3">
			<a class="rounded-full bg-ink-950 px-5 py-3 text-sm font-semibold text-cream-50" href="/anime/top">
				Browse top anime
			</a>
			<a class="rounded-full border border-black/8 bg-white/80 px-5 py-3 text-sm font-semibold text-ink-800" href="/anime/schedule">
				See current schedule
			</a>
		</div>
	</div>

	<div class="rounded-[2rem] border border-black/8 bg-ink-950 p-8 text-cream-50 shadow-[0_24px_100px_-52px_rgba(18,23,34,0.8)]">
		<p class="text-sm uppercase tracking-[0.28em] text-mango-300">Coming next</p>
		<ul class="mt-5 space-y-3 text-sm leading-7 text-cream-50/90">
			{#each futureTracks as track (track)}
				<li>{track}</li>
			{/each}
		</ul>
	</div>
</section>

{#if data.recommendationShelf}
	<section class="mt-8 rounded-[1.75rem] border border-black/8 bg-white/80 p-7 shadow-[0_24px_80px_-60px_rgba(18,23,34,0.5)] backdrop-blur">
		<div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
			<div class="max-w-3xl">
				<p class="text-sm uppercase tracking-[0.28em] text-mango-300">Recommended next</p>
				<h2 class="mt-2 font-display text-3xl text-ink-950">{data.recommendationShelf.heading}</h2>
				<p class="mt-3 text-base leading-7 text-ink-700">{data.recommendationShelf.description}</p>
			</div>
			<a class="text-sm font-semibold text-ink-800 hover:text-ink-950" href="/me">View my anime</a>
		</div>

		<div class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
			{#each data.recommendationShelf.items as anime (anime.slug)}
				<a class="rounded-[1.5rem] border border-black/8 bg-cream-50/70 p-5 hover:border-mango-300/70 hover:bg-white" href={`/anime/${anime.slug}`}>
					<div class="flex gap-4">
						{#if anime.posterUrl}
							<img alt={anime.title} class="h-28 w-20 rounded-[1.2rem] border border-black/8 object-cover" src={anime.posterUrl} />
						{/if}

						<div class="min-w-0 flex-1">
							<div class="flex items-start justify-between gap-4">
								<div>
									<p class="text-xs uppercase tracking-[0.2em] text-ink-700">{anime.matchReason}</p>
									<h3 class="mt-2 line-clamp-2 text-xl font-semibold text-ink-950">{anime.title}</h3>
								</div>
								{#if anime.score !== null}
									<span class="rounded-full bg-ink-950 px-3 py-1 text-sm font-semibold text-cream-50">{anime.score}</span>
								{/if}
							</div>
							<p class="mt-3 text-sm text-ink-700">
								{anime.type ?? 'Anime'}{anime.year ? ` • ${anime.year}` : ''}
							</p>
							<p class="mt-4 line-clamp-3 text-sm leading-6 text-ink-700">
								{anime.synopsis ?? 'Open the detail page to see why this one is worth your time.'}
							</p>
						</div>
					</div>
				</a>
			{/each}
		</div>
	</section>
{/if}

{#if data.tournamentPreview}
	<section class="mt-8 rounded-[1.75rem] border border-black/8 bg-white/80 p-7 shadow-[0_24px_80px_-60px_rgba(18,23,34,0.5)] backdrop-blur">
		<div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
			<div class="max-w-3xl">
				<p class="text-sm uppercase tracking-[0.28em] text-coral-400">Tournament setup</p>
				<h2 class="mt-2 font-display text-3xl text-ink-950">{data.tournamentPreview.year} anime seeding snapshot</h2>
				<p class="mt-3 text-base leading-7 text-ink-700">
					The first tournament layer is now live as a frozen public snapshot: current catalog quality, popularity, and live checklist engagement combine into a projected bracket field.
				</p>
			</div>
			<a class="text-sm font-semibold text-ink-800 hover:text-ink-950" href={`/tournaments/anime/${data.tournamentPreview.year}`}>
				See full seeding
			</a>
		</div>

		<div class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
			{#each data.tournamentPreview.seeds.slice(0, 4) as seed (seed.slug)}
				<a class="rounded-[1.5rem] border border-black/8 bg-cream-50/70 p-5 hover:border-coral-400/60 hover:bg-white" href={`/anime/${seed.slug}`}>
					<div class="flex items-center justify-between gap-3">
						<p class="text-xs uppercase tracking-[0.2em] text-ink-700">#{seed.seed} • {seed.region}</p>
						<span class="rounded-full bg-ink-950 px-3 py-1 text-sm font-semibold text-cream-50">{seed.finalSeedScore}</span>
					</div>
					<div class="mt-4 flex gap-4">
						{#if seed.posterUrl}
							<img alt={seed.title} class="h-24 w-[4.25rem] rounded-2xl border border-black/8 object-cover" src={seed.posterUrl} />
						{/if}

						<div class="min-w-0">
							<h3 class="line-clamp-2 text-lg font-semibold text-ink-950">{seed.title}</h3>
							<p class="mt-2 text-sm text-ink-700">
								{seed.ratingScore !== null ? `Quality ${seed.ratingScore}` : 'Score pending'}
								{seed.engagementCount ? ` • ${seed.engagementCount} tracked` : ''}
							</p>
						</div>
					</div>
				</a>
			{/each}
		</div>
	</section>
{/if}

<section class="mt-8 grid gap-6 lg:grid-cols-2">
	<div class="rounded-[1.75rem] border border-black/8 bg-white/80 p-7 shadow-[0_24px_80px_-60px_rgba(18,23,34,0.5)] backdrop-blur">
		<div class="flex items-center justify-between gap-3">
			<div>
				<p class="text-sm uppercase tracking-[0.28em] text-coral-400">Top anime now</p>
				<h2 class="mt-2 font-display text-3xl text-ink-950">Start with the all-timers</h2>
			</div>
			<a class="text-sm font-semibold text-ink-800 hover:text-ink-950" href="/anime/top">View all</a>
		</div>

		<div class="mt-6 grid gap-4 sm:grid-cols-2">
			{#if data.heroAnime.length > 0}
				{#each data.heroAnime as anime (anime.slug)}
					<a class="flex gap-4 rounded-[1.5rem] border border-black/8 bg-cream-50/70 p-4 hover:border-coral-400/60 hover:bg-white" href={`/anime/${anime.slug}`}>
						{#if anime.posterUrl}
							<img alt={anime.title} class="h-24 w-[4.25rem] rounded-2xl border border-black/8 object-cover" src={anime.posterUrl} />
						{/if}
						<div class="min-w-0">
							<p class="text-xs uppercase tracking-[0.2em] text-ink-700">#{anime.rank ?? ' - '} ranked</p>
							<h3 class="mt-2 line-clamp-2 text-lg font-semibold text-ink-950">{anime.title}</h3>
							<p class="mt-2 text-sm text-ink-700">Score {anime.score ?? 'TBD'}{anime.type ? ` • ${anime.type}` : ''}</p>
						</div>
					</a>
				{/each}
			{:else}
				<div class="rounded-[1.5rem] border border-dashed border-black/10 bg-cream-50/60 p-5 text-sm leading-7 text-ink-700 sm:col-span-2">
					The chart is warming up. Check back in a moment or jump straight into the current schedule.
				</div>
			{/if}
		</div>
	</div>

	<div class="rounded-[1.75rem] border border-black/8 bg-white/80 p-7 shadow-[0_24px_80px_-60px_rgba(18,23,34,0.5)] backdrop-blur">
		<div class="flex items-center justify-between gap-3">
			<div>
				<p class="text-sm uppercase tracking-[0.28em] text-sky-300">Current season</p>
				<h2 class="mt-2 font-display text-3xl text-ink-950">Watch the airing board</h2>
			</div>
			<a class="text-sm font-semibold text-ink-800 hover:text-ink-950" href="/anime/schedule">View all</a>
		</div>

		<div class="mt-6 space-y-3">
			{#if data.airingNow.length > 0}
				{#each data.airingNow as anime (anime.slug)}
					<a class="flex items-center justify-between gap-4 rounded-[1.25rem] border border-black/8 bg-cream-50/70 px-4 py-3 hover:border-sky-300/70 hover:bg-white" href={`/anime/${anime.slug}`}>
						<div>
							<h3 class="font-semibold text-ink-950">{anime.title}</h3>
							<p class="text-sm text-ink-700">{anime.broadcastLabel ?? anime.status ?? 'Schedule pending'}</p>
						</div>
						<span class="text-sm font-semibold text-ink-800">
							{anime.percentComplete !== null ? `${anime.percentComplete}%` : 'Pending'}
						</span>
					</a>
				{/each}
			{:else}
				<div class="rounded-[1.5rem] border border-dashed border-black/10 bg-cream-50/60 p-5 text-sm leading-7 text-ink-700">
					No seasonal schedule is available right now. The top chart is still a good place to start.
				</div>
			{/if}
		</div>
	</div>
</section>
