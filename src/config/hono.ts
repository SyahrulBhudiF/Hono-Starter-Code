import { OpenAPIHono } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import type { ApplicationVariables } from "../model/app-model";
import { logger } from "./logging";

export const honoApp = () =>
	new OpenAPIHono<{ Variables: ApplicationVariables }>({
		defaultHook: (result) => {
			if (result.success) {
				return;
			}

			const errors = result.error.issues
				.map((error) => `Invalid ${String(error.path[0])} (${error.message})`)
				.join(", ");

			logger.error(`Validation error: ${errors}`);

			throw new HTTPException(422, {
				message: errors,
			});
		},
	});
