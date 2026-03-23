<script lang="ts">
import { page } from '$app/state'
import { normalizeRedirectTo } from '$lib/auth/redirects'

const redirectTo = $derived(normalizeRedirectTo(page.url.searchParams.get('redirectTo')))
</script>

<svelte:head>
	<title>Sign up | Toasty</title>
</svelte:head>

<section class="mx-auto max-w-xl rounded-[2rem] border border-black/8 bg-white/80 p-8 shadow-[0_24px_90px_-60px_rgba(18,23,34,0.65)] backdrop-blur">
	<p class="text-sm uppercase tracking-[0.28em] text-sky-300">User loop</p>
	<h1 class="mt-3 font-display text-4xl tracking-tight text-ink-950">Accounts arrive before ratings do.</h1>
	<p class="mt-4 text-base leading-7 text-ink-700">
		This page holds the future spot for account creation, saved progress, and community rating
		history. The scaffold keeps the auth and database contracts ready for that next sprint.
	</p>

	<div class="mt-6 rounded-[1.25rem] border border-black/8 bg-cream-50/80 p-5 text-sm text-ink-800">
		Redirect target preview: <span class="font-semibold">{redirectTo}</span>
	</div>
</section>
