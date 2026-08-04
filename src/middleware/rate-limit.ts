import type { MiddlewareHandler } from "hono";
import { getConnInfo } from "hono/bun";
import { HTTPException } from "hono/http-exception";
import redis from "../config/redis";

export const rateLimit = (
	limit: number,
	windowSeconds: number,
): MiddlewareHandler => {
	return async (c, next) => {
		const key = `rate-limit:${c.req.path}:${getClientIp(c)}`;
		const count = await redis.incr(key);
		let ttl = await redis.ttl(key);
		if (ttl === -1) {
			await redis.expire(key, windowSeconds);
			ttl = windowSeconds;
		}

		if (count > limit) {
			c.header("Retry-After", String(Math.max(1, ttl)));
			throw new HTTPException(429, { message: "Too many requests" });
		}

		await next();
	};
};

export function getClientIp(c: Parameters<MiddlewareHandler>[0]): string {
	if (process.env.TRUST_PROXY === "true") {
		const forwardedIp = c.req.header("x-forwarded-for")?.split(",")[0].trim();
		if (forwardedIp) {
			return forwardedIp;
		}
	}

	try {
		return getConnInfo(c).remote.address ?? "unknown";
	} catch {
		return "unknown";
	}
}
