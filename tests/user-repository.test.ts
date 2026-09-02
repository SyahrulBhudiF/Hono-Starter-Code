import { beforeEach, describe, expect, test, vi } from "vitest";

const limit = vi.fn();
const returningInsert = vi.fn();
const returningUpdate = vi.fn();
const transaction = vi.fn();

vi.mock("../src/config/db", () => ({
	db: {
		select: () => ({ from: () => ({ where: () => ({ limit }) }) }),
		insert: () => ({ values: () => ({ returning: returningInsert }) }),
		update: () => ({
			set: () => ({ where: () => ({ returning: returningUpdate }) }),
		}),
		transaction: (fn: (tx: unknown) => unknown) => transaction(fn),
	},
}));

const { UserRepository, userRepository } = await import(
	"../src/repository/user-repository"
);
const { userFixture } = await import("./fixtures");

beforeEach(() => {
	vi.clearAllMocks();
});

describe("UserRepository", () => {
	test("returns null for find-one misses", async () => {
		limit.mockResolvedValue([]);

		expect(await userRepository.findById("missing")).toBeNull();
		expect(await userRepository.findByEmail("missing@example.com")).toBeNull();
	});

	test("returns the matched row", async () => {
		const user = userFixture();
		limit.mockResolvedValue([user]);

		expect(await userRepository.findById(user.id)).toEqual(user);
		expect(await userRepository.findByEmail(user.email)).toEqual(user);
	});

	test("creates a user", async () => {
		const user = userFixture();
		returningInsert.mockResolvedValueOnce([user]);

		expect(
			await userRepository.create({ name: user.name, email: user.email }),
		).toEqual(user);
	});

	test("fails loudly when an insert returns nothing", async () => {
		returningInsert.mockResolvedValueOnce([]);

		await expect(
			userRepository.create({ name: "Jane", email: "jane@example.com" }),
		).rejects.toMatchObject({ status: 500 });
	});

	test("maps a unique violation to a client error", async () => {
		returningInsert.mockRejectedValueOnce(
			Object.assign(new Error("duplicate key"), { code: "23505" }),
		);

		await expect(
			userRepository.create({ name: "Jane", email: "jane@example.com" }),
		).rejects.toMatchObject({ status: 400 });
	});

	test("maps a wrapped unique violation to a client error", async () => {
		returningInsert.mockRejectedValueOnce(
			Object.assign(new Error("driver error"), {
				cause: { code: "23505" },
			}),
		);

		await expect(
			userRepository.create({ name: "Jane", email: "jane@example.com" }),
		).rejects.toMatchObject({ status: 400 });
	});

	test("rethrows unrelated database errors", async () => {
		returningInsert.mockRejectedValueOnce(new Error("connection reset"));

		await expect(
			userRepository.create({ name: "Jane", email: "jane@example.com" }),
		).rejects.toThrow("connection reset");
	});

	test("throws 404 when an update matches no row", async () => {
		returningUpdate.mockResolvedValue([]);

		await expect(
			userRepository.updateById("missing", { name: "Jane" }),
		).rejects.toMatchObject({ status: 404 });
		await expect(
			userRepository.updateByEmail("missing@example.com", { name: "Jane" }),
		).rejects.toMatchObject({ status: 404 });
	});

	test("soft deletes by stamping deletedAt", async () => {
		const user = userFixture();
		returningUpdate.mockResolvedValueOnce([user]);

		expect(await userRepository.softDeleteById(user.id)).toEqual(user);
	});

	test("hands a transaction-scoped repository to the callback", async () => {
		transaction.mockImplementationOnce(
			async (fn: (tx: unknown) => unknown) => await fn({}),
		);

		const received = await userRepository.transaction(async (repo) => repo);

		expect(received).toBeInstanceOf(UserRepository);
	});
});
