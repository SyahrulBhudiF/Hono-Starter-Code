import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("bun", () => ({
	password: {
		hash: vi.fn(async () => "new-hash"),
		verify: vi.fn(async () => true),
	},
}));

vi.mock("../src/repository/user-repository", () => ({
	userRepository: {
		findById: vi.fn(),
		updateById: vi.fn(),
	},
}));

vi.mock("../src/util/user-cache", () => ({
	invalidateUserCache: vi.fn(),
}));

const { password } = await import("bun");
const { userRepository } = await import("../src/repository/user-repository");
const { invalidateUserCache } = await import("../src/util/user-cache");
const { UserService } = await import("../src/service/user-service");
const { userFixture } = await import("./fixtures");

const mockedRepository = vi.mocked(userRepository);
const mockedPassword = vi.mocked(password);

beforeEach(() => {
	vi.clearAllMocks();
	mockedPassword.hash.mockResolvedValue("new-hash");
	mockedPassword.verify.mockResolvedValue(true);
});

describe("UserService.update", () => {
	test("returns the mapped user and drops the cache", async () => {
		const user = userFixture();
		mockedRepository.updateById.mockResolvedValueOnce(
			userFixture({ name: "Jane Updated" }),
		);

		const response = await UserService.update({ name: "Jane Updated" }, user);

		expect(response).toEqual({
			email: "jane@example.com",
			name: "Jane Updated",
			role: "USER",
		});
		expect(invalidateUserCache).toHaveBeenCalledWith(user.id);
	});
});

describe("UserService.changePassword", () => {
	test("rejects a missing user", async () => {
		mockedRepository.findById.mockResolvedValueOnce(null);

		await expect(
			UserService.changePassword(
				{ oldPassword: "secret123", newPassword: "newsecret123" },
				userFixture(),
			),
		).rejects.toMatchObject({ status: 404 });
	});

	test("requires the old password when the account has one", async () => {
		mockedRepository.findById.mockResolvedValueOnce(userFixture());

		await expect(
			UserService.changePassword(
				{ newPassword: "newsecret123" },
				userFixture(),
			),
		).rejects.toMatchObject({ status: 401 });
	});

	test("rejects a wrong old password", async () => {
		mockedRepository.findById.mockResolvedValueOnce(userFixture());
		mockedPassword.verify.mockResolvedValueOnce(false);

		await expect(
			UserService.changePassword(
				{ oldPassword: "wrong", newPassword: "newsecret123" },
				userFixture(),
			),
		).rejects.toThrow("Password is incorrect");
	});

	test("rejects reusing the current password", async () => {
		mockedRepository.findById.mockResolvedValueOnce(userFixture());
		mockedPassword.verify
			.mockResolvedValueOnce(true)
			.mockResolvedValueOnce(true);

		await expect(
			UserService.changePassword(
				{ oldPassword: "secret123", newPassword: "secret123" },
				userFixture(),
			),
		).rejects.toMatchObject({ status: 400 });
	});

	test("stores a new hash and drops the cache", async () => {
		const user = userFixture();
		mockedRepository.findById.mockResolvedValueOnce(user);
		mockedPassword.verify
			.mockResolvedValueOnce(true)
			.mockResolvedValueOnce(false);
		mockedRepository.updateById.mockResolvedValueOnce(user);

		await UserService.changePassword(
			{ oldPassword: "secret123", newPassword: "newsecret123" },
			user,
		);

		expect(mockedRepository.updateById).toHaveBeenCalledWith(user.id, {
			password: "new-hash",
		});
		expect(invalidateUserCache).toHaveBeenCalledWith(user.id);
	});

	test("skips the old password checks for accounts without one", async () => {
		const user = userFixture({ password: null });
		mockedRepository.findById.mockResolvedValueOnce(user);
		mockedRepository.updateById.mockResolvedValueOnce(user);

		await UserService.changePassword({ newPassword: "newsecret123" }, user);

		expect(mockedPassword.verify).not.toHaveBeenCalled();
	});
});
