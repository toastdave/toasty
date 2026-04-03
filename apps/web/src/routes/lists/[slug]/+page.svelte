<script lang="ts">
import type { PageData } from './$types'

const { data }: { data: PageData } = $props()

const dateFormatter = new Intl.DateTimeFormat('en', {
	dateStyle: 'medium',
})
</script>

<svelte:head>
	<title>{data.list.title} | Toasty</title>
</svelte:head>

<section class="rounded-[2rem] border border-black/8 bg-white/80 p-8 shadow-[0_24px_90px_-60px_rgba(18,23,34,0.65)] backdrop-blur">
	<div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
		<div class="max-w-3xl">
			<p class="text-sm uppercase tracking-[0.28em] text-coral-400">{data.list.isOfficial ? 'Official list' : 'Public list'}</p>
			<h1 class="mt-3 font-display text-4xl tracking-tight text-ink-950">{data.list.title}</h1>
			<p class="mt-4 text-base leading-7 text-ink-700">
				{data.list.description ?? 'A Toasty list built to collect anime that belong in the same lane.'}
			</p>
		</div>

		<div class="rounded-[1.5rem] border border-black/8 bg-cream-50/80 px-5 py-4 text-sm text-ink-700">
			<p>
				Updated <span class="font-semibold text-ink-950">{dateFormatter.format(data.list.updatedAt)}</span>
			</p>
			{#if data.list.ownerHandle}
				<p class="mt-2">
					By <span class="font-semibold text-ink-950">@{data.list.ownerHandle}</span>
				</p>
			{/if}
		</div>
	</div>

	<div class="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
		{#each data.list.items as item (item.slug)}
			<a class="rounded-[1.25rem] border border-black/8 bg-cream-50/80 p-4 hover:border-coral-400/60 hover:bg-white" href={`/anime/${item.slug}`}>
				<div class="flex gap-4">
					{#if item.posterUrl}
						<img alt={item.title} class="h-28 w-20 rounded-[1.1rem] border border-black/8 object-cover" src={item.posterUrl} />
					{:else}
						<div class="flex h-28 w-20 items-center justify-center rounded-[1.1rem] border border-dashed border-black/10 bg-white text-xs text-ink-700">
							No art
						</div>
					{/if}

					<div class="min-w-0 flex-1">
						<p class="text-xs uppercase tracking-[0.2em] text-ink-700">#{item.position}</p>
						<h2 class="mt-2 line-clamp-2 text-lg font-semibold text-ink-950">{item.title}</h2>
						<p class="mt-2 text-sm text-ink-700">
							{item.score !== null ? `Source ${item.score}` : 'Score pending'}
							{item.year ? ` • ${item.year}` : ''}
						</p>
						{#if item.note}
							<p class="mt-3 line-clamp-4 text-sm leading-6 text-ink-700">{item.note}</p>
						{/if}
					</div>
				</div>
			</a>
		{/each}
	</div>
</section>
