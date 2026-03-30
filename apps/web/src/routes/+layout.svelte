<script lang="ts">
import { goto, invalidateAll } from '$app/navigation'
import { page } from '$app/state'
import { authClient } from '$lib/auth-client'
import { siteConfig } from '$lib/config/site'
import type { Snippet } from 'svelte'
import type { LayoutData } from './$types'

const { data, children }: { data: LayoutData; children: Snippet } = $props()
const navItems = [
	{ href: '/anime/top', label: 'Top anime' },
	{ href: '/anime/schedule', label: 'Schedule' },
]
const signInHref = $derived(`/auth/sign-in?redirectTo=${encodeURIComponent(page.url.pathname)}`)

async function signOut() {
	const result = await authClient.signOut()

	if (result.error) {
		console.error('Unable to sign out', result.error)
		return
	}

	await invalidateAll()
	await goto('/')
}
</script>

<svelte:head>
	<title>{siteConfig.name}</title>
	<meta
		name="description"
		content={siteConfig.description}
	/>
</svelte:head>

<div class="min-h-screen px-5 py-6 sm:px-8 lg:px-10">
	<div class="mx-auto flex max-w-7xl flex-col gap-6">
		<header class="rounded-[2rem] border border-black/8 bg-white/70 px-6 py-5 shadow-[0_24px_100px_-52px_rgba(18,23,34,0.6)] backdrop-blur sm:px-8">
			<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
				<div>
					<a class="font-display text-2xl font-semibold tracking-tight text-ink-950" href="/">
						{siteConfig.name}
					</a>
					<p class="mt-1 text-sm text-ink-700">{siteConfig.tagline}</p>
				</div>

				<nav class="flex flex-wrap items-center gap-2 text-sm font-medium text-ink-700">
					{#each navItems as item}
						<a
							class={`rounded-full px-4 py-2 transition-colors hover:bg-cream-100 ${page.url.pathname.startsWith(item.href) ? 'bg-cream-100 text-ink-950' : ''}`}
							href={item.href}
						>
							{item.label}
						</a>
					{/each}
					{#if data.user}
						<span class="rounded-full border border-black/8 bg-white/80 px-4 py-2 text-ink-950">
							{data.user.name}
						</span>
						<button class="rounded-full bg-ink-950 px-4 py-2 text-cream-50 hover:bg-ink-800" onclick={signOut} type="button">
							Sign out
						</button>
					{:else}
						<a class="rounded-full bg-ink-950 px-4 py-2 text-cream-50 hover:bg-ink-800" href={signInHref}>
							Sign in
						</a>
					{/if}
				</nav>
			</div>
		</header>

		{@render children()}
	</div>
</div>
