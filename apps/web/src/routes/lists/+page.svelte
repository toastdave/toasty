<script lang="ts">
import type { ActionData, PageData } from './$types'

const { data, form }: { data: PageData; form: ActionData } = $props()

function visibilityLabel(value: string) {
	if (value === 'private') {
		return 'Private'
	}

	if (value === 'unlisted') {
		return 'Unlisted'
	}

	return 'Public'
}
</script>

<svelte:head>
	<title>Lists | Toasty</title>
</svelte:head>

<section class="rounded-[2rem] border border-black/8 bg-white/80 p-8 shadow-[0_24px_90px_-60px_rgba(18,23,34,0.65)] backdrop-blur">
	<div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
		<div class="max-w-3xl">
			<p class="text-sm uppercase tracking-[0.28em] text-coral-400">Lists and collections</p>
			<h1 class="mt-3 font-display text-4xl tracking-tight text-ink-950">Editorial packs, personal shelves, and shareable anime lanes.</h1>
			<p class="mt-4 text-base leading-7 text-ink-700">
				Official lists now turn charts and seasonal boards into reusable collections, and signed-in users can publish their own watch lanes alongside tracked titles and ratings.
			</p>
		</div>

		<a class="rounded-full border border-black/8 bg-white px-5 py-3 text-sm font-semibold text-ink-900 hover:bg-cream-100" href="/anime/top">
			Browse anime to add
		</a>
	</div>

	{#if data.user}
		<div class="mt-8 grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
			<form class="rounded-[1.5rem] border border-black/8 bg-cream-50/80 p-6" method="POST" action="?/create">
				<p class="text-sm uppercase tracking-[0.2em] text-ink-700">Create a list</p>
				<h2 class="mt-2 text-2xl font-semibold text-ink-950">Start a personal collection.</h2>

				<label class="mt-5 block">
					<span class="text-sm font-semibold text-ink-950">Title</span>
					<input class="mt-2 block w-full rounded-[1rem] border border-black/8 bg-white px-4 py-3 text-sm text-ink-950" name="title" placeholder="Best emotional wreckers" required type="text" />
				</label>

				<label class="mt-5 block">
					<span class="text-sm font-semibold text-ink-950">Description</span>
					<textarea class="mt-2 block min-h-28 w-full rounded-[1rem] border border-black/8 bg-white px-4 py-3 text-sm text-ink-950" maxlength="500" name="description" placeholder="What makes this list worth opening?"></textarea>
				</label>

				<label class="mt-5 block">
					<span class="text-sm font-semibold text-ink-950">Visibility</span>
					<select class="mt-2 block w-full rounded-[1rem] border border-black/8 bg-white px-4 py-3 text-sm text-ink-950" name="visibility">
						<option value="public">Public</option>
						<option value="unlisted">Unlisted</option>
						<option value="private">Private</option>
					</select>
				</label>

				<button class="mt-6 rounded-full bg-ink-950 px-5 py-3 text-sm font-semibold text-cream-50 hover:bg-ink-800" type="submit">
					Create list
				</button>

				{#if form?.message}
					<p class="mt-4 rounded-[1.25rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{form.message}</p>
				{/if}
			</form>

			<div class="rounded-[1.5rem] border border-black/8 bg-cream-50/80 p-6">
				<div class="flex items-end justify-between gap-3">
					<div>
						<p class="text-sm uppercase tracking-[0.2em] text-ink-700">My lists</p>
						<h2 class="mt-2 text-2xl font-semibold text-ink-950">Your published and private shelves.</h2>
					</div>
					<a class="text-sm font-semibold text-coral-400 hover:text-coral-400/80" href="/me/profile">Edit profile</a>
				</div>

				{#if data.userLists.length > 0}
					<div class="mt-5 grid gap-4 md:grid-cols-2">
						{#each data.userLists as list (list.id)}
							<a class="rounded-[1.25rem] border border-black/8 bg-white/90 p-4 hover:border-coral-400/60 hover:bg-white" href={`/lists/${list.slug}`}>
								<p class="text-xs uppercase tracking-[0.2em] text-ink-700">{visibilityLabel(list.visibility)}</p>
								<h3 class="mt-2 text-lg font-semibold text-ink-950">{list.title}</h3>
								<p class="mt-2 text-sm text-ink-700">{list.itemCount} title{list.itemCount === 1 ? '' : 's'}</p>
								{#if list.description}
									<p class="mt-3 line-clamp-3 text-sm leading-6 text-ink-700">{list.description}</p>
								{/if}
							</a>
						{/each}
					</div>
				{:else}
					<div class="mt-5 rounded-[1.25rem] border border-dashed border-black/10 bg-white/70 p-5 text-sm leading-7 text-ink-700">
						Create a list here, then add anime from any detail page.
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<div class="mt-8 rounded-[1.5rem] border border-black/8 bg-cream-50/60 p-6">
		<div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
			<div>
				<p class="text-sm uppercase tracking-[0.2em] text-ink-700">Featured collections</p>
				<h2 class="mt-2 text-2xl font-semibold text-ink-950">Official and public list surfaces.</h2>
			</div>
			<p class="text-sm text-ink-700">Open a list to browse the full shelf.</p>
		</div>

		<div class="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
			{#each data.publicLists as list (list.id)}
				<a class="rounded-[1.25rem] border border-black/8 bg-white/90 p-4 hover:border-coral-400/60 hover:bg-white" href={`/lists/${list.slug}`}>
					<div class="flex items-start justify-between gap-3">
						<div>
							<p class="text-xs uppercase tracking-[0.2em] text-ink-700">{list.isOfficial ? 'Official list' : `By @${list.ownerHandle ?? 'toasty'}`}</p>
							<h3 class="mt-2 text-lg font-semibold text-ink-950">{list.title}</h3>
						</div>
						<span class="rounded-full bg-ink-950 px-3 py-1 text-sm font-semibold text-cream-50">{list.itemCount}</span>
					</div>

					{#if list.coverItems.length > 0}
						<div class="mt-4 flex gap-3">
							{#each list.coverItems as item (item.slug)}
								{#if item.posterUrl}
									<img alt={item.title} class="h-24 w-16 rounded-[1rem] border border-black/8 object-cover" src={item.posterUrl} />
								{/if}
							{/each}
						</div>
					{/if}

					{#if list.description}
						<p class="mt-4 line-clamp-3 text-sm leading-6 text-ink-700">{list.description}</p>
					{/if}
				</a>
			{/each}
		</div>
	</div>
</section>
