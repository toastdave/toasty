import { env } from '$env/dynamic/private'
import { createDb } from '@toasty/db'

const globalForDb = globalThis as typeof globalThis & {
	__toastyDb?: ReturnType<typeof createDb>
}

export const db = globalForDb.__toastyDb ?? createDb(env.DATABASE_URL)

if (!globalForDb.__toastyDb) {
	globalForDb.__toastyDb = db
}
