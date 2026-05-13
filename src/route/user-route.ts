import { createRoute, z } from "@hono/zod-openapi";
import { createResponses, jsonBody } from "../util/route-util";
import { UserValidation } from "../validation/user-validation";

const userResponse = z.object({
	status: z.string(),
	message: z.string(),
	data: z.object({
		email: z.email(),
		name: z.string(),
		role: z.string(),
	}),
});

export const getUserRoute = createRoute({
	method: "get",
	path: "/user",
	tags: ["User"],
	responses: createResponses(userResponse),
	description: "Get user details",
	security: [{ BearerAuth: [] }],
});

export const updateUserRoute = createRoute({
	method: "patch",
	path: "/user",
	tags: ["User"],
	request: jsonBody(UserValidation.UPDATE),
	responses: createResponses(userResponse),
	description: "Update user details",
	security: [{ BearerAuth: [] }],
});

export const changePasswordRoute = createRoute({
	method: "patch",
	path: "/user/change-password",
	tags: ["User"],
	request: jsonBody(UserValidation.CHANGE_PASSWORD),
	responses: createResponses(
		z.object({
			status: z.string(),
			message: z.string(),
			data: z.null(),
		}),
	),
	description: "Change user password",
	security: [{ BearerAuth: [] }],
});
