<script lang="ts">
import type { ActionData, PageData } from './$types'

const { data, form }: { data: PageData; form: ActionData } = $props()

function votePercent(votes: number, totalVotes: number) {
	if (totalVotes <= 0) {
		return 50
	}

	return Math.round((votes / totalVotes) * 100)
}
</script>

<svelte:head>
	<title>{data.matchup.entryA.title} vs {data.matchup.entryB.title} | Toasty</title>
</svelte:head>

<section class="rounded-[2rem] border border-black/8 bg-white/80 p-8 shadow-[0_24px_90px_-60px_rgba(18,23,34,0.65)] backdrop-blur">
	<div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
		<div class="max-w-3xl">
			<p class="text-sm uppercase tracking-[0.28em] text-coral-400">Tournament duel</p>
			<h1 class="mt-3 font-display text-4xl tracking-tight text-ink-950">{data.matchup.entryA.title} vs {data.matchup.entryB.title}</h1>
			<p class="mt-4 text-base leading-7 text-ink-700">
				{data.matchup.label}. This is the first interactive tournament layer: a stored bracket matchup with live vote totals for signed-in users.
			</p>
		</div>

		<div class="rounded-[1.5rem] border border-black/8 bg-cream-50/80 px-5 py-4 text-sm text-ink-700">
			<p>
				Status <span class="font-semibold text-ink-950">{data.matchup.status}</span>
			</p>
			<p class="mt-2">
				Total votes <span class="font-semibold text-ink-950">{data.matchup.totalVotes}</span>
			</p>
		</div>
	</div>

	<form class="mt-8 grid gap-6 lg:grid-cols-2" method="POST">
		<button class={`rounded-[1.75rem] border p-6 text-left transition-colors ${data.matchup.userVoteEntryId === data.matchup.entryAEntryId ? 'border-ink-950 bg-ink-950 text-cream-50' : 'border-black/8 bg-cream-50/80 text-ink-950 hover:bg-white'}`} name="voteEntryId" type="submit" value={data.matchup.entryAEntryId}>
			<p class={`text-xs uppercase tracking-[0.2em] ${data.matchup.userVoteEntryId === data.matchup.entryAEntryId ? 'text-cream-50/75' : 'text-ink-700'}`}>
				Seed #{data.matchup.entryA.seed} • {data.matchup.entryA.region}
			</p>
			<h2 class="mt-3 text-2xl font-semibold">{data.matchup.entryA.title}</h2>
			<p class={`mt-3 text-sm ${data.matchup.userVoteEntryId === data.matchup.entryAEntryId ? 'text-cream-50/85' : 'text-ink-700'}`}>
				{data.matchup.entryA.ratingSourceLabel === 'community' ? 'Community' : 'Source'} {data.matchup.entryA.ratingScore ?? 'TBD'}
				{data.matchup.entryA.ratingCount ? ` • ${data.matchup.entryA.ratingCount} rating${data.matchup.entryA.ratingCount === 1 ? '' : 's'}` : ''}
				{data.matchup.entryA.completedCount ? ` • ${data.matchup.entryA.completedCount} finished` : ''}
				{data.matchup.entryA.popularityRank ? ` • Popularity #${data.matchup.entryA.popularityRank}` : ''}
				{data.matchup.entryA.engagementCount ? ` • ${data.matchup.entryA.engagementCount} tracked` : ''}
			</p>
			<div class="mt-6">
				<div class={`h-3 rounded-full ${data.matchup.userVoteEntryId === data.matchup.entryAEntryId ? 'bg-cream-50/20' : 'bg-white/70'}`}>
					<div class={`h-full rounded-full ${data.matchup.userVoteEntryId === data.matchup.entryAEntryId ? 'bg-mango-300' : 'bg-coral-400'}`} style={`width: ${votePercent(data.matchup.entryAVotes, data.matchup.totalVotes)}%`}></div>
				</div>
				<p class={`mt-3 text-sm font-semibold ${data.matchup.userVoteEntryId === data.matchup.entryAEntryId ? 'text-cream-50' : 'text-ink-950'}`}>
					{data.matchup.entryAVotes} votes • {votePercent(data.matchup.entryAVotes, data.matchup.totalVotes)}%
				</p>
			</div>
		</button>

		<button class={`rounded-[1.75rem] border p-6 text-left transition-colors ${data.matchup.userVoteEntryId === data.matchup.entryBEntryId ? 'border-ink-950 bg-ink-950 text-cream-50' : 'border-black/8 bg-cream-50/80 text-ink-950 hover:bg-white'}`} name="voteEntryId" type="submit" value={data.matchup.entryBEntryId}>
			<p class={`text-xs uppercase tracking-[0.2em] ${data.matchup.userVoteEntryId === data.matchup.entryBEntryId ? 'text-cream-50/75' : 'text-ink-700'}`}>
				Seed #{data.matchup.entryB.seed} • {data.matchup.entryB.region}
			</p>
			<h2 class="mt-3 text-2xl font-semibold">{data.matchup.entryB.title}</h2>
			<p class={`mt-3 text-sm ${data.matchup.userVoteEntryId === data.matchup.entryBEntryId ? 'text-cream-50/85' : 'text-ink-700'}`}>
				{data.matchup.entryB.ratingSourceLabel === 'community' ? 'Community' : 'Source'} {data.matchup.entryB.ratingScore ?? 'TBD'}
				{data.matchup.entryB.ratingCount ? ` • ${data.matchup.entryB.ratingCount} rating${data.matchup.entryB.ratingCount === 1 ? '' : 's'}` : ''}
				{data.matchup.entryB.completedCount ? ` • ${data.matchup.entryB.completedCount} finished` : ''}
				{data.matchup.entryB.popularityRank ? ` • Popularity #${data.matchup.entryB.popularityRank}` : ''}
				{data.matchup.entryB.engagementCount ? ` • ${data.matchup.entryB.engagementCount} tracked` : ''}
			</p>
			<div class="mt-6">
				<div class={`h-3 rounded-full ${data.matchup.userVoteEntryId === data.matchup.entryBEntryId ? 'bg-cream-50/20' : 'bg-white/70'}`}>
					<div class={`h-full rounded-full ${data.matchup.userVoteEntryId === data.matchup.entryBEntryId ? 'bg-mango-300' : 'bg-coral-400'}`} style={`width: ${votePercent(data.matchup.entryBVotes, data.matchup.totalVotes)}%`}></div>
				</div>
				<p class={`mt-3 text-sm font-semibold ${data.matchup.userVoteEntryId === data.matchup.entryBEntryId ? 'text-cream-50' : 'text-ink-950'}`}>
					{data.matchup.entryBVotes} votes • {votePercent(data.matchup.entryBVotes, data.matchup.totalVotes)}%
				</p>
			</div>
		</button>
	</form>

	<div class="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-[1.5rem] border border-black/8 bg-cream-50/70 px-5 py-4 text-sm text-ink-700">
		<div>
			{#if data.user}
				{#if data.matchup.userVoteEntryId}
					You voted in this matchup. Tap either side again to switch your pick.
				{:else}
					Cast your vote to help shape the opening round.
				{/if}
			{:else}
				Sign in to vote in this matchup.
			{/if}
		</div>
		<a class="font-semibold text-coral-400 hover:text-coral-400/80" href={`/tournaments/anime/${data.matchup.year}/bracket`}>
			Back to bracket
		</a>
	</div>

	{#if form?.message}
		<p class="mt-4 rounded-[1.25rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{form.message}</p>
	{/if}
</section>
