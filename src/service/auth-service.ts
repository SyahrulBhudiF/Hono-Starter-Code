import type { GoogleUser } from "@hono/oauth-providers/google";
import { password } from "bun";
import { HTTPException } from "hono/http-exception";
import { verify } from "hono/jwt";
import { env } from "../config/env";
import { logger } from "../config/logging";
import {
	type LoginUserRequest,
	type RegisterUserRequest,
	type ResetPasswordRequest,
	type TokenResponse,
	toUserResponse,
	type UserResponse,
} from "../model/user-model";
import { userRepository } from "../repository/user-repository";
import { generateAccessToken, generateRefreshToken } from "../util/jwt-util";
import {
	blacklistToken,
	getTokenExpiresIn,
	getTokenId,
	getTokenSubject,
	isTokenBlacklisted,
} from "../util/token-util";
import { invalidateUserCache } from "../util/user-cache";
import { OtpService } from "./otp-service";

const PASSWORD_HASH_OPTIONS = {
	algorithm: "bcrypt",
	cost: 10,
} as const;

export const AuthService = {
	async register(request: RegisterUserRequest): Promise<UserResponse> {
		const existingUser = await userRepository.findByEmail(request.email);

		if (existingUser) {
			throw new HTTPException(400, { message: "Email already taken" });
		}

		const hashedPassword = await password.hash(
			request.password,
			PASSWORD_HASH_OPTIONS,
		);

		const user = await userRepository.create({
			...request,
			password: hashedPassword,
		});

		logger.info("User registered successfully");

		return toUserResponse(user);
	},

	async login(request: LoginUserRequest): Promise<UserResponse> {
		const user = await userRepository.findByEmail(request.email);

		if (!user?.password) {
			throw new HTTPException(401, {
				message: "Email or password is incorrect",
			});
		}

		if (!user.emailVerified) {
			throw new HTTPException(401, { message: "Email not verified" });
		}

		const isPasswordMatch = await password.verify(
			request.password,
			user.password,
			"bcrypt",
		);

		if (!isPasswordMatch) {
			throw new HTTPException(401, {
				message: "Email or password is incorrect",
			});
		}

		const [access, refresh] = await Promise.all([
			generateAccessToken(user),
			generateRefreshToken(user),
		]);

		await userRepository.updateById(user.id, { loginAt: new Date() });
		await invalidateUserCache(user.id);

		logger.info("User logged in successfully");

		return {
			...toUserResponse(user),
			accessToken: access,
			refreshToken: refresh,
		};
	},

	async logout(
		token: string,
		refreshToken: string,
		userId: string,
	): Promise<void> {
		const accessPayload = await verify(token, env.JWT_ACCESS_SECRET, "HS256");

		if (getTokenSubject(accessPayload) !== userId) {
			throw new HTTPException(401, { message: "Unauthorized" });
		}

		const refreshPayload = await verify(
			refreshToken,
			env.JWT_REFRESH_SECRET,
			"HS256",
		);

		if (getTokenSubject(refreshPayload) !== userId) {
			throw new HTTPException(401, { message: "Unauthorized" });
		}

		await Promise.all([
			blacklistToken(
				getTokenId(accessPayload),
				getTokenExpiresIn(accessPayload),
			),
			blacklistToken(
				getTokenId(refreshPayload),
				getTokenExpiresIn(refreshPayload),
			),
			invalidateUserCache(userId),
		]);

		logger.info("User logged out successfully");
	},

	async resetPassword(request: ResetPasswordRequest): Promise<UserResponse> {
		await OtpService.assertValidOTP(request.email, request.otp);

		const hashedPassword = await password.hash(
			request.password,
			PASSWORD_HASH_OPTIONS,
		);

		const user = await userRepository.updateByEmail(request.email, {
			password: hashedPassword,
		});

		await invalidateUserCache(user.id);

		logger.info("Password reset successfully");

		return toUserResponse(user);
	},

	async googleLogin(request: Partial<GoogleUser>): Promise<UserResponse> {
		if (!request.email || !request.name) {
			throw new HTTPException(400, { message: "Invalid Google account data" });
		}

		const email = request.email;
		const name = request.name;

		const response = await userRepository.transaction(async (repo) => {
			const existingUser = await repo.findByEmail(email);

			const user = existingUser
				? await repo.updateById(existingUser.id, { loginAt: new Date() })
				: await repo.create({
						email,
						name,
						role: "USER",
						loginAt: new Date(),
						emailVerified: new Date(),
					});

			const [access, refresh] = await Promise.all([
				generateAccessToken(user),
				generateRefreshToken(user),
			]);

			return {
				...toUserResponse(user),
				accessToken: access,
				refreshToken: refresh,
				id: user.id,
			};
		});

		const { id, ...userResponse } = response;
		await invalidateUserCache(id);

		logger.info("User logged in successfully");

		return userResponse;
	},

	async refreshToken(request: {
		refreshToken: string;
	}): Promise<TokenResponse> {
		const payload = await verify(
			request.refreshToken,
			env.JWT_REFRESH_SECRET,
			"HS256",
		);

		const tokenId = getTokenId(payload);

		if (await isTokenBlacklisted(tokenId)) {
			throw new HTTPException(401, { message: "Token has been invalidated" });
		}

		const user = await userRepository.findById(getTokenSubject(payload));

		if (!user) {
			throw new HTTPException(401, { message: "Unauthorized" });
		}

		const rotated = await blacklistToken(
			tokenId,
			getTokenExpiresIn(payload),
			true,
		);

		if (!rotated) {
			throw new HTTPException(401, { message: "Token has been invalidated" });
		}

		const [access, refresh] = await Promise.all([
			generateAccessToken(user),
			generateRefreshToken(user),
		]);

		return { accessToken: access, refreshToken: refresh };
	},
};
