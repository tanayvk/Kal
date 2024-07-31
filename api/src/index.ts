import { createInterface } from "readline";
import { Command } from "commander";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";

import { startEventsQueue } from "./events";
import { startSender } from "./sender";
import db from "./database";
import server from "./server";
import { createUser } from "./auth";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function askQuestion(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

const program = new Command();

async function start() {
  startEventsQueue();
  startSender();
  await migrate(db, { migrationsFolder: "./drizzle" });
  Bun.serve(server);
}

async function init(username: string, password: string) {
  try {
    await createUser(username, password);
  } catch (error) {
    console.error("Error creating user:", error);
  }
  process.exit();
}

program.command("start").description("Start Kal.").action(start);
program
  .command("init")
  .description("Initialize Kal.")
  .requiredOption("-u, --username <username>", "Username for the new user")
  .requiredOption("-p, --password <password>", "Password for the new user")
  .action((cmdObj) => {
    const { username, password } = cmdObj;
    init(username, password);
  });
program.parse(process.argv);
