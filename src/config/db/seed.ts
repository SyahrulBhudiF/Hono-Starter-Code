import { faker } from "@faker-js/faker";
import { password } from "bun";
import { reset } from "drizzle-seed";
import { logger } from "../logging";
import { db } from "./index";
import * as schema from "./schema";
import { type NewUser, usersTable } from "./schema";

async function seed() {
	logger.info("Seeding users");

	await reset(db, schema);

	const users: NewUser[] = Array.from({ length: 10 }, () => ({
		name: faker.person.fullName(),
		email: faker.internet.email().toLowerCase(),
		password: password.hashSync("admin11", "bcrypt"),
		emailVerified: faker.date.recent(),
		role: "USER",
	}));

	users.push({
		name: "Admin",
		email: "admin@gmail.com",
		password: password.hashSync("admin11", "bcrypt"),
		emailVerified: faker.date.recent(),
		role: "ADMIN",
	});

	await db.insert(usersTable).values(users);

	logger.info("Seeding completed");
}

seed()
	.then(() => process.exit(0))
	.catch((error) => {
		logger.error(`Seeding failed: ${error}`);
		process.exit(1);
	});
