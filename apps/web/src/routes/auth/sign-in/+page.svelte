<script lang="ts">
import { goto, invalidateAll } from '$app/navigation'
import { page } from '$app/state'
import { authClient } from '$lib/auth-client'
import { normalizeRedirectTo } from '$lib/auth/redirects'
import type { PageData } from './$types'

const { data } = $props<{ data: PageData }>()

// biome-ignore lint/style/useConst: bind:value requires a mutable binding
let email = $state('')
let errorMessage = $state('')
let isPending = $state(false)
// biome-ignore lint/style/useConst: bind:value requires a mutable binding
let password = $state('')

const redirectTo = $derived(normalizeRedirectTo(page.url.searchParams.get('redirectTo')))

async function signInWithEmail(event: SubmitEvent) {
	event.preventDefault()
	isPending = true
	errorMessage = ''

	const result = await authClient.signIn.email({
		email,
		password,
		rememberMe: true,
	})

	isPending = false

	if (result.error) {
		errorMessage = result.error.message ?? 'Unable to sign in with email.'
		return
	}

	await invalidateAll()
	await goto(redirectTo)
}

async function signInWithProvider(provider: 'github' | 'google') {
	isPending = true
	errorMessage = ''

	const result = await authClient.signIn.social({
		callbackURL: redirectTo,
		provider,
	})

	if (result?.error) {
		isPending = false
		errorMessage = result.error.message ?? `Unable to continue with ${provider}.`
	}
}
</script>

<svelte:head>
	<title>Sign in | Toasty</title>
</svelte:head>

<section class="mx-auto flex min-h-[calc(100vh-8rem)] max-w-6xl items-center">
	<div class="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
		<div class="space-y-5 rounded-[2rem] border border-black/8 bg-white/78 p-8 shadow-[0_24px_90px_-54px_rgba(18,23,34,0.55)] backdrop-blur">
			<p class="font-display text-sm uppercase tracking-[0.3em] text-coral-400">Welcome back</p>
			<h1 class="font-display text-4xl leading-none text-ink-950 sm:text-5xl">
				Sign in and pick up where you left off.
			</h1>
			<p class="max-w-xl text-base leading-8 text-ink-700">
				Use your account to keep your browsing in one place, save what looks promising, and stay ready
				for the bigger collection features coming next.
			</p>
			<ul class="grid gap-3 text-sm text-ink-700 sm:grid-cols-2">
				<li class="rounded-2xl border border-black/8 bg-cream-50/80 px-4 py-3">Return to your picks faster</li>
				<li class="rounded-2xl border border-black/8 bg-cream-50/80 px-4 py-3">Keep your anime queue in one place</li>
				<li class="rounded-2xl border border-black/8 bg-cream-50/80 px-4 py-3">Use email or social login</li>
				<li class="rounded-2xl border border-black/8 bg-cream-50/80 px-4 py-3">Stay ready for future bracket season</li>
			</ul>
		</div>

		<div class="rounded-[2rem] border border-black/8 bg-white/85 p-8 shadow-[0_24px_90px_-54px_rgba(18,23,34,0.55)] backdrop-blur">
			<form class="space-y-5" onsubmit={signInWithEmail}>
				<div class="space-y-2">
					<label class="text-sm font-medium text-ink-900" for="email">Email</label>
					<input
						bind:value={email}
						class="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-ink-950 outline-none transition focus:border-coral-400"
						id="email"
						required
						type="email"
					/>
				</div>

				<div class="space-y-2">
					<label class="text-sm font-medium text-ink-900" for="password">Password</label>
					<input
						bind:value={password}
						class="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-ink-950 outline-none transition focus:border-coral-400"
						id="password"
						minlength="8"
						required
						type="password"
					/>
				</div>

				{#if errorMessage}
					<p class="rounded-2xl border border-coral-400/20 bg-coral-400/10 px-4 py-3 text-sm text-coral-400">
						{errorMessage}
					</p>
				{/if}

				<button class="w-full rounded-full bg-ink-950 px-5 py-3 text-sm font-semibold text-cream-50 disabled:cursor-not-allowed disabled:opacity-70" disabled={isPending} type="submit">
					{isPending ? 'Signing in...' : 'Sign in with email'}
				</button>
			</form>

			<div class="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.28em] text-ink-700/60">
				<div class="h-px flex-1 bg-black/10"></div>
				<span>or continue with</span>
				<div class="h-px flex-1 bg-black/10"></div>
			</div>

			<div class="grid gap-3 sm:grid-cols-2">
				<button class="rounded-full border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-ink-900 disabled:cursor-not-allowed disabled:opacity-50" disabled={isPending || !data.authProviders.google} onclick={() => signInWithProvider('google')} type="button">
					Continue with Google
				</button>
				<button class="rounded-full border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-ink-900 disabled:cursor-not-allowed disabled:opacity-50" disabled={isPending || !data.authProviders.github} onclick={() => signInWithProvider('github')} type="button">
					Continue with GitHub
				</button>
			</div>

			{#if !data.authProviders.google || !data.authProviders.github}
				<p class="mt-4 text-sm leading-7 text-ink-700">
					One or more social providers stay disabled until their environment variables are configured.
				</p>
			{/if}

			<p class="mt-6 text-sm text-ink-700">
				Need an account?
				<a class="font-semibold text-ink-950 underline decoration-coral-400 underline-offset-4" href={`/auth/sign-up?redirectTo=${encodeURIComponent(redirectTo)}`}>
					Create one
				</a>
			</p>
		</div>
	</div>
</section>
