import { Command } from "commander";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";

import { startEventsQueue } from "./events";
import { startSender } from "./sender";
import db from "./database";
import server from "./server";
import { createUser } from "./auth";
import { setSiteUrl } from "./config";

const program = new Command();

async function start() {
  startEventsQueue();
  startSender();
  await migrate(db, { migrationsFolder: "./drizzle" });
  Bun.serve(server);
}

async function init(username: string, password: string, domain: string) {
  try {
    await createUser(username, password);
    await setSiteUrl(`https://${domain}`);
  } catch (error) {
    console.error("Error creating user:", error);
  }
  process.exit();
}

program.command("start").description("Start Kal.").action(start);
program
  .command("init")
  .description("Initialize Kal.")
  .requiredOption("-u, --username <username>", "Username")
  .requiredOption("-p, --password <password>", "Password")
  .requiredOption("-d, --domain <domain>", "Domain")
  .action((cmdObj) => {
    const { username, password, domain } = cmdObj;
    init(username, password, domain);
  });
program.parse(process.argv);
