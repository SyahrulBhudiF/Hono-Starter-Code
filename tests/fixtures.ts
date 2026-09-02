import { vi } from "vitest";
import type { User } from "../src/config/db/schema";

export const userFixture = (overrides: Partial<User> = {}): User => ({
	id: "f89d208b-77d4-4f64-9d2a-5e7dc044a150",
	name: "Jane Doe",
	email: "jane@example.com",
	password: "hashed-password",
	role: "USER",
	emailVerified: new Date("2025-01-01T00:00:00.000Z"),
	loginAt: null,
	createdAt: new Date("2025-01-01T00:00:00.000Z"),
	updatedAt: new Date("2025-01-01T00:00:00.000Z"),
	deletedAt: null,
	...overrides,
});

export const redisMock = () => ({
	get: vi.fn(),
	set: vi.fn(),
	del: vi.fn(),
	exists: vi.fn(),
	incr: vi.fn(),
	expire: vi.fn(),
	ttl: vi.fn(),
	ping: vi.fn(),
	quit: vi.fn(),
});
