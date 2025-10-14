import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";
import { ResponseUtil } from "./response-util";
import type { HTTPResponseError } from "hono/types";
import type { Context } from "hono";
import { logger } from "../config/logging";

export default async function errorUtil(
	err: Error | HTTPResponseError,
	c: Context,
) {
	if (err instanceof HTTPException) {
		c.status(err.status);
		logger.error(err.message);
		return c.json(ResponseUtil.error(err.message));
	} else if (err instanceof ZodError) {
		c.status(400);
		const errors = err.errors.map((error) => ({
			message: `Invalid ${error.path[0]}`,
		}));

		logger.error(`Validation error: ${JSON.stringify(errors)}`);

		return c.json(ResponseUtil.error(errors));
	} else {
		c.status(500);
		logger.error(`Internal server error: ${err}`);
		return c.json(ResponseUtil.error("Internal server error"));
	}
}
