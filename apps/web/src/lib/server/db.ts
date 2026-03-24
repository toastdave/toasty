import { env } from '$env/dynamic/private'
import { createDb } from '@toasty/db'

const defaultDatabaseUrl = 'postgresql://postgres:postgres@127.0.0.1:5432/toasty'
const globalForDb = globalThis as typeof globalThis & {
	__toastyDb?: ReturnType<typeof createDb>
}

export const db = globalForDb.__toastyDb ?? createDb(env.DATABASE_URL ?? defaultDatabaseUrl)

if (!globalForDb.__toastyDb) {
	globalForDb.__toastyDb = db
}
