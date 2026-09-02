import { Scalar } from "@scalar/hono-api-reference";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { pingDatabase } from "./config/db";
import { corsOrigins, env } from "./config/env";
import { honoApp } from "./config/hono";
import { pingRedis } from "./config/redis";
import { requestLogger } from "./middleware/request-logger";
import { api } from "./route";
import errorUtil from "./util/error-util";

export const createApp = () => {
	const app = honoApp();

	app.use("*", requestId());
	app.use("*", requestLogger());
	app.use("*", secureHeaders());
	app.use("/api/*", bodyLimit({ maxSize: env.BODY_LIMIT_BYTES }));
	app.use("/api/*", cors({ origin: corsOrigins }));

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

	app.get("/health", async (c) => {
		const [database, redis] = await Promise.all([pingDatabase(), pingRedis()]);
		const healthy = database && redis;

		return c.json(
			{
				status: healthy ? "ok" : "degraded",
				checks: { database, redis },
			},
			healthy ? 200 : 503,
		);
	});

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
