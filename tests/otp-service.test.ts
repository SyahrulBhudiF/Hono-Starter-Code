import { HTTPException } from "hono/http-exception";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../src/config/redis", () => ({
	default: {
		get: vi.fn(),
		set: vi.fn(),
		del: vi.fn(),
		incr: vi.fn(),
		expire: vi.fn(),
	},
}));

vi.mock("../src/repository/user-repository", () => ({
	userRepository: {
		findByEmail: vi.fn(),
		updateByEmail: vi.fn(),
	},
}));

vi.mock("../src/util/user-cache", () => ({
	invalidateUserCache: vi.fn(),
}));

const { default: redis } = await import("../src/config/redis");
const { userRepository } = await import("../src/repository/user-repository");
const { invalidateUserCache } = await import("../src/util/user-cache");
const { OtpService } = await import("../src/service/otp-service");
const { userFixture } = await import("./fixtures");

const mockedRedis = vi.mocked(redis);
const mockedRepository = vi.mocked(userRepository);

beforeEach(() => {
	vi.clearAllMocks();
});

describe("OtpService", () => {
	test("stores a fresh OTP and clears previous attempts", async () => {
		const otp = await OtpService.generateAndStoreOTP("jane@example.com");

		expect(otp).toMatch(/^\d{6}$/);
		expect(mockedRedis.del).toHaveBeenCalledWith(
			"otp-attempts:jane@example.com",
		);
		expect(mockedRedis.set).toHaveBeenCalledWith(
			"otp:jane@example.com",
			otp,
			"EX",
			300,
		);
	});

	test("accepts a matching OTP and clears the stored code", async () => {
		mockedRedis.get.mockResolvedValueOnce("123456");

		await OtpService.assertValidOTP("jane@example.com", "123456");

		expect(mockedRedis.del).toHaveBeenCalledWith(
			"otp:jane@example.com",
			"otp-attempts:jane@example.com",
		);
	});

	test("rejects a wrong OTP and counts the attempt", async () => {
		mockedRedis.get.mockResolvedValueOnce("123456");
		mockedRedis.incr.mockResolvedValueOnce(1);

		await expect(
			OtpService.assertValidOTP("jane@example.com", "654321"),
		).rejects.toThrow(HTTPException);

		expect(mockedRedis.incr).toHaveBeenCalledWith(
			"otp-attempts:jane@example.com",
		);
		expect(mockedRedis.expire).toHaveBeenCalledWith(
			"otp-attempts:jane@example.com",
			300,
		);
	});

	test("rejects an OTP of a different length without leaking a match", async () => {
		mockedRedis.get.mockResolvedValueOnce("123456");
		mockedRedis.incr.mockResolvedValueOnce(2);

		await expect(
			OtpService.assertValidOTP("jane@example.com", "12345"),
		).rejects.toThrow(HTTPException);
	});

	test("burns the OTP after too many invalid attempts", async () => {
		mockedRedis.get.mockResolvedValueOnce("123456");
		mockedRedis.incr.mockResolvedValueOnce(5);

		await expect(
			OtpService.assertValidOTP("jane@example.com", "000000"),
		).rejects.toMatchObject({ status: 429 });

		expect(mockedRedis.del).toHaveBeenCalledWith(
			"otp:jane@example.com",
			"otp-attempts:jane@example.com",
		);
	});

	test("rejects verification when no OTP is stored", async () => {
		mockedRedis.get.mockResolvedValueOnce(null);
		mockedRedis.incr.mockResolvedValueOnce(1);

		await expect(
			OtpService.assertValidOTP("jane@example.com", "123456"),
		).rejects.toThrow(HTTPException);
	});

	test("marks the email verified and drops the user cache on register", async () => {
		const user = userFixture({ emailVerified: null });
		mockedRedis.get.mockResolvedValueOnce("123456");
		mockedRepository.findByEmail.mockResolvedValueOnce(user);
		mockedRepository.updateByEmail.mockResolvedValueOnce(user);

		await OtpService.verifyOTP(
			{ email: "jane@example.com", otp: "123456" },
			"register",
		);

		expect(mockedRepository.updateByEmail).toHaveBeenCalledWith(
			"jane@example.com",
			expect.objectContaining({ emailVerified: expect.any(Date) }),
		);
		expect(invalidateUserCache).toHaveBeenCalledWith(user.id);
	});

	test("rejects re-verifying an already verified email", async () => {
		mockedRedis.get.mockResolvedValueOnce("123456");
		mockedRepository.findByEmail.mockResolvedValueOnce(userFixture());

		await expect(
			OtpService.verifyOTP(
				{ email: "jane@example.com", otp: "123456" },
				"register",
			),
		).rejects.toMatchObject({ status: 400 });
	});

	test("skips user updates when no purpose is given", async () => {
		mockedRedis.get.mockResolvedValueOnce("123456");

		await OtpService.verifyOTP({ email: "jane@example.com", otp: "123456" });

		expect(mockedRepository.updateByEmail).not.toHaveBeenCalled();
	});
});
