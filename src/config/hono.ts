import { OpenAPIHono } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { logger } from "./logging";
import type { ApplicationVariables } from "../model/app-model";

export const honoApp = () =>
	new OpenAPIHono<{ Variables: ApplicationVariables }>({
		defaultHook: (result) => {
			if (result.success) {
				return;
			}

			const errors = result.error.errors
				.map((error) => `Invalid ${error.path[0]} (${error.message})`)
				.join(", ");

			logger.error(`Validation error: ${errors}`);

			throw new HTTPException(422, {
				message: errors,
			});
		},
	});
