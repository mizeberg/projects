import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";
export const passwordHash = (password) => {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
};
export const verifyPassword = (password, stored) => {
  try {
    const [salt, hash] = stored.split(":");
    return timingSafeEqual(
      Buffer.from(hash, "hex"),
      scryptSync(password, salt, 64),
    );
  } catch {
    return false;
  }
};
export { validProgress } from "../src/lib/progress-schema.js";
