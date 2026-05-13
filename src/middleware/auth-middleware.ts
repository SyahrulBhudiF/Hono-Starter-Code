import type { Context, MiddlewareHandler, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { verify } from "hono/jwt";
import type { JWTPayload } from "hono/utils/jwt/types";
import type { User } from "../config/db/schema";
import redis from "../config/redis";
import type { ApplicationVariables } from "../model/app-model";
import { userRepository } from "../repository/user-repository";

export const authMiddleware = (
	secret: string,
	role?: string,
): MiddlewareHandler => {
	return async (c: Context, next: Next) => {
		const authHeader = c.req.header("Authorization");
		if (!authHeader?.startsWith("Bearer ")) {
			throw new HTTPException(401, { message: "Unauthorized" });
		}

		const token = authHeader.split(" ")[1];
		const isBlacklisted = await redis.exists(`blacklist:${token}`);

		if (isBlacklisted) {
			throw new HTTPException(401, { message: "Token has been invalidated" });
		}

		const jwtPayload: JWTPayload = await verify(token, secret, "HS256");
		const userRedis = await redis.get(`user:${jwtPayload.id}`);

		let user: User | null;

		if (userRedis) {
			user = JSON.parse(userRedis);
		} else {
			user = await userRepository.findById(jwtPayload.id as string);
		}

		if (!user) {
			throw new HTTPException(404, { message: "User not found" });
		}

		await redis.set(
			`user:${jwtPayload.id}`,
			JSON.stringify(user),
			"EX",
			3 * 60 * 60,
		);

		if (role && role !== user.role) {
			throw new HTTPException(403, { message: "Forbidden" });
		}

		c.set("user", user);
		(c.set as (key: keyof ApplicationVariables, value: unknown) => void)(
			"token",
			token,
		);

		await next();
	};
};
