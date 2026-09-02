import { env } from "../config/env";
import { honoApp } from "../config/hono";
import { authMiddleware } from "../middleware/auth-middleware";
import { toUserResponse, type UserResponse } from "../model/user-model";
import {
	changePasswordRoute,
	getUserRoute,
	updateUserRoute,
} from "../route/user-route";
import { UserService } from "../service/user-service";
import { ResponseUtil } from "../util/response-util";

export const userController = honoApp();

userController.use("/user/*", authMiddleware(env.JWT_ACCESS_SECRET));

userController.openapi(getUserRoute, async (c) => {
	const response = toUserResponse(c.get("user"));

	return c.json(
		ResponseUtil.success<UserResponse>(
			response,
			"User details retrieved successfully",
		),
		200,
	);
});

userController.openapi(updateUserRoute, async (c) => {
	const request = c.req.valid("json");
	const response = await UserService.update(request, c.get("user"));

	return c.json(
		ResponseUtil.success<UserResponse>(response, "User updated successfully"),
		200,
	);
});

userController.openapi(changePasswordRoute, async (c) => {
	const request = c.req.valid("json");
	await UserService.changePassword(request, c.get("user"));

	return c.json(
		ResponseUtil.success(null, "Password updated successfully"),
		200,
	);
});
