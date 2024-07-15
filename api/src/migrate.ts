import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import db from "./database";

await migrate(db, { migrationsFolder: "./drizzle" });
