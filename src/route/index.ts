import { honoApp } from "../config/hono";
import { authController } from "../controller/auth-controller";
import { userController } from "../controller/user-controller";
import { rateLimit } from "../middleware/rate-limit";

export const api = honoApp();

api.openAPIRegistry.registerComponent("securitySchemes", "BearerAuth", {
	type: "http",
	scheme: "bearer",
	bearerFormat: "JWT",
	description: "Masukkan access token tanpa prefix Bearer",
});

api.use("/auth/login", rateLimit(10, 60));
api.use("/auth/send-otp", rateLimit(5, 60));
api.use("/auth/refresh-token", rateLimit(20, 60));
api.route("/auth", authController);
api.route("/", userController);
