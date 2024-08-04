import db from "./database";
import { config } from "./schema";
import { randomBytes } from "crypto";

function generateRandomSecret() {
  return randomBytes(32).toString("hex");
}

let secret: string | null = null;
export async function getSecret() {
  if (secret) return secret;
  const existingConfig = await db.query.config.findFirst({
    columns: { jwtSecret: true },
  });
  if (existingConfig && existingConfig.jwtSecret) {
    return (secret = existingConfig.jwtSecret);
  } else {
    const newSecret = generateRandomSecret();
    await db
      .insert(config)
      .values({ id: 1, jwtSecret: newSecret })
      .onConflictDoUpdate({ target: config.id, set: { jwtSecret: newSecret } });
    return (secret = newSecret);
  }
}

export async function getDefaultSender() {
  const config = await db.query.config.findFirst({
    columns: { defaultSender: true },
  });
  return config?.defaultSender;
}

export async function getSiteUrl() {
  const config = await db.query.config.findFirst({
    columns: { siteUrl: true },
  });
  return config?.siteUrl;
}

export async function setSiteUrl(siteUrl: string) {
  return await db
    .insert(config)
    .values({ id: 1, siteUrl })
    .onConflictDoUpdate({ target: config.id, set: { siteUrl } });
}
