import { password } from "bun";
import { HTTPException } from "hono/http-exception";
import type { User } from "../config/db/schema";
import { logger } from "../config/logging";
import {
	type ChangePasswordRequest,
	toUserResponse,
	type UpdateUserRequest,
	type UserResponse,
} from "../model/user-model";
import { userRepository } from "../repository/user-repository";
import { invalidateUserCache } from "../util/user-cache";

export const UserService = {
	async update(request: UpdateUserRequest, user: User): Promise<UserResponse> {
		const updated = await userRepository.updateById(user.id, request);

		await invalidateUserCache(user.id);

		logger.info("User updated successfully");

		return toUserResponse(updated);
	},

	async changePassword(
		request: ChangePasswordRequest,
		user: User,
	): Promise<void> {
		const existingUser = await userRepository.findById(user.id);

		if (!existingUser) {
			throw new HTTPException(404, { message: "User not found" });
		}

		if (existingUser.password) {
			if (!request.oldPassword) {
				throw new HTTPException(401, { message: "Password is incorrect" });
			}

			const isOldPasswordValid = await password.verify(
				request.oldPassword,
				existingUser.password,
				"bcrypt",
			);

			if (!isOldPasswordValid) {
				throw new HTTPException(401, { message: "Password is incorrect" });
			}

			const isNewPasswordSame = await password.verify(
				request.newPassword,
				existingUser.password,
				"bcrypt",
			);

			if (isNewPasswordSame) {
				throw new HTTPException(400, {
					message: "New password cannot be the same as the old password",
				});
			}
		}

		const newPassword = await password.hash(request.newPassword, {
			algorithm: "bcrypt",
			cost: 10,
		});

		await userRepository.updateById(user.id, { password: newPassword });

		await invalidateUserCache(user.id);

		logger.info("Password updated successfully");
	},
};
