<script lang="ts">
import type { ActionData, PageData } from './$types'

const { data, form }: { data: PageData; form: ActionData } = $props()

const coreAxes = $derived(data.axes.filter((axis) => axis.group === 'core'))
const flavorAxes = $derived(data.axes.filter((axis) => axis.group === 'flavor'))

function optionsForAxis(maxValue: number, minValue: number) {
	return Array.from({ length: maxValue - minValue + 1 }, (_, index) => minValue + index)
}

function valueForAxis(axisKey: string) {
	return data.userRating?.scores[axisKey]?.toString() ?? ''
}
</script>

<svelte:head>
	<title>Rate {data.anime.title} | Toasty</title>
</svelte:head>

<section class="rounded-[2rem] border border-black/8 bg-white/80 p-8 shadow-[0_24px_90px_-60px_rgba(18,23,34,0.65)] backdrop-blur">
	<div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
		<div class="max-w-3xl">
			<p class="text-sm uppercase tracking-[0.28em] text-coral-400">Rate this anime</p>
			<h1 class="mt-3 font-display text-4xl tracking-tight text-ink-950">Build a richer taste profile for {data.anime.title}</h1>
			<p class="mt-4 text-base leading-7 text-ink-700">
				This first rating canvas keeps everything on one page. Fill out the core dimensions to save, then add flavor scores like action, romance, or comedy whenever you want more texture.
			</p>
		</div>

		<div class="rounded-[1.5rem] border border-black/8 bg-cream-50/80 px-5 py-4 text-sm text-ink-700">
			{#if data.userRating?.overallScore !== null && data.userRating?.overallScore !== undefined}
				<p>
					Current overall <span class="font-semibold text-ink-950">{data.userRating.overallScore}</span>
				</p>
				<p class="mt-2">Update any axis and save again whenever your take changes.</p>
			{:else}
				<p>Your first saved rating will create a Toasty-style overall score from the core dimensions.</p>
			{/if}
		</div>
	</div>

	<form class="mt-8 space-y-8" method="POST">
		<div class="rounded-[1.5rem] border border-black/8 bg-cream-50/80 p-6">
			<div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
				<div>
					<p class="text-sm uppercase tracking-[0.2em] text-ink-700">Core dimensions</p>
					<h2 class="mt-2 text-2xl font-semibold text-ink-950">These power the comparable Toasty score.</h2>
				</div>
				<p class="text-sm text-ink-700">All core dimensions are required to save.</p>
			</div>

			<div class="mt-5 grid gap-4 lg:grid-cols-2">
				{#each coreAxes as axis (axis.id)}
					<label class="rounded-[1.25rem] border border-black/8 bg-white/90 p-4">
						<div class="flex items-start justify-between gap-3">
							<div>
								<p class="text-xs uppercase tracking-[0.2em] text-ink-700">{axis.emoji} Core</p>
								<h3 class="mt-2 text-lg font-semibold text-ink-950">{axis.label}</h3>
							</div>
							<select class="rounded-full border border-black/8 bg-cream-50 px-4 py-2 text-sm font-semibold text-ink-950" name={axis.key} required value={valueForAxis(axis.key)}>
								<option value="" disabled selected={valueForAxis(axis.key) === ''}>Choose</option>
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
							<select class="rounded-full border border-black/8 bg-cream-50 px-4 py-2 text-sm font-semibold text-ink-950" name={axis.key} value={valueForAxis(axis.key)}>
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
			<textarea class="mt-4 min-h-32 w-full rounded-[1.25rem] border border-black/8 bg-white/90 px-4 py-3 text-sm text-ink-950 outline-none transition focus:border-coral-400/60" name="reviewText" placeholder="Optional: what made this one hit or miss for you?">{data.userRating?.reviewText ?? ''}</textarea>
		</div>

		<div class="flex flex-wrap items-center gap-3">
			<button class="rounded-full bg-ink-950 px-5 py-3 text-sm font-semibold text-cream-50 hover:bg-ink-800" type="submit">
				Save rating
			</button>
			<a class="rounded-full border border-black/8 bg-white/90 px-5 py-3 text-sm font-semibold text-ink-800 hover:bg-cream-100" href={`/anime/${data.anime.slug}`}>
				Back to detail page
			</a>
		</div>

		{#if form?.message}
			<p class="rounded-[1.25rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{form.message}</p>
		{/if}
	</form>
</section>
