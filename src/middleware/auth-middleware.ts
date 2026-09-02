import type { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { verify } from "hono/jwt";
import type { ApplicationVariables } from "../model/app-model";
import { userRepository } from "../repository/user-repository";
import {
	getTokenId,
	getTokenSubject,
	isTokenBlacklisted,
} from "../util/token-util";
import { cacheUser, readCachedUser } from "../util/user-cache";

export const authMiddleware = (
	secret: string,
	role?: string,
): MiddlewareHandler<{ Variables: ApplicationVariables }> => {
	return async (c, next) => {
		const authHeader = c.req.header("Authorization");

		if (!authHeader?.startsWith("Bearer ")) {
			throw new HTTPException(401, { message: "Unauthorized" });
		}

		const token = authHeader.slice("Bearer ".length).trim();

		if (!token) {
			throw new HTTPException(401, { message: "Unauthorized" });
		}

		const payload = await verify(token, secret, "HS256");
		const tokenId = getTokenId(payload);

		if (await isTokenBlacklisted(tokenId)) {
			throw new HTTPException(401, { message: "Token has been invalidated" });
		}

		const userId = getTokenSubject(payload);
		const cachedUser = await readCachedUser(userId);
		const user = cachedUser ?? (await userRepository.findById(userId));

		if (!user) {
			throw new HTTPException(404, { message: "User not found" });
		}

		if (!cachedUser) {
			await cacheUser(user);
		}

		if (role && role !== user.role) {
			throw new HTTPException(403, { message: "Forbidden" });
		}

		c.set("user", user);
		c.set("token", token);

		await next();
	};
};
