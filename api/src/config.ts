import db from "./database";
import { config } from "./schema";
import { randomBytes } from "crypto";

function generateRandomSecret() {
  return randomBytes(32).toString("hex");
}

export async function getSecret() {
  const existingConfig = await db.query.config.findFirst({
    columns: { jwtSecret: true },
  });
  if (existingConfig && existingConfig.jwtSecret) {
    return existingConfig.jwtSecret;
  } else {
    const newSecret = generateRandomSecret();
    await db
      .insert(config)
      .values({ id: 1, jwtSecret: newSecret })
      .onConflictDoUpdate({ target: config.id, set: { jwtSecret: newSecret } });
    return newSecret;
  }
}

export async function getDefaultSender() {
  const config = await db.query.config.findFirst({
    columns: { defaultSender: true },
  });
  return config?.defaultSender;
}
