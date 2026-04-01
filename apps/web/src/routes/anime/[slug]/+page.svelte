<script lang="ts">
import { page } from '$app/state'
import { checklistStatuses, getChecklistStatusMeta } from '$lib/checklists'
import type { ActionData, PageData } from './$types'

const { data, form }: { data: PageData; form: ActionData } = $props()
const signInHref = $derived(
	`/auth/sign-in?redirectTo=${encodeURIComponent(`${page.url.pathname}${page.url.search}`)}`
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
	</div>
</section>
