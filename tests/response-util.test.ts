import { describe, expect, test } from "vitest";
import { ResponseUtil } from "../src/util/response-util";

describe("ResponseUtil", () => {
	test("builds success responses with an HTTP-aligned status", () => {
		expect(ResponseUtil.success({ id: "1" }, "Created")).toEqual({
			status: 200,
			message: "Created",
			data: { id: "1" },
		});
	});

	test("accepts an explicit status and paging block", () => {
		const paging = { page: 1, size: 10, totalItems: 1, totalPages: 1 };

		expect(
			ResponseUtil.success([{ id: "1" }], "Listed", { status: 201, paging }),
		).toEqual({
			status: 201,
			message: "Listed",
			data: [{ id: "1" }],
			paging,
		});
	});

	test("builds error responses", () => {
		expect(ResponseUtil.error("Missing", 404)).toEqual({
			status: 404,
			message: "Missing",
			data: null,
		});
	});

	test("defaults errors to 500", () => {
		expect(ResponseUtil.error("Boom").status).toBe(500);
	});
});
