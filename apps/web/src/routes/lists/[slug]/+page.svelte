<script lang="ts">
import type { ActionData, PageData } from './$types'

const { data, form }: { data: PageData; form: ActionData } = $props()

const dateFormatter = new Intl.DateTimeFormat('en', {
	dateStyle: 'medium',
})

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
	<title>{data.list.title} | Toasty</title>
</svelte:head>

<section class="rounded-[2rem] border border-black/8 bg-white/80 p-8 shadow-[0_24px_90px_-60px_rgba(18,23,34,0.65)] backdrop-blur">
	<div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
		<div class="max-w-3xl">
			<p class="text-sm uppercase tracking-[0.28em] text-coral-400">
				{data.list.isOfficial ? 'Official list' : data.list.canEdit ? 'Your list' : 'Public list'}
			</p>
			<h1 class="mt-3 font-display text-4xl tracking-tight text-ink-950">{data.list.title}</h1>
			<p class="mt-4 text-base leading-7 text-ink-700">
				{data.list.description ?? 'A Toasty list built to collect anime that belong in the same lane.'}
			</p>
		</div>

		<div class="rounded-[1.5rem] border border-black/8 bg-cream-50/80 px-5 py-4 text-sm text-ink-700">
			<p>
				Updated <span class="font-semibold text-ink-950">{dateFormatter.format(data.list.updatedAt)}</span>
			</p>
			<p class="mt-2">
				{data.list.itemCount} title{data.list.itemCount === 1 ? '' : 's'}
			</p>
			{#if data.list.ownerHandle}
				<p class="mt-2">
					By <span class="font-semibold text-ink-950">@{data.list.ownerHandle}</span>
				</p>
			{/if}
		</div>
	</div>

	<div class="mt-8 grid gap-4 md:grid-cols-3">
		<div class="rounded-[1.5rem] border border-black/8 bg-cream-50/80 p-5">
			<p class="text-sm uppercase tracking-[0.2em] text-ink-700">Visibility</p>
			<p class="mt-3 text-2xl font-semibold text-ink-950">{visibilityLabel(data.list.visibility)}</p>
			<p class="mt-2 text-sm leading-6 text-ink-700">Share it publicly, keep it private, or pass it around by link only.</p>
		</div>

		<div class="rounded-[1.5rem] border border-black/8 bg-cream-50/80 p-5">
			<p class="text-sm uppercase tracking-[0.2em] text-ink-700">Release window</p>
			<p class="mt-3 text-2xl font-semibold text-ink-950">{data.list.story.releaseWindowLabel ?? 'Mixed era'}</p>
			<p class="mt-2 text-sm leading-6 text-ink-700">A quick read on how tightly this collection stays in one anime era.</p>
		</div>

		<div class="rounded-[1.5rem] border border-black/8 bg-cream-50/80 p-5">
			<p class="text-sm uppercase tracking-[0.2em] text-ink-700">Average source score</p>
			<p class="mt-3 text-2xl font-semibold text-ink-950">{data.list.story.averageSourceScore ?? 'TBD'}</p>
			<p class="mt-2 text-sm leading-6 text-ink-700">A rough quality baseline across the titles currently in this list.</p>
		</div>
	</div>

	{#if data.list.story.featuredGenres.length > 0}
		<div class="mt-6 flex flex-wrap gap-2 text-sm font-medium text-ink-800">
			{#each data.list.story.featuredGenres as genre (genre)}
				<span class="rounded-full bg-cream-100 px-3 py-2">{genre}</span>
			{/each}
		</div>
	{/if}

	{#if data.list.canEdit}
		<div class="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
			<form class="rounded-[1.5rem] border border-black/8 bg-cream-50/80 p-6" method="POST" action="?/update">
				<input name="listId" type="hidden" value={data.list.id} />
				<p class="text-sm uppercase tracking-[0.2em] text-ink-700">List settings</p>
				<h2 class="mt-2 text-2xl font-semibold text-ink-950">Polish the title, note, and sharing mode.</h2>

				<label class="mt-5 block">
					<span class="text-sm font-semibold text-ink-950">Title</span>
					<input class="mt-2 block w-full rounded-[1rem] border border-black/8 bg-white px-4 py-3 text-sm text-ink-950" name="title" required type="text" value={data.list.title} />
				</label>

				<label class="mt-5 block">
					<span class="text-sm font-semibold text-ink-950">Description</span>
					<textarea class="mt-2 block min-h-28 w-full rounded-[1rem] border border-black/8 bg-white px-4 py-3 text-sm text-ink-950" maxlength="500" name="description">{data.list.description ?? ''}</textarea>
				</label>

				<label class="mt-5 block">
					<span class="text-sm font-semibold text-ink-950">Visibility</span>
					<select class="mt-2 block w-full rounded-[1rem] border border-black/8 bg-white px-4 py-3 text-sm text-ink-950" name="visibility" value={data.list.visibility}>
						<option value="public">Public</option>
						<option value="unlisted">Unlisted</option>
						<option value="private">Private</option>
					</select>
				</label>

				<div class="mt-6 flex flex-wrap gap-3">
					<button class="rounded-full bg-ink-950 px-5 py-3 text-sm font-semibold text-cream-50 hover:bg-ink-800" type="submit">
						Save list details
					</button>
				</div>
			</form>

			<form class="rounded-[1.5rem] border border-red-200 bg-red-50/80 p-6" method="POST" action="?/delete">
				<input name="listId" type="hidden" value={data.list.id} />
				<p class="text-sm uppercase tracking-[0.2em] text-red-700">Delete list</p>
				<h2 class="mt-2 text-2xl font-semibold text-red-950">Remove this collection entirely.</h2>
				<p class="mt-4 text-sm leading-7 text-red-700">This deletes the shelf and every saved position inside it. Use this when the list is no longer useful.</p>
				<button class="mt-6 rounded-full bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700" type="submit">
					Delete list
				</button>
			</form>
		</div>
	{/if}

	{#if form?.message}
		<p class={`mt-6 rounded-[1.25rem] px-4 py-3 text-sm ${form.success ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-red-200 bg-red-50 text-red-700'}`}>
			{form.message}
		</p>
	{/if}

	<div class="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
		{#each data.list.items as item, index (item.id)}
			<div class="rounded-[1.25rem] border border-black/8 bg-cream-50/80 p-4">
				<a class="flex gap-4 hover:border-coral-400/60 hover:bg-white" href={`/anime/${item.slug}`}>
					{#if item.posterUrl}
						<img alt={item.title} class="h-28 w-20 rounded-[1.1rem] border border-black/8 object-cover" src={item.posterUrl} />
					{:else}
						<div class="flex h-28 w-20 items-center justify-center rounded-[1.1rem] border border-dashed border-black/10 bg-white text-xs text-ink-700">
							No art
						</div>
					{/if}

					<div class="min-w-0 flex-1">
						<p class="text-xs uppercase tracking-[0.2em] text-ink-700">#{item.position}</p>
						<h2 class="mt-2 line-clamp-2 text-lg font-semibold text-ink-950">{item.title}</h2>
						<p class="mt-2 text-sm text-ink-700">
							{item.score !== null ? `Source ${item.score}` : 'Score pending'}
							{item.year ? ` • ${item.year}` : ''}
						</p>
						{#if item.note}
							<p class="mt-3 line-clamp-4 text-sm leading-6 text-ink-700">{item.note}</p>
						{/if}
					</div>
				</a>

				{#if data.list.canEdit}
					<div class="mt-4 space-y-3 border-t border-black/8 pt-4">
						<form class="space-y-3" method="POST" action="?/updateNote">
							<input name="itemId" type="hidden" value={item.id} />
							<input name="listId" type="hidden" value={data.list.id} />
							<label class="block">
								<span class="text-xs uppercase tracking-[0.2em] text-ink-700">Curator note</span>
								<textarea class="mt-2 block min-h-20 w-full rounded-[1rem] border border-black/8 bg-white px-3 py-3 text-sm text-ink-950" maxlength="280" name="note">{item.note ?? ''}</textarea>
							</label>
							<button class="rounded-full border border-black/8 bg-white px-4 py-2 text-sm font-semibold text-ink-900 hover:bg-cream-100" type="submit">
								Save note
							</button>
						</form>

						<div class="flex flex-wrap gap-2">
							<form method="POST" action="?/move">
								<input name="direction" type="hidden" value="up" />
								<input name="itemId" type="hidden" value={item.id} />
								<input name="listId" type="hidden" value={data.list.id} />
								<button class="rounded-full border border-black/8 bg-white px-4 py-2 text-sm font-semibold text-ink-900 hover:bg-cream-100" disabled={index === 0} type="submit">
									Move up
								</button>
							</form>

							<form method="POST" action="?/move">
								<input name="direction" type="hidden" value="down" />
								<input name="itemId" type="hidden" value={item.id} />
								<input name="listId" type="hidden" value={data.list.id} />
								<button class="rounded-full border border-black/8 bg-white px-4 py-2 text-sm font-semibold text-ink-900 hover:bg-cream-100" disabled={index === data.list.items.length - 1} type="submit">
									Move down
								</button>
							</form>

							<form method="POST" action="?/remove">
								<input name="itemId" type="hidden" value={item.id} />
								<input name="listId" type="hidden" value={data.list.id} />
								<button class="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100" type="submit">
									Remove
								</button>
							</form>
						</div>
					</div>
				{/if}
			</div>
		{/each}
	</div>
</section>
