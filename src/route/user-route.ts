import { createRouteUtil } from "../util/route-util";
import { z } from "zod";
import { UserValidation } from "../validation/user-validation";

export const getUserRoute = createRouteUtil({
	method: "get",
	path: "/user",
	tags: ["User"],
	responseSchema: z.object({
		status: z.string(),
		message: z.string(),
		data: z.object({
			email: z.string(),
			name: z.string(),
			role: z.string(),
		}),
	}),
	description: "Get user details",
	security: [{ BearerAuth: [] }],
});

export const updateUserRoute = createRouteUtil({
	method: "patch",
	path: "/user",
	tags: ["User"],
	responseSchema: z.object({
		status: z.string(),
		message: z.string(),
		data: z.object({
			email: z.string(),
			name: z.string(),
			role: z.string(),
		}),
	}),
	requestSchema: UserValidation.UPDATE,
	description: "Update user details",
	security: [{ BearerAuth: [] }],
});

export const changePasswordRoute = createRouteUtil({
	method: "patch",
	path: "/user/change-password",
	tags: ["User"],
	responseSchema: z.object({
		status: z.string(),
		message: z.string(),
		data: z.null(),
	}),
	requestSchema: UserValidation.CHANGE_PASSWORD,
	description: "Change user password",
	security: [{ BearerAuth: [] }],
});
