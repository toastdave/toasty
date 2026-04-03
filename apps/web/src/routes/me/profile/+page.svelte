<script lang="ts">
import type { ActionData, PageData } from './$types'

const { data, form }: { data: PageData; form: ActionData } = $props()
</script>

<svelte:head>
	<title>Edit Profile | Toasty</title>
</svelte:head>

<section class="rounded-[2rem] border border-black/8 bg-white/80 p-8 shadow-[0_24px_90px_-60px_rgba(18,23,34,0.65)] backdrop-blur">
	<div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
		<div class="max-w-3xl">
			<p class="text-sm uppercase tracking-[0.28em] text-coral-400">Profile settings</p>
			<h1 class="mt-3 font-display text-4xl tracking-tight text-ink-950">Tune the public version of your Toasty identity.</h1>
			<p class="mt-4 text-base leading-7 text-ink-700">
				Update the name, handle, short bio, and avatar link that show up across your public profile and list pages.
			</p>
		</div>

		{#if data.publicProfilePath}
			<a class="rounded-full border border-black/8 bg-white px-5 py-3 text-sm font-semibold text-ink-900 hover:bg-cream-100" href={data.publicProfilePath}>
				View public profile
			</a>
		{/if}
	</div>

	<form class="mt-8 grid gap-6 lg:grid-cols-[0.72fr_1.28fr]" method="POST">
		<div class="rounded-[1.5rem] border border-black/8 bg-cream-50/80 p-6">
			<p class="text-sm uppercase tracking-[0.2em] text-ink-700">Preview</p>
			<div class="mt-5 flex items-center gap-4">
				{#if data.profile.image}
					<img alt={data.profile.name} class="h-20 w-20 rounded-full border border-black/8 object-cover" src={data.profile.image} />
				{:else}
					<div class="flex h-20 w-20 items-center justify-center rounded-full border border-black/8 bg-white text-2xl font-semibold text-ink-950">
						{data.profile.name.charAt(0).toUpperCase()}
					</div>
				{/if}

				<div>
					<h2 class="text-2xl font-semibold text-ink-950">{data.profile.name}</h2>
					<p class="mt-2 text-sm text-ink-700">@{data.profile.handle ?? 'handle-pending'}</p>
				</div>
			</div>

			<p class="mt-5 text-sm leading-7 text-ink-700">
				{data.profile.bio ?? 'Add a short bio so lists, ratings, and public profile views have a bit more personality.'}
			</p>
		</div>

		<div class="rounded-[1.5rem] border border-black/8 bg-cream-50/80 p-6">
			<div class="grid gap-5 md:grid-cols-2">
				<label class="block">
					<span class="text-sm font-semibold text-ink-950">Display name</span>
					<input class="mt-2 block w-full rounded-[1rem] border border-black/8 bg-white px-4 py-3 text-sm text-ink-950" name="name" required type="text" value={data.profile.name} />
				</label>

				<label class="block">
					<span class="text-sm font-semibold text-ink-950">Handle</span>
					<input class="mt-2 block w-full rounded-[1rem] border border-black/8 bg-white px-4 py-3 text-sm text-ink-950" name="handle" required type="text" value={data.profile.handle ?? ''} />
				</label>
			</div>

			<label class="mt-5 block">
				<span class="text-sm font-semibold text-ink-950">Avatar URL</span>
				<input class="mt-2 block w-full rounded-[1rem] border border-black/8 bg-white px-4 py-3 text-sm text-ink-950" name="image" placeholder="https://..." type="url" value={data.profile.image ?? ''} />
			</label>

			<label class="mt-5 block">
				<span class="text-sm font-semibold text-ink-950">Bio</span>
				<textarea class="mt-2 block min-h-32 w-full rounded-[1rem] border border-black/8 bg-white px-4 py-3 text-sm text-ink-950" maxlength="280" name="bio" placeholder="What do you chase: cozy shows, emotional wreckers, giant action swings...">{data.profile.bio ?? ''}</textarea>
			</label>

			<div class="mt-6 flex flex-wrap gap-3">
				<button class="rounded-full bg-ink-950 px-5 py-3 text-sm font-semibold text-cream-50 hover:bg-ink-800" type="submit">
					Save profile
				</button>
				<a class="rounded-full border border-black/8 bg-white px-5 py-3 text-sm font-semibold text-ink-900 hover:bg-cream-100" href="/me">
					Back to my anime
				</a>
			</div>

			{#if form?.message}
				<p class="mt-4 rounded-[1.25rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{form.message}</p>
			{/if}
		</div>
	</form>
</section>
