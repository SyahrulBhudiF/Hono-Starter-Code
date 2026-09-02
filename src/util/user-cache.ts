import type { User } from "../config/db/schema";
import redis from "../config/redis";

const USER_CACHE_TTL_SECONDS = 3 * 60 * 60;

const DATE_FIELDS = [
	"emailVerified",
	"loginAt",
	"createdAt",
	"updatedAt",
	"deletedAt",
] as const;

export const userCacheKey = (userId: string): string => `user:${userId}`;

function reviveUser(raw: string): User | null {
	const parsed: unknown = JSON.parse(raw);

	if (typeof parsed !== "object" || parsed === null) {
		return null;
	}

	const record = parsed as Record<string, unknown>;

	for (const field of DATE_FIELDS) {
		const value = record[field];
		record[field] = typeof value === "string" ? new Date(value) : null;
	}

	return record as unknown as User;
}

export async function readCachedUser(userId: string): Promise<User | null> {
	const cached = await redis.get(userCacheKey(userId));

	if (!cached) {
		return null;
	}

	try {
		return reviveUser(cached);
	} catch {
		await redis.del(userCacheKey(userId));
		return null;
	}
}

export async function cacheUser(user: User): Promise<void> {
	await redis.set(
		userCacheKey(user.id),
		JSON.stringify(user),
		"EX",
		USER_CACHE_TTL_SECONDS,
	);
}

export async function invalidateUserCache(userId: string): Promise<void> {
	await redis.del(userCacheKey(userId));
}
