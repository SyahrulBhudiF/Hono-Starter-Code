import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env, isProduction } from "../env";
import { drizzleLogger } from "../logging";

const pool = new Pool({
	connectionString: env.DATABASE_URL,
	max: 15,
	idleTimeoutMillis: 30000,
});

export const db = drizzle(pool, {
	logger: isProduction ? false : drizzleLogger,
});

export async function pingDatabase(): Promise<boolean> {
	try {
		await db.execute(sql`select 1`);
		return true;
	} catch {
		return false;
	}
}

export async function closeDatabase(): Promise<void> {
	await pool.end();
}
