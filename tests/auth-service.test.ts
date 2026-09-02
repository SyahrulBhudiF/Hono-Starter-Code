import { HTTPException } from "hono/http-exception";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("bun", () => ({
	password: {
		hash: vi.fn(async () => "new-hash"),
		verify: vi.fn(async () => true),
	},
}));

vi.mock("../src/config/redis", () => ({
	default: {
		get: vi.fn(),
		set: vi.fn(),
		del: vi.fn(),
		exists: vi.fn(),
		incr: vi.fn(),
		expire: vi.fn(),
	},
}));

vi.mock("../src/repository/user-repository", () => ({
	userRepository: {
		findById: vi.fn(),
		findByEmail: vi.fn(),
		create: vi.fn(),
		updateById: vi.fn(),
		updateByEmail: vi.fn(),
		transaction: vi.fn(),
	},
}));

vi.mock("../src/util/user-cache", () => ({
	invalidateUserCache: vi.fn(),
}));

const { password } = await import("bun");
const { default: redis } = await import("../src/config/redis");
const { userRepository } = await import("../src/repository/user-repository");
const { invalidateUserCache } = await import("../src/util/user-cache");
const { AuthService } = await import("../src/service/auth-service");
const { generateAccessToken, generateRefreshToken } = await import(
	"../src/util/jwt-util"
);
const { userFixture } = await import("./fixtures");

const mockedRedis = vi.mocked(redis);
const mockedRepository = vi.mocked(userRepository);
const mockedPassword = vi.mocked(password);

beforeEach(() => {
	vi.clearAllMocks();
	mockedPassword.hash.mockResolvedValue("new-hash");
	mockedPassword.verify.mockResolvedValue(true);
});

describe("AuthService.register", () => {
	test("rejects an email that is already taken without hashing", async () => {
		mockedRepository.findByEmail.mockResolvedValueOnce(userFixture());

		await expect(
			AuthService.register({
				name: "Jane Doe",
				email: "jane@example.com",
				password: "secret123",
			}),
		).rejects.toMatchObject({ status: 400 });

		expect(mockedPassword.hash).not.toHaveBeenCalled();
	});

	test("creates a user with a hashed password", async () => {
		mockedRepository.findByEmail.mockResolvedValueOnce(null);
		mockedRepository.create.mockResolvedValueOnce(userFixture());

		const response = await AuthService.register({
			name: "Jane Doe",
			email: "jane@example.com",
			password: "secret123",
		});

		expect(mockedRepository.create).toHaveBeenCalledWith(
			expect.objectContaining({ password: "new-hash" }),
		);
		expect(response).toEqual({
			email: "jane@example.com",
			name: "Jane Doe",
			role: "USER",
		});
	});
});

describe("AuthService.login", () => {
	test("rejects an unknown email", async () => {
		mockedRepository.findByEmail.mockResolvedValueOnce(null);

		await expect(
			AuthService.login({ email: "jane@example.com", password: "secret123" }),
		).rejects.toMatchObject({ status: 401 });
	});

	test("rejects an unverified email", async () => {
		mockedRepository.findByEmail.mockResolvedValueOnce(
			userFixture({ emailVerified: null }),
		);

		await expect(
			AuthService.login({ email: "jane@example.com", password: "secret123" }),
		).rejects.toThrow("Email not verified");
	});

	test("rejects a wrong password", async () => {
		mockedRepository.findByEmail.mockResolvedValueOnce(userFixture());
		mockedPassword.verify.mockResolvedValueOnce(false);

		await expect(
			AuthService.login({ email: "jane@example.com", password: "wrong" }),
		).rejects.toMatchObject({ status: 401 });
	});

	test("issues tokens and drops the cached user", async () => {
		const user = userFixture();
		mockedRepository.findByEmail.mockResolvedValueOnce(user);
		mockedRepository.updateById.mockResolvedValueOnce(user);

		const response = await AuthService.login({
			email: "jane@example.com",
			password: "secret123",
		});

		expect(response.accessToken).toBeTypeOf("string");
		expect(response.refreshToken).toBeTypeOf("string");
		expect(mockedRepository.updateById).toHaveBeenCalledWith(
			user.id,
			expect.objectContaining({ loginAt: expect.any(Date) }),
		);
		expect(invalidateUserCache).toHaveBeenCalledWith(user.id);
	});
});

describe("AuthService.logout", () => {
	test("blacklists both token ids and clears the cache", async () => {
		const user = userFixture();
		const access = await generateAccessToken(user);
		const refresh = await generateRefreshToken(user);
		mockedRedis.set.mockResolvedValue("OK");

		await AuthService.logout(access, refresh, user.id);

		expect(mockedRedis.set).toHaveBeenCalledTimes(2);
		expect(invalidateUserCache).toHaveBeenCalledWith(user.id);
	});

	test("rejects tokens that belong to another user", async () => {
		const access = await generateAccessToken(userFixture());
		const refresh = await generateRefreshToken(userFixture());

		await expect(
			AuthService.logout(access, refresh, "another-user-id"),
		).rejects.toThrow(HTTPException);
	});
});

describe("AuthService.resetPassword", () => {
	test("rejects an invalid OTP before touching the password", async () => {
		mockedRedis.get.mockResolvedValueOnce("123456");
		mockedRedis.incr.mockResolvedValueOnce(1);

		await expect(
			AuthService.resetPassword({
				email: "jane@example.com",
				password: "newsecret123",
				otp: "000000",
			}),
		).rejects.toThrow("Invalid OTP");

		expect(mockedRepository.updateByEmail).not.toHaveBeenCalled();
	});

	test("stores the new hash and drops the cached user", async () => {
		const user = userFixture();
		mockedRedis.get.mockResolvedValueOnce("123456");
		mockedRepository.updateByEmail.mockResolvedValueOnce(user);

		await AuthService.resetPassword({
			email: "jane@example.com",
			password: "newsecret123",
			otp: "123456",
		});

		expect(mockedRepository.updateByEmail).toHaveBeenCalledWith(
			"jane@example.com",
			{ password: "new-hash" },
		);
		expect(invalidateUserCache).toHaveBeenCalledWith(user.id);
	});
});

describe("AuthService.googleLogin", () => {
	test("rejects incomplete Google profiles", async () => {
		await expect(
			AuthService.googleLogin({ email: "jane@example.com" }),
		).rejects.toMatchObject({ status: 400 });
	});

	test("creates a verified user on first Google login", async () => {
		const user = userFixture();
		const repo = {
			findByEmail: vi.fn().mockResolvedValue(null),
			create: vi.fn().mockResolvedValue(user),
			updateById: vi.fn(),
		};
		mockedRepository.transaction.mockImplementationOnce(
			async (fn) => await fn(repo as never),
		);

		const response = await AuthService.googleLogin({
			email: "jane@example.com",
			name: "Jane Doe",
		});

		expect(repo.create).toHaveBeenCalledWith(
			expect.objectContaining({ emailVerified: expect.any(Date) }),
		);
		expect(response.accessToken).toBeTypeOf("string");
		expect(response).not.toHaveProperty("id");
	});
});

describe("AuthService.refreshToken", () => {
	test("rejects a blacklisted refresh token", async () => {
		const refresh = await generateRefreshToken(userFixture());
		mockedRedis.exists.mockResolvedValueOnce(1);

		await expect(
			AuthService.refreshToken({ refreshToken: refresh }),
		).rejects.toThrow("Token has been invalidated");
	});

	test("rejects a refresh token whose user is gone", async () => {
		const refresh = await generateRefreshToken(userFixture());
		mockedRedis.exists.mockResolvedValueOnce(0);
		mockedRepository.findById.mockResolvedValueOnce(null);

		await expect(
			AuthService.refreshToken({ refreshToken: refresh }),
		).rejects.toMatchObject({ status: 401 });
	});

	test("rotates the refresh token exactly once", async () => {
		const user = userFixture();
		const refresh = await generateRefreshToken(user);
		mockedRedis.exists.mockResolvedValue(0);
		mockedRepository.findById.mockResolvedValue(user);
		mockedRedis.set.mockResolvedValueOnce("OK");

		const first = await AuthService.refreshToken({ refreshToken: refresh });
		expect(first.accessToken).toBeTypeOf("string");

		mockedRedis.set.mockResolvedValueOnce(null);
		await expect(
			AuthService.refreshToken({ refreshToken: refresh }),
		).rejects.toThrow("Token has been invalidated");
	});
});
