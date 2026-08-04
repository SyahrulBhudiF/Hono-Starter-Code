import type { MiddlewareHandler } from "hono";
import { logger } from "../config/logging";

export const requestLogger = (): MiddlewareHandler => {
	return async (c, next) => {
		const startedAt = performance.now();
		try {
			await next();
		} finally {
			logger.info(
				JSON.stringify({
					requestId: c.get("requestId"),
					method: c.req.method,
					path: c.req.path,
					status: c.res.status,
					durationMs: Math.round(performance.now() - startedAt),
				}),
			);
		}
	};
};
