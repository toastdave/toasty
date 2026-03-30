<script lang="ts">
import { page } from '$app/state'

const props = $props<{ error: App.Error; status: number }>()
</script>

<svelte:head>
	<title>{props.status} | Toasty</title>
</svelte:head>

<section class="mx-auto max-w-3xl rounded-[2rem] border border-black/8 bg-white/85 p-8 shadow-[0_24px_90px_-54px_rgba(18,23,34,0.55)] backdrop-blur sm:p-10">
	<p class="text-sm uppercase tracking-[0.28em] text-coral-400">{props.status === 404 ? 'Lost in the stack' : 'Temporary setback'}</p>
	<h1 class="mt-3 font-display text-4xl tracking-tight text-ink-950 sm:text-5xl">
		{props.status === 404 ? 'That anime page slipped through the cracks.' : 'Toasty hit a snag.'}
	</h1>
	<p class="mt-5 max-w-2xl text-base leading-8 text-ink-700">
		{props.error?.message || 'Something went sideways while loading this page.'}
	</p>

	<div class="mt-8 flex flex-wrap gap-3">
		<a class="rounded-full bg-ink-950 px-5 py-3 text-sm font-semibold text-cream-50" href="/">
			Go home
		</a>
		<a class="rounded-full border border-black/8 bg-white px-5 py-3 text-sm font-semibold text-ink-950" href="/anime/top">
			Browse top anime
		</a>
		<a class="rounded-full border border-black/8 bg-white px-5 py-3 text-sm font-semibold text-ink-950" href="/anime/schedule">
			Open the schedule
		</a>
	</div>

	<p class="mt-6 text-sm text-ink-700">
		Requested path: <span class="font-medium text-ink-950">{page.url.pathname}</span>
	</p>
</section>
