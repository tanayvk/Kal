import * as jwt from "jsonwebtoken";
import { createMiddleware } from "hono/factory";
import { getSecret } from "./config";
import db from "./database";
import { users } from "./schema";

export const validateToken = createMiddleware(async (c, next) => {
  const token = c.req.header("authorization")?.split(" ")[1];
  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  try {
    const user = jwt.verify(token, await getSecret());
    c.set("user", user);
    await next();
  } catch (err) {
    return c.json({ error: "Unauthorized" }, 401);
  }
});

export const hashPassword = async (password: string) => {
  return Bun.password.hash(password);
};

export const comparePassword = async (password: string, hash: string) => {
  return Bun.password.verify(password, hash);
};

// TODO: set correct type for user
export const generateToken = async (user: any) => {
  return jwt.sign({ id: user.id, username: user.username }, await getSecret());
};

export const createUser = async (username: string, password: string) => {
  const hashedPassword = await hashPassword(password);
  const user = await db
    .insert(users)
    .values({ username, password: hashedPassword });
  return user;
};
