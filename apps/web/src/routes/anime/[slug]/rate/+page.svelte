<script lang="ts">
import { summarizeAnimeRatingDraft } from '$lib/ratings'
import type { ActionData, PageData } from './$types'

const { data, form }: { data: PageData; form: ActionData } = $props()

const coreAxes = $derived(data.axes.filter((axis) => axis.group === 'core'))
const flavorAxes = $derived(data.axes.filter((axis) => axis.group === 'flavor'))
const draftScores = $state<Record<string, string>>(
	Object.fromEntries(
		data.axes.map((axis) => [
			axis.key,
			data.userRating?.scores[axis.key] !== undefined
				? String(data.userRating.scores[axis.key])
				: '',
		])
	)
)

const dateFormatter = new Intl.DateTimeFormat('en', {
	dateStyle: 'medium',
	timeStyle: 'short',
})

const liveSummary = $derived.by(() => summarizeAnimeRatingDraft(toNumericScores(draftScores)))

function optionsForAxis(maxValue: number, minValue: number) {
	return Array.from({ length: maxValue - minValue + 1 }, (_, index) => minValue + index)
}

function scoreForAxis(axisKey: string) {
	return draftScores[axisKey] ?? ''
}

function setAxisScore(axisKey: string, value: string) {
	draftScores[axisKey] = value
}

function toNumericScores(values: Record<string, string>) {
	return Object.fromEntries(
		Object.entries(values).flatMap(([key, value]) => {
			if (value.length === 0) {
				return []
			}

			const parsed = Number(value)

			return Number.isFinite(parsed) ? [[key, parsed]] : []
		})
	) as Record<string, number>
}
</script>

<svelte:head>
	<title>Rate {data.anime.title} | Toasty</title>
</svelte:head>

<section class="rounded-[2rem] border border-black/8 bg-white/80 p-8 shadow-[0_24px_90px_-60px_rgba(18,23,34,0.65)] backdrop-blur">
	<div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
		<div class="max-w-3xl">
			<p class="text-sm uppercase tracking-[0.28em] text-coral-400">Rate this anime</p>
			<h1 class="mt-3 font-display text-4xl tracking-tight text-ink-950 sm:text-5xl">
				Build a richer taste profile for {data.anime.title}
			</h1>
			<p class="mt-4 text-base leading-7 text-ink-700">
				The Toasty rating canvas now supports live feedback and partial drafts. Save core scores when you are ready to publish a comparable Toasty rating, or leave a draft and return later.
			</p>
		</div>

		<div class="rounded-[1.5rem] border border-black/8 bg-cream-50/80 px-5 py-4 text-sm text-ink-700">
			{#if data.userRating}
				<p>
					Last saved <span class="font-semibold text-ink-950">{dateFormatter.format(data.userRating.updatedAt)}</span>
				</p>
				<p class="mt-2">
					Status
					<span class="font-semibold text-ink-950">
						{data.userRating.isDraft ? 'Draft' : `Published at ${data.userRating.overallScore}`}
					</span>
				</p>
			{:else}
				<p>Your first save can be a draft. Toasty only publishes the overall score once every core dimension is filled.</p>
			{/if}
		</div>
	</div>

	<form class="mt-8 space-y-8" method="POST">
		<div class="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
			<div class="rounded-[1.5rem] border border-black/8 bg-cream-50/80 p-6">
				<div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
					<div>
						<p class="text-sm uppercase tracking-[0.2em] text-ink-700">Core dimensions</p>
						<h2 class="mt-2 text-2xl font-semibold text-ink-950">These power the comparable Toasty score.</h2>
					</div>
					<p class="text-sm text-ink-700">Fill all {liveSummary.coreTotalCount} to publish.</p>
				</div>

				<div class="mt-5 grid gap-4 lg:grid-cols-2">
					{#each coreAxes as axis (axis.id)}
						<label class="rounded-[1.25rem] border border-black/8 bg-white/90 p-4">
							<div class="flex items-start justify-between gap-3">
								<div>
									<p class="text-xs uppercase tracking-[0.2em] text-ink-700">{axis.emoji} Core</p>
									<h3 class="mt-2 text-lg font-semibold text-ink-950">{axis.label}</h3>
								</div>
								<select
									class="rounded-full border border-black/8 bg-cream-50 px-4 py-2 text-sm font-semibold text-ink-950"
									name={axis.key}
									onchange={(event) => setAxisScore(axis.key, event.currentTarget.value)}
									value={scoreForAxis(axis.key)}
								>
									<option value="">Choose</option>
									{#each optionsForAxis(axis.maxValue, axis.minValue) as value (value)}
										<option value={value}>{value}</option>
									{/each}
								</select>
							</div>
							<p class="mt-3 text-sm leading-6 text-ink-700">{axis.description}</p>
						</label>
					{/each}
				</div>
			</div>

			<div class="rounded-[1.5rem] border border-black/8 bg-ink-950 p-6 text-cream-50">
				<p class="text-sm uppercase tracking-[0.2em] text-mango-300">Live readout</p>
				<h2 class="mt-2 text-2xl font-semibold">Your Toasty canvas status</h2>

				<div class="mt-5 rounded-[1.25rem] border border-white/10 bg-white/6 p-4">
					<p class="text-sm text-cream-50/80">Core progress</p>
					<p class="mt-2 text-3xl font-semibold text-cream-50">
						{liveSummary.coreCompleteCount}/{liveSummary.coreTotalCount}
					</p>
					<div class="mt-4 h-3 rounded-full bg-white/10">
						<div
							class="h-full rounded-full bg-mango-300"
							style={`width: ${(liveSummary.coreCompleteCount / liveSummary.coreTotalCount) * 100}%`}
						></div>
					</div>
					<p class="mt-3 text-sm leading-6 text-cream-50/80">
						{#if liveSummary.isComplete}
							Everything needed for a published Toasty score is in place.
						{:else}
							Save a draft anytime. Publish once every core dimension is filled.
						{/if}
					</p>
				</div>

				<div class="mt-4 grid gap-4 sm:grid-cols-2">
					<div class="rounded-[1.25rem] border border-white/10 bg-white/6 p-4">
						<p class="text-sm text-cream-50/80">Live overall</p>
						<p class="mt-2 text-3xl font-semibold text-cream-50">
							{liveSummary.overallScore ?? 'Draft'}
						</p>
						<p class="mt-3 text-sm leading-6 text-cream-50/80">
							Only published when the core dimensions are complete.
						</p>
					</div>

					<div class="rounded-[1.25rem] border border-white/10 bg-white/6 p-4">
						<p class="text-sm text-cream-50/80">Flavor tags</p>
						{#if liveSummary.tags.length > 0}
							<div class="mt-3 flex flex-wrap gap-2">
								{#each liveSummary.tags as tag (tag)}
									<span class="rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-cream-50">{tag}</span>
								{/each}
							</div>
						{:else}
							<p class="mt-3 text-sm leading-6 text-cream-50/80">
								Flavor tags appear once a few optional axes land above the noise floor.
							</p>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<div class="rounded-[1.5rem] border border-black/8 bg-cream-50/80 p-6">
			<div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
				<div>
					<p class="text-sm uppercase tracking-[0.2em] text-ink-700">Flavor dimensions</p>
					<h2 class="mt-2 text-2xl font-semibold text-ink-950">Add the energy profile when you want more texture.</h2>
				</div>
				<p class="text-sm text-ink-700">Optional, but useful for future recommendations and profile vibes.</p>
			</div>

			<div class="mt-5 grid gap-4 lg:grid-cols-2">
				{#each flavorAxes as axis (axis.id)}
					<label class="rounded-[1.25rem] border border-black/8 bg-white/90 p-4">
						<div class="flex items-start justify-between gap-3">
							<div>
								<p class="text-xs uppercase tracking-[0.2em] text-ink-700">{axis.emoji} Flavor</p>
								<h3 class="mt-2 text-lg font-semibold text-ink-950">{axis.label}</h3>
							</div>
							<select
								class="rounded-full border border-black/8 bg-cream-50 px-4 py-2 text-sm font-semibold text-ink-950"
								name={axis.key}
								onchange={(event) => setAxisScore(axis.key, event.currentTarget.value)}
								value={scoreForAxis(axis.key)}
							>
								<option value="">Skip for now</option>
								{#each optionsForAxis(axis.maxValue, axis.minValue) as value (value)}
									<option value={value}>{value}</option>
								{/each}
							</select>
						</div>
						<p class="mt-3 text-sm leading-6 text-ink-700">{axis.description}</p>
					</label>
				{/each}
			</div>
		</div>

		<div class="rounded-[1.5rem] border border-black/8 bg-cream-50/80 p-6">
			<p class="text-sm uppercase tracking-[0.2em] text-ink-700">Short note</p>
			<textarea
				class="mt-4 min-h-32 w-full rounded-[1.25rem] border border-black/8 bg-white/90 px-4 py-3 text-sm text-ink-950 outline-none transition focus:border-coral-400/60"
				name="reviewText"
				placeholder="Optional: what made this one hit or miss for you?"
			>{data.userRating?.reviewText ?? ''}</textarea>
		</div>

		<div class="flex flex-wrap items-center gap-3">
			<button class="rounded-full border border-black/8 bg-white/90 px-5 py-3 text-sm font-semibold text-ink-900 hover:bg-cream-100" name="intent" type="submit" value="save_draft">
				Save draft
			</button>
			<button class="rounded-full bg-ink-950 px-5 py-3 text-sm font-semibold text-cream-50 hover:bg-ink-800" name="intent" type="submit" value="save_rating">
				Save rating
			</button>
			<a class="rounded-full border border-black/8 bg-white/90 px-5 py-3 text-sm font-semibold text-ink-800 hover:bg-cream-100" href={`/anime/${data.anime.slug}`}>
				Back to detail page
			</a>
		</div>

		{#if form?.message}
			<p class={`rounded-[1.25rem] px-4 py-3 text-sm ${form.success ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-red-200 bg-red-50 text-red-700'}`}>
				{form.message}
			</p>
		{/if}
	</form>
</section>
