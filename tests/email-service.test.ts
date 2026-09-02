import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../src/config/queue", () => ({
	emailQueue: { add: vi.fn() },
}));

vi.mock("../src/repository/user-repository", () => ({
	userRepository: { findByEmail: vi.fn() },
}));

vi.mock("../src/service/otp-service", () => ({
	OtpService: { generateAndStoreOTP: vi.fn(async () => "123456") },
}));

const { emailQueue } = await import("../src/config/queue");
const { userRepository } = await import("../src/repository/user-repository");
const { EmailService } = await import("../src/service/email-service");
const { userFixture } = await import("./fixtures");

const mockedRepository = vi.mocked(userRepository);
const mockedQueue = vi.mocked(emailQueue);

beforeEach(() => {
	vi.clearAllMocks();
});

describe("EmailService.sendOTP", () => {
	test("does not queue a job for an unknown email", async () => {
		mockedRepository.findByEmail.mockResolvedValueOnce(null);

		await EmailService.sendOTP("ghost@example.com");

		expect(mockedQueue.add).not.toHaveBeenCalled();
	});

	test("queues an OTP job for a known email", async () => {
		mockedRepository.findByEmail.mockResolvedValueOnce(userFixture());

		await EmailService.sendOTP("jane@example.com");

		expect(mockedQueue.add).toHaveBeenCalledWith({
			email: "jane@example.com",
			otp: "123456",
		});
	});
});
