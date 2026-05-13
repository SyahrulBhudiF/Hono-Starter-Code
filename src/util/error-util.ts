import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import type { HTTPResponseError } from "hono/types";
import { ZodError } from "zod";
import { logger } from "../config/logging";
import { ResponseUtil } from "./response-util";

export default async function errorUtil(
	err: Error | HTTPResponseError,
	c: Context,
) {
	if (err instanceof HTTPException) {
		c.status(err.status);
		logger.error(err.message);
		return c.json(ResponseUtil.error(err.message, err.status));
	} else if (err instanceof ZodError) {
		c.status(400);
		const errors = err.issues.map((error) => ({
			message: `Invalid ${String(error.path[0])}`,
		}));

		logger.error(`Validation error: ${JSON.stringify(errors)}`);

		return c.json(ResponseUtil.error(errors, 400));
	} else {
		c.status(500);
		logger.error(`Internal server error: ${err}`);
		return c.json(ResponseUtil.error("Internal server error", 500));
	}
}
