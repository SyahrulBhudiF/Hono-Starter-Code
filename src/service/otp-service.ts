import { HTTPException } from "hono/http-exception";
import redis from "../config/redis";
import type { VerifyOTPRequest } from "../model/user-model";
import { userRepository } from "../repository/user-repository";
import { generateOTP, isOTPMatch } from "../util/otp-util";
import { invalidateUserCache } from "../util/user-cache";

const OTP_TTL_SECONDS = 300;
const OTP_MAX_ATTEMPTS = 5;

const otpKey = (email: string) => `otp:${email}`;
const otpAttemptsKey = (email: string) => `otp-attempts:${email}`;

async function clearOTP(email: string): Promise<void> {
	await redis.del(otpKey(email), otpAttemptsKey(email));
}

async function registerFailedAttempt(email: string): Promise<void> {
	const attempts = await redis.incr(otpAttemptsKey(email));

	if (attempts === 1) {
		await redis.expire(otpAttemptsKey(email), OTP_TTL_SECONDS);
	}

	if (attempts >= OTP_MAX_ATTEMPTS) {
		await clearOTP(email);
		throw new HTTPException(429, {
			message: "Too many invalid OTP attempts, request a new code",
		});
	}
}

export const OtpService = {
	async generateAndStoreOTP(email: string): Promise<string> {
		const otp = generateOTP();

		await redis.del(otpAttemptsKey(email));
		await redis.set(otpKey(email), otp, "EX", OTP_TTL_SECONDS);

		return otp;
	},

	async assertValidOTP(email: string, otp: string): Promise<void> {
		const storedOTP = await redis.get(otpKey(email));

		if (!storedOTP || !isOTPMatch(String(otp), storedOTP)) {
			await registerFailedAttempt(email);
			throw new HTTPException(401, { message: "Invalid OTP" });
		}

		await clearOTP(email);
	},

	async verifyOTP(request: VerifyOTPRequest, purpose?: string): Promise<void> {
		await OtpService.assertValidOTP(request.email, request.otp);

		if (purpose !== "register") {
			return;
		}

		const user = await userRepository.findByEmail(request.email);

		if (user?.emailVerified) {
			throw new HTTPException(400, { message: "Email already verified" });
		}

		const verified = await userRepository.updateByEmail(request.email, {
			emailVerified: new Date(),
		});

		await invalidateUserCache(verified.id);
	},
};
