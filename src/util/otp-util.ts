import { Buffer } from "node:buffer";
import crypto from "node:crypto";

export function generateOTP(length: number = 6): string {
	const randomBytes = crypto.randomBytes(length);
	let otp = "";

	for (let i = 0; i < length; i++) {
		const digit = randomBytes[i] % 10;
		otp += digit.toString();
	}

	return otp;
}

export function isOTPMatch(input: string, stored: string): boolean {
	const inputBuffer = Buffer.from(input, "utf8");
	const storedBuffer = Buffer.from(stored, "utf8");

	if (inputBuffer.length !== storedBuffer.length) {
		return false;
	}

	return crypto.timingSafeEqual(inputBuffer, storedBuffer);
}
