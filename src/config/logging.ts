import type { Logger } from "drizzle-orm";
import * as winston from "winston";
import { env, isProduction } from "./env";

const { combine, timestamp, printf, colorize, align, json, errors } =
	winston.format;

const developmentFormat = combine(
	colorize({ all: true }),
	timestamp({ format: "YYYY-MM-DD hh:mm:ss.SSS A" }),
	align(),
	printf((info) => `[${info.timestamp}] ${info.level}: ${info.message}`),
);

const productionFormat = combine(errors({ stack: true }), timestamp(), json());

export const logger = winston.createLogger({
	level: env.LOG_LEVEL,
	format: isProduction ? productionFormat : developmentFormat,
	transports: [new winston.transports.Console()],
});

export const drizzleLogger: Logger = {
	logQuery(query: string) {
		logger.debug(`Database query: ${query.replace(/\s+/g, " ").trim()}`);
	},
};
