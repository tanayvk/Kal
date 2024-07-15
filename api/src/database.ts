import * as schema from "./schema";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";

const sqlite = new Database("data.db");
const db = drizzle(sqlite, { schema });

export default db;
