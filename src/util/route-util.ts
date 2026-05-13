import { z } from "@hono/zod-openapi";
import type { ZodType } from "zod";

const errorResponseSchema = z.object({
	status: z.number(),
	message: z.string(),
	data: z.null(),
});

const errorContent = (status: number, message: string) => ({
	"application/json": {
		schema: errorResponseSchema,
		example: {
			status,
			message,
			data: null,
		},
	},
});

export const jsonBody = <const TSchema extends ZodType>(schema: TSchema) => ({
	body: {
		content: {
			"application/json": {
				schema,
			},
		},
	},
});

export const createResponses = (responseSchema: ZodType) => ({
	200: {
		description: "Success",
		content: {
			"application/json": {
				schema: responseSchema,
			},
		},
	},
	400: {
		description: "Bad Request",
		content: errorContent(400, "Invalid request data"),
	},
	401: {
		description: "Unauthorized",
		content: errorContent(401, "Unauthorized access"),
	},
	403: {
		description: "Forbidden",
		content: errorContent(403, "Access forbidden"),
	},
	404: {
		description: "Not Found",
		content: errorContent(404, "Resource not found"),
	},
	500: {
		description: "Internal Server Error",
		content: errorContent(500, "Internal server error"),
	},
});
