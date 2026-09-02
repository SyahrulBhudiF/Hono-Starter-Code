import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import type { HTTPResponseError } from "hono/types";
import { ZodError } from "zod";
import { logger } from "../config/logging";
import type { ApplicationVariables } from "../model/app-model";
import { ResponseUtil } from "./response-util";

export default async function errorUtil(
	err: Error | HTTPResponseError,
	c: Context<{ Variables: ApplicationVariables }>,
) {
	const requestId = c.get("requestId") ?? "unknown";

	if (err instanceof HTTPException) {
		c.status(err.status);
		logger.error(`[${requestId}] ${err.status} ${err.message}`);
		return c.json(ResponseUtil.error(err.message, err.status));
	}

	if (err instanceof ZodError) {
		c.status(400);
		const errors = err.issues.map((error) => ({
			message: `Invalid ${String(error.path[0])}`,
		}));

		logger.error(`[${requestId}] Validation error: ${JSON.stringify(errors)}`);

		return c.json(ResponseUtil.error(errors, 400));
	}

	c.status(500);
	logger.error(`[${requestId}] Internal server error: ${err}`);
	return c.json(ResponseUtil.error("Internal server error", 500));
}
