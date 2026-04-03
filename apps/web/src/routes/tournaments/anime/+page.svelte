<script lang="ts">
import type { PageData } from './$types'

const { data }: { data: PageData } = $props()

const dateFormatter = new Intl.DateTimeFormat('en', {
	dateStyle: 'medium',
})
</script>

<svelte:head>
	<title>Anime Tournaments | Toasty</title>
</svelte:head>

<section class="rounded-[2rem] border border-black/8 bg-white/80 p-8 shadow-[0_24px_90px_-60px_rgba(18,23,34,0.65)] backdrop-blur">
	<div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
		<div class="max-w-3xl">
			<p class="text-sm uppercase tracking-[0.28em] text-coral-400">Anime tournaments</p>
			<h1 class="mt-3 font-display text-4xl tracking-tight text-ink-950">Yearly seeding, bracket history, and live duel entry points.</h1>
			<p class="mt-4 text-base leading-7 text-ink-700">
				The anime tournament lane now has a proper archive surface so every yearly field can be revisited from seeding snapshot to playable bracket.
			</p>
		</div>
	</div>

	<div class="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
		{#each data.archives as archive (archive.year)}
			<a class="rounded-[1.5rem] border border-black/8 bg-cream-50/80 p-5 hover:border-coral-400/60 hover:bg-white" href={`/tournaments/anime/${archive.year}`}>
				<p class="text-xs uppercase tracking-[0.2em] text-ink-700">{archive.status}</p>
				<h2 class="mt-3 text-3xl font-semibold text-ink-950">{archive.year}</h2>
				<p class="mt-3 text-sm leading-6 text-ink-700">
					{archive.entryCount} seeded title{archive.entryCount === 1 ? '' : 's'}
					{archive.hasBracket ? ' • bracket available' : ' • seeding only'}
				</p>
				{#if archive.currentRoundLabel || archive.championTitle}
					<p class="mt-3 text-sm leading-6 text-ink-700">
						{archive.championTitle ? `Champion ${archive.championTitle}` : archive.currentRoundLabel}
						{archive.totalVotes ? ` • ${archive.totalVotes} votes` : ''}
					</p>
				{/if}
				<p class="mt-4 text-sm text-ink-700">Updated {dateFormatter.format(archive.updatedAt)}</p>
			</a>
		{/each}
	</div>
</section>
