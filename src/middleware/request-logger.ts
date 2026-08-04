import type { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { logger } from "../config/logging";

export const requestLogger = (): MiddlewareHandler => {
	return async (c, next) => {
		const startedAt = performance.now();
		let status = c.res.status;

		try {
			await next();
			status = c.res.status;
		} catch (error) {
			status = error instanceof HTTPException ? error.status : 500;
			throw error;
		} finally {
			logger.info(
				JSON.stringify({
					requestId: c.get("requestId"),
					method: c.req.method,
					path: c.req.path,
					status,
					durationMs: Math.round(performance.now() - startedAt),
				}),
			);
		}
	};
};
