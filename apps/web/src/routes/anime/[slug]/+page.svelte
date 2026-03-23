<script lang="ts">
import type { PageData } from './$types'

const { data }: { data: PageData } = $props()
</script>

<svelte:head>
	<title>{data.anime.title} | Toasty</title>
</svelte:head>

<section class="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
	<div class="rounded-[2rem] border border-black/8 bg-white/80 p-6 shadow-[0_24px_90px_-60px_rgba(18,23,34,0.65)] backdrop-blur">
		{#if data.anime.largePosterUrl}
			<img class="w-full rounded-[1.5rem] border border-black/8 object-cover" src={data.anime.largePosterUrl} alt={data.anime.title} />
		{:else}
			<div class="flex aspect-[3/4] items-center justify-center rounded-[1.5rem] border border-dashed border-black/10 bg-cream-50 text-sm text-ink-700">
				Poster unavailable
			</div>
		{/if}

		<div class="mt-5 space-y-3 text-sm text-ink-800">
			<p><span class="font-semibold">Type:</span> {data.anime.type ?? 'Unknown'}</p>
			<p><span class="font-semibold">Status:</span> {data.anime.status ?? 'Unknown'}</p>
			<p><span class="font-semibold">Episodes:</span> {data.anime.episodes ?? 'TBD'}</p>
			<p><span class="font-semibold">Score:</span> {data.anime.score ?? 'TBD'}</p>
			<p><span class="font-semibold">Aired:</span> {data.anime.airedLabel ?? 'TBD'}</p>
			<p><span class="font-semibold">Broadcast:</span> {data.anime.broadcastLabel ?? 'TBD'}</p>
			{#if data.anime.sourceUrl}
				<p>
					<a class="font-semibold text-coral-400 hover:text-coral-400/80" href={data.anime.sourceUrl} rel="noreferrer" target="_blank">
						View source listing
					</a>
				</p>
			{/if}
		</div>
	</div>

	<div class="rounded-[2rem] border border-black/8 bg-white/80 p-8 shadow-[0_24px_90px_-60px_rgba(18,23,34,0.65)] backdrop-blur">
		<p class="text-sm uppercase tracking-[0.28em] text-coral-400">Anime detail</p>
		<h1 class="mt-3 font-display text-5xl tracking-tight text-ink-950">{data.anime.title}</h1>
		{#if data.anime.secondaryTitle}
			<p class="mt-3 text-base text-ink-700">{data.anime.secondaryTitle}</p>
		{/if}

		<div class="mt-6 flex flex-wrap gap-2 text-sm font-medium text-ink-800">
			{#each data.anime.genres as genre}
				<span class="rounded-full bg-cream-100 px-3 py-1">{genre}</span>
			{/each}
		</div>

		<div class="mt-8 space-y-5 text-base leading-7 text-ink-700">
			<p>{data.anime.synopsis ?? 'Synopsis pending.'}</p>
			{#if data.anime.background}
				<p>{data.anime.background}</p>
			{/if}
		</div>

		<div class="mt-8 grid gap-4 md:grid-cols-2">
			<div class="rounded-[1.5rem] border border-black/8 bg-cream-50/80 p-5">
				<p class="text-sm uppercase tracking-[0.2em] text-ink-700">Metadata</p>
				<ul class="mt-4 space-y-2 text-sm text-ink-800">
					<li>Duration: {data.anime.duration ?? 'Unknown'}</li>
					<li>Source: {data.anime.source ?? 'Unknown'}</li>
					<li>Rating: {data.anime.rating ?? 'Unknown'}</li>
					<li>Timezone: {data.anime.broadcastTimeZone ?? 'Unknown'}</li>
				</ul>
			</div>

			<div class="rounded-[1.5rem] border border-black/8 bg-cream-50/80 p-5">
				<p class="text-sm uppercase tracking-[0.2em] text-ink-700">Future product hooks</p>
				<ul class="mt-4 space-y-2 text-sm text-ink-800">
					<li>Canonical DB sync target</li>
					<li>Rubric-based rating target</li>
					<li>Checklist and list inclusion target</li>
					<li>Tournament seed candidate</li>
				</ul>
			</div>
		</div>
	</div>
</section>
