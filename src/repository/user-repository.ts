import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { db } from "../config/db";
import { type NewUser, type User, usersTable } from "../config/db/schema";

type Database = typeof db;
type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
type UserRepositoryDatabase = Database | Transaction;

export class UserRepository {
	constructor(private readonly database: UserRepositoryDatabase = db) {}

	async create(data: NewUser): Promise<User> {
		const [user] = await this.database
			.insert(usersTable)
			.values(data)
			.returning();

		if (!user) {
			throw new HTTPException(500, { message: "Failed to create user" });
		}

		return user;
	}

	async findById(id: string): Promise<User | null> {
		const [user] = await this.database
			.select()
			.from(usersTable)
			.where(eq(usersTable.id, id))
			.limit(1);

		return user ?? null;
	}

	async findByEmail(email: string): Promise<User | null> {
		const [user] = await this.database
			.select()
			.from(usersTable)
			.where(eq(usersTable.email, email))
			.limit(1);

		return user ?? null;
	}

	async updateById(id: string, data: Partial<NewUser>): Promise<User> {
		const [user] = await this.database
			.update(usersTable)
			.set(data)
			.where(eq(usersTable.id, id))
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
			.where(eq(usersTable.email, email))
			.returning();

		if (!user) {
			throw new HTTPException(404, { message: "User not found" });
		}

		return user;
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
