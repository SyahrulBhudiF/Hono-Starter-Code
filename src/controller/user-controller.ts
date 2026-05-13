import type { User } from "../config/db/schema";
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
import { requireEnv } from "../util/util";

export const userController = honoApp();

userController.use("/user/*", authMiddleware(requireEnv("JWT_ACCESS_SECRET")));

userController.openapi(getUserRoute, async (c) => {
	const request = c.get("user") as User;

	const response = toUserResponse(request);

	return c.json(
		ResponseUtil.success<UserResponse>(
			response,
			"User details retrieved successfully",
		),
	);
});

userController.openapi(updateUserRoute, async (c) => {
	const request = c.req.valid("json");
	const user = c.get("user") as User;

	const response = await UserService.update(request, user);

	return c.json(
		ResponseUtil.success<UserResponse>(response, "User updated successfully"),
	);
});

userController.openapi(changePasswordRoute, async (c) => {
	const request = c.req.valid("json");
	const user = c.get("user") as User;

	await UserService.changePassword(request, user);

	return c.json(ResponseUtil.success(null, "Password updated successfully"));
});
