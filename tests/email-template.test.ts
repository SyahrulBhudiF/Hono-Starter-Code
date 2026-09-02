import { describe, expect, test } from "vitest";
import { otpEmail } from "../src/util/email-template";

describe("otpEmail", () => {
	test("renders the OTP into the message body", () => {
		const { subject, html } = otpEmail("123456");

		expect(subject).toBe("Your OTP Code");
		expect(html).toContain("<strong>123456</strong>");
	});
});
