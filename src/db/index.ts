import {drizzle} from "drizzle-orm/node-postgres";
import {Pool} from "pg";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
    max: 15,
    idleTimeoutMillis: 30000
});

const db = drizzle({client: pool});