import { describe, expect, test } from "bun:test";
import { ResponseUtil } from "../../src/util/response-util";

describe("ResponseUtil", () => {
	test("builds success responses", () => {
		expect(ResponseUtil.success({ id: "user-1" }, "Created")).toEqual({
			status: "success",
			message: "Created",
			data: { id: "user-1" },
			paging: undefined,
		});
	});

	test("builds error responses", () => {
		expect(ResponseUtil.error("Unauthorized", 401)).toEqual({
			status: 401,
			message: "Unauthorized",
			data: null,
		});
	});
});
