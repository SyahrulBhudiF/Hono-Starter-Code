import app from "./app";
import { closeDatabase } from "./config/db";
import { env } from "./config/env";
import { logger } from "./config/logging";
import { emailQueue } from "./config/queue";
import { closeRedis } from "./config/redis";

let shuttingDown = false;

const shutdown = async (signal: string): Promise<void> => {
	if (shuttingDown) {
		return;
	}

	shuttingDown = true;
	logger.info(`Received ${signal}, shutting down`);

	await Promise.allSettled([closeDatabase(), emailQueue.close(), closeRedis()]);

	process.exit(0);
};

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

export type { AppType } from "./app";
export { createApp } from "./app";

export default {
	port: env.PORT,
	fetch: app.fetch,
};
