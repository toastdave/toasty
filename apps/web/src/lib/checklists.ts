export const checklistStatuses = ['planned', 'in_progress', 'done', 'abandoned'] as const

export type ChecklistStatus = (typeof checklistStatuses)[number]

type ChecklistStatusMeta = {
	actionLabel: string
	description: string
	emptyHeading: string
	label: string
}

const checklistStatusMeta: Record<ChecklistStatus, ChecklistStatusMeta> = {
	planned: {
		actionLabel: 'Plan to watch',
		description: 'Keep it in your queue for a future anime night.',
		emptyHeading: 'Build a watch queue that survives tonight.',
		label: 'Planned',
	},
	in_progress: {
		actionLabel: 'Watching now',
		description: 'Mark it as part of your current rotation.',
		emptyHeading: 'Keep tabs on what is in your current rotation.',
		label: 'In progress',
	},
	done: {
		actionLabel: 'Finished',
		description: 'Save it as a completed watch and revisit later.',
		emptyHeading: 'Keep a short list of anime you actually finished.',
		label: 'Done',
	},
	abandoned: {
		actionLabel: 'Dropped',
		description: 'Remember that this one did not stick for you.',
		emptyHeading: 'Track the shows that missed the mark too.',
		label: 'Abandoned',
	},
}

type ChecklistDates = {
	completedAt: Date | null
	startedAt: Date | null
}

export function getChecklistStatusMeta(status: ChecklistStatus) {
	return checklistStatusMeta[status]
}

export function isChecklistStatus(value: FormDataEntryValue | null): value is ChecklistStatus {
	return typeof value === 'string' && checklistStatuses.includes(value as ChecklistStatus)
}

export function resolveChecklistDates(
	existing: ChecklistDates | null,
	nextStatus: ChecklistStatus,
	now = new Date()
) {
	if (nextStatus === 'planned') {
		return {
			completedAt: null,
			startedAt: null,
			updatedAt: now,
		}
	}

	if (nextStatus === 'in_progress') {
		return {
			completedAt: null,
			startedAt: existing?.startedAt ?? now,
			updatedAt: now,
		}
	}

	if (nextStatus === 'done') {
		return {
			completedAt: now,
			startedAt: existing?.startedAt ?? now,
			updatedAt: now,
		}
	}

	return {
		completedAt: null,
		startedAt: existing?.startedAt ?? null,
		updatedAt: now,
	}
}
