import { swaggerUI } from "@hono/swagger-ui";
import { Scalar } from "@scalar/hono-api-reference";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { honoApp } from "./config/hono";
import { api } from "./route";
import errorUtil from "./util/error-util";

export const createApp = () => {
	const app = honoApp();

	app.use("*", requestId());
	app.use("*", secureHeaders());

	app.route("/api/v1", api);

	app.doc31("/doc", {
		openapi: "3.1.0",
		info: {
			version: "1.0.0",
			title: "Hono Starter API",
		},
	});

	app.onError(errorUtil);

	app.get("/", (c) => {
		return c.text("Hello Hono!");
	});

	app.get("/ui", swaggerUI({ url: "/doc" }));
	app.get(
		"/scalar",
		Scalar({
			url: "/doc",
			theme: "purple",
			pageTitle: "Hono Starter API Reference",
		}),
	);

	return app;
};

const app = createApp();

export type AppType = typeof app;
export default app;
