import { swaggerUI } from "@hono/swagger-ui";
import errorUtil from "./util/error-util";
import { honoApp } from "./config/hono";
import { api } from "./route";

const app = honoApp();

app.route("/api/v1", api);

app.doc("/doc", {
	openapi: "3.0.0",
	info: {
		version: "1.0.0",
		title: "My API",
	},
});

app.onError(errorUtil);

app.get("/", (c) => {
	return c.text("Hello Hono!");
});

app.get("/ui", swaggerUI({ url: "/doc" }));

export default app;
