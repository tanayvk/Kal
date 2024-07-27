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

async function init() {
  console.log("Let's create a user to access Kal.");
  const username = await askQuestion("Enter a username: ");
  let password;
  let confirmPassword;
  do {
    password = await askQuestion("Enter a password: ");
    confirmPassword = password;
    // TODO: mask password + confirm
    // confirmPassword = readlineSync.question("Confirm password: ", {
    //   hideEchoBack: true,
    // });
    // if (password !== confirmPassword) {
    //   console.error("Passwords do not match. Please try again.");
    // }
  } while (password !== confirmPassword);
  try {
    await createUser(username, password);
    console.log(`User '${username}' created successfully.`);
    console.log(`You can now login to Kal.`);
  } catch (error) {
    console.error("Error creating user:", error);
  }
  process.exit();
}

program.command("start").description("Start Kal.").action(start);
program.command("init").description("Init Kal.").action(init);
program.parse(process.argv);
