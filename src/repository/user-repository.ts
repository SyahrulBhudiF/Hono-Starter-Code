import { and, eq, isNull } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { db } from "../config/db";
import { type NewUser, type User, usersTable } from "../config/db/schema";

type Database = typeof db;
type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
type UserRepositoryDatabase = Database | Transaction;

const UNIQUE_VIOLATION = "23505";

function isUniqueViolation(error: unknown): boolean {
	if (typeof error !== "object" || error === null) {
		return false;
	}

	const cause = "cause" in error ? error.cause : undefined;
	const code =
		"code" in error
			? (error as { code?: unknown }).code
			: typeof cause === "object" && cause !== null && "code" in cause
				? (cause as { code?: unknown }).code
				: undefined;

	return code === UNIQUE_VIOLATION;
}

export class UserRepository {
	constructor(private readonly database: UserRepositoryDatabase = db) {}

	async create(data: NewUser): Promise<User> {
		try {
			const [user] = await this.database
				.insert(usersTable)
				.values(data)
				.returning();

			if (!user) {
				throw new HTTPException(500, { message: "Failed to create user" });
			}

			return user;
		} catch (error) {
			if (isUniqueViolation(error)) {
				throw new HTTPException(400, { message: "Email already taken" });
			}

			throw error;
		}
	}

	async findById(id: string): Promise<User | null> {
		const [user] = await this.database
			.select()
			.from(usersTable)
			.where(and(eq(usersTable.id, id), isNull(usersTable.deletedAt)))
			.limit(1);

		return user ?? null;
	}

	async findByEmail(email: string): Promise<User | null> {
		const [user] = await this.database
			.select()
			.from(usersTable)
			.where(and(eq(usersTable.email, email), isNull(usersTable.deletedAt)))
			.limit(1);

		return user ?? null;
	}

	async updateById(id: string, data: Partial<NewUser>): Promise<User> {
		const [user] = await this.database
			.update(usersTable)
			.set(data)
			.where(and(eq(usersTable.id, id), isNull(usersTable.deletedAt)))
			.returning();

		if (!user) {
			throw new HTTPException(404, { message: "User not found" });
		}

		return user;
	}

	async updateByEmail(email: string, data: Partial<NewUser>): Promise<User> {
		const [user] = await this.database
			.update(usersTable)
			.set(data)
			.where(and(eq(usersTable.email, email), isNull(usersTable.deletedAt)))
			.returning();

		if (!user) {
			throw new HTTPException(404, { message: "User not found" });
		}

		return user;
	}

	async softDeleteById(id: string): Promise<User> {
		return await this.updateById(id, { deletedAt: new Date() });
	}

	async transaction<T>(
		fn: (repository: UserRepository) => Promise<T>,
	): Promise<T> {
		return await db.transaction(async (tx) => {
			return await fn(new UserRepository(tx));
		});
	}
}

export const userRepository = new UserRepository();
