import { compareSync, hashSync } from "bcrypt-ts";

export function generateHashedPassword(password: string): string {
  return hashSync(password, 10);
}

export function verifyPassword(password: string, hashedPassword: string): boolean {
  return compareSync(password, hashedPassword);
}

export function generateUUID(): string {
  return crypto.randomUUID();
}