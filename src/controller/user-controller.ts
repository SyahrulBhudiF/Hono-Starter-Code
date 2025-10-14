import { honoApp } from "../config/hono";
import {
	changePasswordRoute,
	getUserRoute,
	updateUserRoute,
} from "../route/user-route";
import { ResponseUtil } from "../util/response-util";
import type { User } from "../config/db/schema";
import {
	type ChangePasswordRequest,
	toUserResponse,
	type UpdateUserRequest,
	type UserResponse,
} from "../model/user-model";
import { authMiddleware } from "../middleware/auth-middleware";
import { UserService } from "../service/user-service";
import { requireEnv } from "../util/util";

export const userController = honoApp();

userController.use(
	"/user/*",
	authMiddleware(requireEnv("JWT_ACCESS_SECRET") as string),
);

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
	const request = (await c.req.json()) as UpdateUserRequest;
	const user = c.get("user") as User;

	const response = await UserService.update(request, user);

	return c.json(
		ResponseUtil.success<UserResponse>(response, "User updated successfully"),
	);
});

userController.openapi(changePasswordRoute, async (c) => {
	const request = (await c.req.json()) as ChangePasswordRequest;
	const user = c.get("user") as User;

	await UserService.changePassword(request, user);

	return c.json(ResponseUtil.success(null, "Password updated successfully"));
});
