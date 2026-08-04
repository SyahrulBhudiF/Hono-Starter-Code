import { describe, expect, test } from "vitest";
import { toUserResponse } from "../src/model/user-model";
import { AuthValidation } from "../src/validation/auth-validation";
import { UserValidation } from "../src/validation/user-validation";

const validUser = {
	id: "f89d208b-77d4-4f64-9d2a-5e7dc044a150",
	name: "Jane Doe",
	email: "jane@example.com",
	password: "hash",
	role: "USER" as const,
	emailVerified: null,
	loginAt: null,
	createdAt: null,
	updatedAt: null,
	deletedAt: null,
};

describe("request validation", () => {
	test("accepts valid auth and user payloads", () => {
		expect(
			AuthValidation.REGISTER.safeParse({
				name: "Jane Doe",
				email: "jane@example.com",
				password: "secret123",
			}).success,
		).toBe(true);
		expect(
			UserValidation.CHANGE_PASSWORD.safeParse({
				oldPassword: "secret123",
				newPassword: "newsecret123",
			}).success,
		).toBe(true);
	});

	test("rejects malformed auth and user payloads", () => {
		expect(
			AuthValidation.LOGIN.safeParse({ email: "bad", password: "short" })
				.success,
		).toBe(false);
		expect(
			AuthValidation.VERIFY_OTP.safeParse({
				email: "jane@example.com",
				otp: "123",
			}).success,
		).toBe(false);
		expect(UserValidation.UPDATE.safeParse({ name: "Al" }).success).toBe(false);
	});

	test("maps database users without credentials or internal fields", () => {
		expect(toUserResponse(validUser)).toEqual({
			name: "Jane Doe",
			email: "jane@example.com",
			role: "USER",
		});
	});
});
