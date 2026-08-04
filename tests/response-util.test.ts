import { describe, expect, test } from "vitest";
import { ResponseUtil } from "../src/util/response-util";

describe("ResponseUtil", () => {
	test("builds success responses", () => {
		expect(ResponseUtil.success({ id: "1" }, "Created")).toEqual({
			status: "success",
			message: "Created",
			data: { id: "1" },
			paging: undefined,
		});
	});

	test("builds error responses", () => {
		expect(ResponseUtil.error("Missing", 404)).toEqual({
			status: 404,
			message: "Missing",
			data: null,
		});
	});
});
