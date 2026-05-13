import type { GoogleUser } from "@hono/oauth-providers/google";
import { password } from "bun";
import { HTTPException } from "hono/http-exception";
import { verify } from "hono/jwt";
import { logger } from "../config/logging";
import redis from "../config/redis";
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
import { requireEnv } from "../util/util";

export class AuthService {
	static async register(request: RegisterUserRequest): Promise<UserResponse> {
		const hashedPassword = await password.hash(request.password, {
			algorithm: "bcrypt",
			cost: 10,
		});

		const existingUser = await userRepository.findByEmail(request.email);
		if (existingUser) {
			throw new HTTPException(400, {
				message: "Email already taken",
			});
		}

		const user = await userRepository.create({
			...request,
			password: hashedPassword,
		});

		logger.info("User registered successfully");

		return toUserResponse(user);
	}

	static async login(request: LoginUserRequest): Promise<UserResponse> {
		const user = await userRepository.findByEmail(request.email);

		if (!user?.password) {
			throw new HTTPException(401, {
				message: "Email or Password incorrect",
			});
		}

		if (!user.emailVerified) {
			throw new HTTPException(401, {
				message: "Email not verified",
			});
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

		const response = toUserResponse(user);
		response.accessToken = access;
		response.refreshToken = refresh;

		const loginAt = new Date();
		await userRepository.updateById(user.id, { loginAt });

		logger.info("User logged in successfully");

		return response;
	}

	static async logout(
		token: string,
		refreshToken: string,
		userId: string,
	): Promise<void> {
		const jwtPayload = await verify(
			token,
			requireEnv("JWT_ACCESS_SECRET"),
			"HS256",
		);
		if (jwtPayload.id !== userId) {
			throw new HTTPException(401, {
				message: "Unauthorized",
			});
		}

		await redis.set(`blacklist:${token}`, "true");
		await redis.del(`user:${userId}`);
		await redis.set(`blacklist:${refreshToken}`, "true");

		logger.info("User logged out successfully");
	}

	static async resetPassword(
		request: ResetPasswordRequest,
	): Promise<UserResponse> {
		const storedOTP = await redis.get(`otp:${request.email}`);
		if (storedOTP !== String(request.otp)) {
			throw new HTTPException(401, {
				message: "Invalid OTP",
			});
		}

		await redis.del(`otp:${request.email}`);

		const pw = await password.hash(request.password, {
			algorithm: "bcrypt",
			cost: 10,
		});

		const user = await userRepository.updateByEmail(request.email, {
			password: pw,
		});

		logger.info("Password reset successfully");

		return toUserResponse(user);
	}

	static async googleLogin(
		request: Partial<GoogleUser>,
	): Promise<UserResponse> {
		if (!request.email || !request.name) {
			throw new HTTPException(400, {
				message: "Invalid Google account data",
			});
		}

		const email = request.email;
		const name = request.name;

		return await userRepository.transaction(async (repo) => {
			let user = await repo.findByEmail(email);

			if (!user) {
				const userData = {
					email,
					name,
					role: "USER",
					loginAt: new Date(),
					emailVerified: new Date(),
				};
				user = await repo.create(userData);
			} else {
				const loginAt = new Date();
				user = await repo.updateById(user.id, { loginAt });
			}

			const [access, refresh] = await Promise.all([
				generateAccessToken(user),
				generateRefreshToken(user),
			]);

			const response = toUserResponse(user);
			response.accessToken = access;
			response.refreshToken = refresh;

			logger.info("User logged in successfully");

			return response;
		});
	}

	static async refreshToken(request: {
		refreshToken: string;
	}): Promise<TokenResponse> {
		const isBlacklisted = await redis.exists(
			`blacklist:${request.refreshToken}`,
		);
		if (isBlacklisted) {
			throw new HTTPException(401, {
				message: "Token has been invalidated",
			});
		}

		const jwtPayload = await verify(
			request.refreshToken,
			requireEnv("JWT_REFRESH_SECRET"),
			"HS256",
		);
		const user = await userRepository.findById(jwtPayload.id as string);
		if (!user || jwtPayload.id !== user.id) {
			throw new HTTPException(401, {
				message: "Unauthorized",
			});
		}

		const [access, refresh] = await Promise.all([
			generateAccessToken(user),
			generateRefreshToken(user),
		]);

		return { accessToken: access, refreshToken: refresh } as TokenResponse;
	}
}
