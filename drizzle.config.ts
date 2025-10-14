import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { requireEnv } from "./src/util/util";

export default defineConfig({
	out: "./drizzle",
	schema: "./src/config/db/schema.ts",
	dialect: "postgresql",
	dbCredentials: {
		url: requireEnv("DATABASE_URL") as string,
	},
});
