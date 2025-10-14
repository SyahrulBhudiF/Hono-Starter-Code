import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { drizzleLogger } from "../logging";
import { requireEnv } from "../../util/util";

const pool = new Pool({
	connectionString: requireEnv("DATABASE_URL") as string,
	max: 15,
	idleTimeoutMillis: 30000,
});

export const db = drizzle(pool, {
	logger: drizzleLogger,
});
