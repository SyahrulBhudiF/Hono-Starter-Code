import { describe, expect, test } from "vitest";
import { Role } from "../src/types/enum/role-enum";
import { enumToArray } from "../src/util/enum-util";
import { generateOTP } from "../src/util/otp-util";
import { ResponseUtil } from "../src/util/response-util";
import { requireEnv } from "../src/util/util";

describe("utility helpers", () => {
	test("returns enum string values", () => {
		expect(enumToArray(Role)).toEqual(["USER", "ADMIN"]);
	});

	test("generates numeric OTPs of the requested length", () => {
		expect(generateOTP()).toMatch(/^\d{6}$/);
		expect(generateOTP(4)).toMatch(/^\d{4}$/);
	});

	test("builds success and error response bodies", () => {
		expect(ResponseUtil.success({ id: 1 }, "Created")).toEqual({
			status: "success",
			message: "Created",
			data: { id: 1 },
			paging: undefined,
		});
		expect(ResponseUtil.error("Missing", 404)).toEqual({
			status: 404,
			message: "Missing",
			data: null,
		});
	});

	test("reads required and explicitly nullable environment variables", () => {
		process.env.TEST_REQUIRED_ENV = "value";
		expect(requireEnv("TEST_REQUIRED_ENV")).toBe("value");
		delete process.env.TEST_OPTIONAL_ENV;
		expect(
			requireEnv("TEST_OPTIONAL_ENV", ["TEST_OPTIONAL_ENV"]),
		).toBeUndefined();
	});

	test("rejects a missing required environment variable", () => {
		delete process.env.TEST_MISSING_ENV;
		expect(() => requireEnv("TEST_MISSING_ENV")).toThrow(
			"Missing environment variable: TEST_MISSING_ENV",
		);
	});
});
