import * as schema from "./schema";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";

const sqlite = new Database(import.meta.prod ? "/data/kal.db" : "data.db");
const db = drizzle(sqlite, { schema });

export async function getSubs() {
  return db.select().from(schema.subscribers);
}

export default db;
