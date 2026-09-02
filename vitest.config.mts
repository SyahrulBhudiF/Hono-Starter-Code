import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			bun: new URL("./tests/mocks/bun.ts", import.meta.url).pathname,
			"hono/bun": new URL("./tests/mocks/hono-bun.ts", import.meta.url)
				.pathname,
		},
	},
	test: {
		include: ["tests/**/*.test.ts"],
		exclude: ["node_modules/**"],
		setupFiles: ["./tests/setup-env.ts"],
		coverage: {
			provider: "v8",
			include: [
				"src/util/**/*.ts",
				"src/validation/**/*.ts",
				"src/model/**/*.ts",
				"src/service/**/*.ts",
				"src/middleware/**/*.ts",
				"src/repository/**/*.ts",
			],
			exclude: ["src/model/app-model.ts"],
			thresholds: {
				branches: 80,
				functions: 80,
				lines: 80,
				statements: 80,
			},
		},
	},
});
