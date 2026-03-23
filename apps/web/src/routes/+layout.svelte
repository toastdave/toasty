<script lang="ts">
import { siteConfig } from '$lib/config/site'
import type { Snippet } from 'svelte'
import type { LayoutData } from './$types'

const { data, children }: { data: LayoutData; children: Snippet } = $props()
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
					<a class="rounded-full px-4 py-2 hover:bg-cream-100" href="/anime/top">Top anime</a>
					<a class="rounded-full px-4 py-2 hover:bg-cream-100" href="/anime/schedule">Schedule</a>
					{#if data.user}
						<span class="rounded-full bg-ink-950 px-4 py-2 text-cream-50">
							{data.user.name}
						</span>
					{:else}
						<a class="rounded-full bg-ink-950 px-4 py-2 text-cream-50 hover:bg-ink-800" href="/auth/sign-in">
							Sign in
						</a>
					{/if}
				</nav>
			</div>
		</header>

		{@render children()}
	</div>
</div>
