<script lang="ts">
import { resolve } from '$app/paths'
import type { PageData } from './$types'

const { data }: { data: PageData } = $props()

const dateFormatter = new Intl.DateTimeFormat('en', {
	dateStyle: 'medium',
})
</script>

<svelte:head>
	<title>My Anime | Toasty</title>
</svelte:head>

<section class="rounded-[2rem] border border-black/8 bg-white/80 p-8 shadow-[0_24px_90px_-60px_rgba(18,23,34,0.65)] backdrop-blur">
	<div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
		<div class="max-w-3xl">
			<p class="text-sm uppercase tracking-[0.28em] text-sky-300">My anime</p>
			<h1 class="mt-3 font-display text-4xl tracking-tight text-ink-950">Keep your next watch, current rotation, and finished runs in one place.</h1>
			<p class="mt-4 text-base leading-7 text-ink-700">
				This is the first signed-in Toasty loop: save titles from any anime page, return to what is in progress, and keep your completed queue visible.
			</p>
			<div class="mt-5 flex flex-wrap gap-3">
				<a class="rounded-full bg-ink-950 px-5 py-3 text-sm font-semibold text-cream-50 hover:bg-ink-800" href={resolve(data.publicProfilePath)}>
					View public profile
				</a>
				<p class="flex items-center rounded-full border border-black/8 bg-white/80 px-4 py-3 text-sm text-ink-700">
					Public handle: <span class="ml-2 font-semibold text-ink-950">@{data.publicHandle}</span>
				</p>
			</div>
		</div>

		<div class="rounded-[1.5rem] border border-black/8 bg-cream-50/80 px-5 py-4 text-sm text-ink-700">
			<p>
				Tracking <span class="font-semibold text-ink-950">{data.total}</span>
				{data.total === 1 ? 'title' : 'titles'}
			</p>
			<p class="mt-2">
				Rated <span class="font-semibold text-ink-950">{data.ratingSnapshot.ratedCount}</span>
				{data.ratingSnapshot.ratedCount === 1 ? 'title' : 'titles'}
			</p>
			{#if data.ratingSnapshot.averageOverall !== null}
				<p class="mt-2">
					Average Toasty score <span class="font-semibold text-ink-950">{data.ratingSnapshot.averageOverall}</span>
				</p>
			{/if}
		</div>
	</div>

	<div class="mt-8 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
		<div class="rounded-[1.5rem] border border-black/8 bg-cream-50/80 p-6">
			<p class="text-sm uppercase tracking-[0.2em] text-ink-700">Taste profile</p>
			<h2 class="mt-2 text-2xl font-semibold text-ink-950">Your strongest Toasty lanes so far.</h2>

			{#if data.ratingSnapshot.ratedCount > 0}
				{#if data.ratingSnapshot.topTags.length > 0}
					<div class="mt-5 flex flex-wrap gap-2">
						{#each data.ratingSnapshot.topTags as tag (tag)}
							<span class="rounded-full bg-white px-3 py-2 text-sm font-semibold text-ink-950">{tag}</span>
						{/each}
					</div>
				{/if}

				{#if data.ratingSnapshot.strongestAxes.length > 0}
					<div class="mt-5 space-y-3">
						{#each data.ratingSnapshot.strongestAxes as axis (axis.key)}
							<div class="rounded-[1.15rem] border border-black/8 bg-white/90 px-4 py-3">
								<div class="flex items-center justify-between gap-3">
									<p class="text-sm font-semibold text-ink-950">{axis.label}</p>
									<span class="text-sm text-ink-700">Avg {axis.average}</span>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			{:else}
				<p class="mt-4 text-sm leading-7 text-ink-700">
					Rate a few anime and your strongest flavor lanes will start showing up here.
				</p>
			{/if}
		</div>

		<div class="rounded-[1.5rem] border border-black/8 bg-cream-50/80 p-6">
			<div class="flex items-end justify-between gap-3">
				<div>
					<p class="text-sm uppercase tracking-[0.2em] text-ink-700">Recent activity</p>
					<h2 class="mt-2 text-2xl font-semibold text-ink-950">Your public profile pulse.</h2>
				</div>
				<a class="text-sm font-semibold text-coral-400 hover:text-coral-400/80" href={resolve(data.publicProfilePath)}>
					Open profile
				</a>
			</div>

			{#if data.activity.length > 0}
				<div class="mt-5 space-y-3">
					{#each data.activity as item (item.id)}
						<a class="block rounded-[1.15rem] border border-black/8 bg-white/90 px-4 py-4 hover:border-coral-400/50 hover:bg-white" href={resolve(item.href ?? data.publicProfilePath)}>
							<div class="flex items-start justify-between gap-3">
								<div class="min-w-0">
									<p class="text-xs uppercase tracking-[0.2em] text-ink-700">{item.label}</p>
									<h3 class="mt-2 line-clamp-2 text-lg font-semibold text-ink-950">{item.title}</h3>
									<p class="mt-2 text-sm leading-6 text-ink-700">{item.description}</p>
								</div>
								<p class="shrink-0 text-sm text-ink-700">{dateFormatter.format(item.createdAt)}</p>
							</div>
						</a>
					{/each}
				</div>
			{:else}
				<div class="mt-5 rounded-[1.25rem] border border-dashed border-black/10 bg-white/70 p-5 text-sm leading-7 text-ink-700">
					Complete an anime, save a rating, or vote in a matchup and it will show up here.
				</div>
			{/if}
		</div>
	</div>

	{#if data.total > 0}
		<div class="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
			{#each data.sections as section (section.status)}
				<div class="rounded-[1.5rem] border border-black/8 bg-cream-50/80 p-5">
					<p class="text-sm uppercase tracking-[0.2em] text-ink-700">{section.title}</p>
					<p class="mt-3 text-3xl font-semibold text-ink-950">{section.count}</p>
					<p class="mt-2 text-sm leading-6 text-ink-700">{section.description}</p>
				</div>
			{/each}
		</div>

		<div class="mt-8 space-y-6">
			{#each data.sections as section (section.status)}
				<div class="rounded-[1.5rem] border border-black/8 bg-cream-50/60 p-6">
					<div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
						<div>
							<p class="text-sm uppercase tracking-[0.2em] text-ink-700">{section.title}</p>
							<h2 class="mt-2 text-2xl font-semibold text-ink-950">{section.count > 0 ? `${section.count} title${section.count === 1 ? '' : 's'}` : 'Nothing here yet'}</h2>
						</div>
						<p class="text-sm text-ink-700">{section.description}</p>
					</div>

					{#if section.items.length > 0}
						<div class="mt-5 grid gap-4 lg:grid-cols-2">
							{#each section.items as anime (anime.slug)}
								<a class="flex gap-4 rounded-[1.25rem] border border-black/8 bg-white/90 p-4 hover:border-sky-300/70 hover:bg-white" href={resolve('/anime/[slug]', { slug: anime.slug })}>
									{#if anime.posterUrl}
										<img alt={anime.title} class="h-28 w-20 rounded-[1.1rem] border border-black/8 object-cover" src={anime.posterUrl} />
									{:else}
										<div class="flex h-28 w-20 items-center justify-center rounded-[1.1rem] border border-dashed border-black/10 bg-cream-50 text-xs text-ink-700">
											No art
										</div>
									{/if}

									<div class="min-w-0 flex-1">
										<div class="flex flex-wrap items-start justify-between gap-3">
											<div>
												<p class="text-xs uppercase tracking-[0.2em] text-ink-700">{anime.statusLabel}</p>
												<h3 class="mt-2 line-clamp-2 text-lg font-semibold text-ink-950">{anime.title}</h3>
											</div>
											<div class="flex flex-wrap gap-2">
												{#if anime.overallRating !== null}
													<span class="rounded-full bg-coral-400 px-3 py-1 text-sm font-semibold text-cream-50">Toasty {anime.overallRating}</span>
												{/if}
												{#if anime.score !== null}
													<span class="rounded-full bg-ink-950 px-3 py-1 text-sm font-semibold text-cream-50">{anime.score}</span>
												{/if}
											</div>
										</div>

										{#if anime.secondaryTitle}
											<p class="mt-2 text-sm text-ink-700">{anime.secondaryTitle}</p>
										{/if}

										<p class="mt-3 text-sm text-ink-700">
											{anime.broadcastLabel ?? 'Broadcast details pending'}
											{anime.episodes ? ` • ${anime.episodes} eps` : ''}
											{anime.season ? ` • ${anime.season}` : ''}
											{anime.year ? ` ${anime.year}` : ''}
										</p>
										<p class="mt-4 text-sm text-ink-700">Updated {dateFormatter.format(anime.updatedAt)}</p>
									</div>
								</a>
							{/each}
						</div>
					{:else}
						<div class="mt-5 rounded-[1.25rem] border border-dashed border-black/10 bg-white/70 p-5 text-sm leading-7 text-ink-700">
							Save something from an anime detail page and it will land here.
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{:else}
			<div class="mt-8 rounded-[1.5rem] border border-dashed border-black/10 bg-cream-50/70 p-6 text-sm leading-7 text-ink-700">
				You have not tracked anything yet. Start on the <a class="font-semibold text-coral-400 hover:text-coral-400/80" href={resolve('/anime/top')}>top anime board</a> or browse the <a class="font-semibold text-coral-400 hover:text-coral-400/80" href={resolve('/anime/schedule')}>current schedule</a> and save a few titles.
			</div>
	{/if}
</section>
