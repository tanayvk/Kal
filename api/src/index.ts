import { migrate } from "drizzle-orm/bun-sqlite/migrator";

import { startEventsQueue } from "./events";
import { startSender } from "./sender";
import db from "./database";
import server from "./server";

async function start() {
  startEventsQueue();
  startSender();
  await migrate(db, { migrationsFolder: "./drizzle" });
  Bun.serve(server);
}

start();
