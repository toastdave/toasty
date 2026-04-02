<script lang="ts">
import type { PageData } from './$types'

const { data }: { data: PageData } = $props()

const dateFormatter = new Intl.DateTimeFormat('en', {
	dateStyle: 'long',
})
</script>

<svelte:head>
	<title>{data.profile.name} (@{data.profile.handle}) | Toasty</title>
</svelte:head>

<section class="rounded-[2rem] border border-black/8 bg-white/80 p-8 shadow-[0_24px_90px_-60px_rgba(18,23,34,0.65)] backdrop-blur">
	<div class="grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
		<div class="rounded-[1.5rem] border border-black/8 bg-cream-50/80 p-6">
			<div class="flex items-center gap-4">
				{#if data.profile.image}
					<img alt={data.profile.name} class="h-20 w-20 rounded-full border border-black/8 object-cover" src={data.profile.image} />
				{:else}
					<div class="flex h-20 w-20 items-center justify-center rounded-full border border-black/8 bg-white text-2xl font-semibold text-ink-950">
						{data.profile.name.charAt(0).toUpperCase()}
					</div>
				{/if}

				<div>
					<p class="text-sm uppercase tracking-[0.28em] text-coral-400">Profile</p>
					<h1 class="mt-2 font-display text-4xl tracking-tight text-ink-950">{data.profile.name}</h1>
					<p class="mt-2 text-base text-ink-700">@{data.profile.handle}</p>
				</div>
			</div>

			<p class="mt-6 text-sm leading-7 text-ink-700">
				{data.profile.bio ?? 'Anime watchlist energy, now public. This profile highlights what they plan to watch, what is currently in rotation, and what already made the finished pile.'}
			</p>

			<div class="mt-6 grid gap-3 sm:grid-cols-2">
				<div class="rounded-[1.25rem] border border-black/8 bg-white/80 p-4">
					<p class="text-xs uppercase tracking-[0.2em] text-ink-700">Tracked titles</p>
					<p class="mt-2 text-3xl font-semibold text-ink-950">{data.profile.total}</p>
				</div>
				<div class="rounded-[1.25rem] border border-black/8 bg-white/80 p-4">
					<p class="text-xs uppercase tracking-[0.2em] text-ink-700">Joined Toasty</p>
					<p class="mt-2 text-lg font-semibold text-ink-950">{dateFormatter.format(data.profile.createdAt)}</p>
				</div>
				<div class="rounded-[1.25rem] border border-black/8 bg-white/80 p-4">
					<p class="text-xs uppercase tracking-[0.2em] text-ink-700">Rated titles</p>
					<p class="mt-2 text-3xl font-semibold text-ink-950">{data.profile.ratingSnapshot.ratedCount}</p>
				</div>
				<div class="rounded-[1.25rem] border border-black/8 bg-white/80 p-4">
					<p class="text-xs uppercase tracking-[0.2em] text-ink-700">Average Toasty score</p>
					<p class="mt-2 text-lg font-semibold text-ink-950">{data.profile.ratingSnapshot.averageOverall ?? 'TBD'}</p>
				</div>
			</div>
		</div>

		<div>
			<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{#each data.profile.sections as section (section.status)}
					<div class="rounded-[1.5rem] border border-black/8 bg-cream-50/80 p-5">
						<p class="text-sm uppercase tracking-[0.2em] text-ink-700">{section.title}</p>
						<p class="mt-3 text-3xl font-semibold text-ink-950">{section.count}</p>
						<p class="mt-2 text-sm leading-6 text-ink-700">{section.description}</p>
					</div>
				{/each}
			</div>

			<div class="mt-6 space-y-6">
				{#each data.profile.sections as section (section.status)}
					<div class="rounded-[1.5rem] border border-black/8 bg-cream-50/60 p-6">
						<div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
							<div>
								<p class="text-sm uppercase tracking-[0.2em] text-ink-700">{section.title}</p>
								<h2 class="mt-2 text-2xl font-semibold text-ink-950">{section.count > 0 ? `${section.count} title${section.count === 1 ? '' : 's'}` : 'Nothing shared here yet'}</h2>
							</div>
							<p class="text-sm text-ink-700">{section.description}</p>
						</div>

						{#if section.items.length > 0}
							<div class="mt-5 grid gap-4 lg:grid-cols-2">
								{#each section.items as anime (anime.slug)}
									<a class="flex gap-4 rounded-[1.25rem] border border-black/8 bg-white/90 p-4 hover:border-coral-400/60 hover:bg-white" href={`/anime/${anime.slug}`}>
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
										</div>
									</a>
								{/each}
							</div>
						{:else}
							<div class="mt-5 rounded-[1.25rem] border border-dashed border-black/10 bg-white/70 p-5 text-sm leading-7 text-ink-700">
								No titles are shared in this section yet.
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</div>
</section>
