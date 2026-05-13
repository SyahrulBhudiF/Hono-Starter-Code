import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { requireEnv } from "../../util/util";
import { drizzleLogger } from "../logging";

const pool = new Pool({
	connectionString: requireEnv("DATABASE_URL"),
	max: 15,
	idleTimeoutMillis: 30000,
});

export const db = drizzle(pool, {
	logger: drizzleLogger,
});
