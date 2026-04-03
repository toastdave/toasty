<script lang="ts">
import { page } from '$app/state'
import { checklistStatuses, getChecklistStatusMeta } from '$lib/checklists'
import type { ActionData, PageData } from './$types'

const { data, form }: { data: PageData; form: ActionData } = $props()
const signInHref = $derived(
	`/auth/sign-in?redirectTo=${encodeURIComponent(`${page.url.pathname}${page.url.search}`)}`
)
const rateSignInHref = $derived(
	`/auth/sign-in?redirectTo=${encodeURIComponent(`/anime/${data.anime.slug}/rate`)}`
)
const activeChecklistMeta = $derived(
	data.checklistEntry ? getChecklistStatusMeta(data.checklistEntry.status) : null
)
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
			<p><span class="font-semibold">Progress:</span> {data.anime.percentComplete !== null ? `${data.anime.percentComplete}% through the run` : 'Still settling into its release window'}</p>
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

		<div class="mt-8 rounded-[1.5rem] border border-black/8 bg-cream-50/80 p-5">
			<div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
				<div>
					<p class="text-sm uppercase tracking-[0.2em] text-ink-700">Personal checklist</p>
					{#if data.user}
						<h2 class="mt-2 text-xl font-semibold text-ink-950">
							{activeChecklistMeta ? activeChecklistMeta.label : 'Start your personal watch queue'}
						</h2>
						<p class="mt-2 max-w-2xl text-sm leading-6 text-ink-700">
							{activeChecklistMeta ? activeChecklistMeta.description : getChecklistStatusMeta('planned').emptyHeading}
						</p>
					{:else}
						<h2 class="mt-2 text-xl font-semibold text-ink-950">Track what you want to watch next</h2>
						<p class="mt-2 max-w-2xl text-sm leading-6 text-ink-700">
							Sign in to build a running queue, mark active watches, and keep finished anime close at hand.
						</p>
					{/if}
				</div>

				{#if data.user && data.checklistEntry}
					<a class="rounded-full border border-black/8 bg-white px-4 py-2 text-sm font-semibold text-ink-800 hover:bg-cream-100" href="/me">
						View my anime
					</a>
				{/if}
			</div>

			{#if data.user}
				<form class="mt-5" method="POST">
					<div class="grid gap-3 sm:grid-cols-2">
						{#each checklistStatuses as status (status)}
							{@const meta = getChecklistStatusMeta(status)}
							<button
								class={`rounded-[1.25rem] border px-4 py-4 text-left transition-colors ${data.checklistEntry?.status === status ? 'border-ink-950 bg-ink-950 text-cream-50' : 'border-black/8 bg-white text-ink-900 hover:bg-cream-100'}`}
								name="status"
								type="submit"
								value={status}
							>
								<span class="block text-sm font-semibold">{meta.actionLabel}</span>
								<span class={`mt-2 block text-sm leading-6 ${data.checklistEntry?.status === status ? 'text-cream-50/85' : 'text-ink-700'}`}>
									{meta.description}
								</span>
							</button>
						{/each}
					</div>

					<div class="mt-4 flex flex-wrap items-center gap-3 text-sm text-ink-700">
						{#if data.checklistEntry}
							<p>
								Currently marked as <span class="font-semibold text-ink-950">{activeChecklistMeta?.label}</span>.
							</p>
							<button class="rounded-full border border-black/8 px-4 py-2 font-semibold text-ink-800 hover:bg-white" name="intent" type="submit" value="clear">
								Remove from my list
							</button>
						{:else}
							<p>Choose a state to start tracking this anime.</p>
						{/if}
					</div>
				</form>
			{:else}
				<div class="mt-5">
					<a class="inline-flex rounded-full bg-ink-950 px-5 py-3 text-sm font-semibold text-cream-50 hover:bg-ink-800" href={signInHref}>
						Sign in to track this anime
					</a>
				</div>
			{/if}

			{#if form?.message}
				<p class="mt-4 rounded-[1.25rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{form.message}</p>
			{/if}
		</div>

		<div class="mt-6 rounded-[1.5rem] border border-black/8 bg-cream-50/80 p-5">
			<div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
				<div>
					<p class="text-sm uppercase tracking-[0.2em] text-ink-700">Save to a list</p>
					<h2 class="mt-2 text-xl font-semibold text-ink-950">Turn this pick into part of a bigger shelf.</h2>
					<p class="mt-2 max-w-2xl text-sm leading-6 text-ink-700">
						Use lists for starter packs, seasonal shortlists, comfort-watch piles, or any other anime lane you want to share.
					</p>
				</div>
				<a class="text-sm font-semibold text-coral-400 hover:text-coral-400/80" href="/lists">Open all lists</a>
			</div>

			{#if data.user}
				{#if data.userLists.length > 0}
					<form class="mt-5 grid gap-4 lg:grid-cols-[0.7fr_1fr_auto]" method="POST">
						<input name="intent" type="hidden" value="add_to_list" />
						<label class="block">
							<span class="text-sm font-semibold text-ink-950">List</span>
							<select class="mt-2 block w-full rounded-[1rem] border border-black/8 bg-white px-4 py-3 text-sm text-ink-950" name="listId">
								{#each data.userLists as list (list.id)}
									<option value={list.id}>{list.title} ({list.itemCount})</option>
								{/each}
							</select>
						</label>

						<label class="block">
							<span class="text-sm font-semibold text-ink-950">Optional note</span>
							<input class="mt-2 block w-full rounded-[1rem] border border-black/8 bg-white px-4 py-3 text-sm text-ink-950" maxlength="280" name="note" placeholder="Why this belongs in the list" type="text" />
						</label>

						<div class="flex items-end">
							<button class="w-full rounded-full bg-ink-950 px-5 py-3 text-sm font-semibold text-cream-50 hover:bg-ink-800" type="submit">
								Add to list
							</button>
						</div>
					</form>
				{:else}
					<div class="mt-5 rounded-[1.25rem] border border-dashed border-black/10 bg-white/70 p-5 text-sm leading-7 text-ink-700">
						You do not have any lists yet. Start one on the <a class="font-semibold text-coral-400 hover:text-coral-400/80" href="/lists">lists page</a>, then return here to add this anime.
					</div>
				{/if}
			{:else}
				<div class="mt-5">
					<a class="inline-flex rounded-full bg-ink-950 px-5 py-3 text-sm font-semibold text-cream-50 hover:bg-ink-800" href={signInHref}>
						Sign in to save to lists
					</a>
				</div>
			{/if}
		</div>

		<div class="mt-6 rounded-[1.5rem] border border-black/8 bg-cream-50/80 p-5">
			<div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
				<div>
					<p class="text-sm uppercase tracking-[0.2em] text-ink-700">Toasty rating</p>
					<h2 class="mt-2 text-xl font-semibold text-ink-950">
						{#if data.userRating?.overallScore !== null && data.userRating?.overallScore !== undefined}
							Your take lands at {data.userRating.overallScore}
						{:else}
							Rate this anime with more than one number
						{/if}
					</h2>
					<p class="mt-2 max-w-2xl text-sm leading-6 text-ink-700">
						{#if data.user}
							{#if data.userRating?.tags && data.userRating.tags.length > 0}
								Current flavor tags: {data.userRating.tags.join(', ')}.
							{:else}
								Save the core dimensions first, then add action, romance, comedy, and other flavor signals whenever you want more texture.
							{/if}
						{:else}
							Sign in to build a richer Toasty score and shape future recommendations.
						{/if}
					</p>
				</div>

				<a class="rounded-full bg-ink-950 px-5 py-3 text-sm font-semibold text-cream-50 hover:bg-ink-800" href={data.user ? `/anime/${data.anime.slug}/rate` : rateSignInHref}>
					{data.user ? 'Open rating canvas' : 'Sign in to rate'}
				</a>
			</div>
		</div>

		<div class="mt-6 rounded-[1.5rem] border border-black/8 bg-cream-50/80 p-5">
			<div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
				<div>
					<p class="text-sm uppercase tracking-[0.2em] text-ink-700">Community pulse</p>
					<h2 class="mt-2 text-xl font-semibold text-ink-950">
						{#if data.communityRating && data.communityRating.averageOverall !== null}
							Community Toasty score {data.communityRating.averageOverall}
						{:else}
							Early signal board
						{/if}
					</h2>
					<p class="mt-2 max-w-2xl text-sm leading-6 text-ink-700">
						{#if data.communityRating && data.communityRating.ratedCount > 0}
							Built from {data.communityRating.ratedCount} rating{data.communityRating.ratedCount === 1 ? '' : 's'} and {data.communityRating.completedCount} completion{data.communityRating.completedCount === 1 ? '' : 's'} so far.
						{:else}
							Once a few Toasty ratings land, this panel starts surfacing the strongest shared reactions and recommendation strength.
						{/if}
					</p>
				</div>

				{#if data.communityRating}
					<div class="rounded-[1.25rem] border border-black/8 bg-white/80 px-4 py-3 text-sm text-ink-700">
						<p>
							Tracked <span class="font-semibold text-ink-950">{data.communityRating.trackedCount}</span>
						</p>
						{#if data.communityRating.averageRecommendationStrength !== null}
							<p class="mt-2">
								Rec strength <span class="font-semibold text-ink-950">{data.communityRating.averageRecommendationStrength}</span>
							</p>
						{/if}
					</div>
				{/if}
			</div>

			{#if data.communityRating && (data.communityRating.topTags.length > 0 || data.communityRating.strongestAxes.length > 0)}
				<div class="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
					<div class="rounded-[1.25rem] border border-black/8 bg-white/90 p-4">
						<p class="text-xs uppercase tracking-[0.2em] text-ink-700">Shared flavor tags</p>
						{#if data.communityRating.topTags.length > 0}
							<div class="mt-3 flex flex-wrap gap-2">
								{#each data.communityRating.topTags as tag (tag)}
									<span class="rounded-full bg-cream-50 px-3 py-2 text-sm font-semibold text-ink-950">{tag}</span>
								{/each}
							</div>
						{:else}
							<p class="mt-3 text-sm leading-6 text-ink-700">Community flavor tags are still settling in.</p>
						{/if}
					</div>

					<div class="rounded-[1.25rem] border border-black/8 bg-white/90 p-4">
						<p class="text-xs uppercase tracking-[0.2em] text-ink-700">Strongest shared dimensions</p>
						{#if data.communityRating.strongestAxes.length > 0}
							<div class="mt-3 space-y-3">
								{#each data.communityRating.strongestAxes as axis (axis.key)}
									<div class="flex items-center justify-between gap-3 rounded-[1rem] border border-black/8 bg-cream-50/70 px-3 py-3 text-sm text-ink-700">
										<span class="font-semibold text-ink-950">{axis.label}</span>
										<span>Avg {axis.average}</span>
									</div>
								{/each}
							</div>
						{:else}
							<p class="mt-3 text-sm leading-6 text-ink-700">Not enough community rating depth yet.</p>
						{/if}
					</div>
				</div>
			{/if}
		</div>

		<div class="mt-6 flex flex-wrap gap-2 text-sm font-medium text-ink-800">
			{#each data.anime.genres as genre (genre)}
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
				<p class="text-sm uppercase tracking-[0.2em] text-ink-700">At a glance</p>
				<ul class="mt-4 space-y-2 text-sm text-ink-800">
					<li>Duration: {data.anime.duration ?? 'Unknown'}</li>
					<li>Source: {data.anime.source ?? 'Unknown'}</li>
					<li>Rating: {data.anime.rating ?? 'Unknown'}</li>
					<li>Timezone: {data.anime.broadcastTimeZone ?? 'Unknown'}</li>
				</ul>
			</div>

			<div class="rounded-[1.5rem] border border-black/8 bg-cream-50/80 p-5">
				<p class="text-sm uppercase tracking-[0.2em] text-ink-700">Good to know before you start</p>
				<ul class="mt-4 space-y-2 text-sm text-ink-800">
					<li>Studios: {data.anime.studios.length > 0 ? data.anime.studios.slice(0, 2).join(', ') : 'Still being filled in'}</li>
					<li>Themes: {data.anime.themes.length > 0 ? data.anime.themes.slice(0, 2).join(', ') : 'Varied'}</li>
					<li>Audience: {data.anime.demographics.length > 0 ? data.anime.demographics.join(', ') : 'General anime audience'}</li>
					<li>
						<a class="font-semibold text-coral-400 hover:text-coral-400/80" href={data.anime.broadcastDay ? `/anime/schedule?day=${data.anime.broadcastDay.toLowerCase()}` : '/anime/schedule'}>
							See where it lands in the schedule
						</a>
					</li>
				</ul>
			</div>
		</div>

		{#if data.recommendationShelf}
			<div class="mt-8 rounded-[1.5rem] border border-black/8 bg-cream-50/80 p-6">
				<div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
					<div class="max-w-2xl">
						<p class="text-sm uppercase tracking-[0.2em] text-ink-700">Recommended next</p>
						<h2 class="mt-2 text-2xl font-semibold text-ink-950">{data.recommendationShelf.heading}</h2>
						<p class="mt-3 text-sm leading-6 text-ink-700">{data.recommendationShelf.description}</p>
					</div>
					<a class="text-sm font-semibold text-coral-400 hover:text-coral-400/80" href="/anime/top">Browse top anime</a>
				</div>

				<div class="mt-5 grid gap-4 lg:grid-cols-2">
					{#each data.recommendationShelf.items as anime (anime.slug)}
						<a class="flex gap-4 rounded-[1.25rem] border border-black/8 bg-white/90 p-4 hover:border-coral-400/60 hover:bg-white" href={`/anime/${anime.slug}`}>
							{#if anime.posterUrl}
								<img alt={anime.title} class="h-28 w-20 rounded-[1.1rem] border border-black/8 object-cover" src={anime.posterUrl} />
							{:else}
								<div class="flex h-28 w-20 items-center justify-center rounded-[1.1rem] border border-dashed border-black/10 bg-cream-50 text-xs text-ink-700">
									No art
								</div>
							{/if}

							<div class="min-w-0 flex-1">
								<div class="flex items-start justify-between gap-4">
									<div>
										<p class="text-xs uppercase tracking-[0.2em] text-ink-700">{anime.matchReason}</p>
										<h3 class="mt-2 line-clamp-2 text-lg font-semibold text-ink-950">{anime.title}</h3>
									</div>
									{#if anime.score !== null}
										<span class="rounded-full bg-ink-950 px-3 py-1 text-sm font-semibold text-cream-50">{anime.score}</span>
									{/if}
								</div>

								<p class="mt-3 text-sm text-ink-700">
									{anime.broadcastLabel ?? anime.status ?? 'Schedule pending'}
									{anime.episodes ? ` • ${anime.episodes} eps` : ''}
								</p>
								<p class="mt-4 line-clamp-3 text-sm leading-6 text-ink-700">
									{anime.synopsis ?? 'Open the detail page to see more about this recommendation.'}
								</p>
							</div>
						</a>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</section>
