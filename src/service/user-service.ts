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

export class UserService {
	static async update(
		request: UpdateUserRequest,
		user: User,
	): Promise<UserResponse> {
		const response = await userRepository.updateById(user.id, request);

		logger.info("User updated successfully");

		return toUserResponse(response);
	}

	static async changePassword(
		request: ChangePasswordRequest,
		user: User,
	): Promise<void> {
		const existingUser = await userRepository.findById(user.id);

		if (existingUser?.password && request.oldPassword) {
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
				throw new HTTPException(401, {
					message: "New password cannot be the same as the old password",
				});
			}
		}

		const newPassword = await password.hash(request.newPassword, "bcrypt");

		await userRepository.updateById(user.id, { password: newPassword });

		logger.info("Password updated successfully");
	}
}
