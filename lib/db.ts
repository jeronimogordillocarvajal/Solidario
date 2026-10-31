import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { SQLITE_SCHEMA } from "./schema";
import { seedIfEmpty } from "./seed";
import { uploadRoot } from "./uploads";

export { mediaUrl, readUpload, writeUpload } from "./uploads";
export type { MediaKind } from "./uploads";

type GlobalDb = {
  feriaDb?: Database.Database;
  feriaDbPath?: string;
};

const globalForDb = globalThis as typeof globalThis & GlobalDb;

export function databasePath() {
  return process.env.FERIA_DB_PATH || path.join(process.cwd(), "data", "feria.db");
}

export async function ensureDb() {
  const dbPath = databasePath();
  if (globalForDb.feriaDb && globalForDb.feriaDbPath === dbPath) return globalForDb.feriaDb;
  if (globalForDb.feriaDb) {
    globalForDb.feriaDb.close();
    globalForDb.feriaDb = undefined;
  }
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  fs.mkdirSync(uploadRoot(), { recursive: true });
  const database = new Database(dbPath);
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");
  database.pragma("busy_timeout = 4000");
  database.exec(SQLITE_SCHEMA);
  await seedIfEmpty(database);
  globalForDb.feriaDb = database;
  globalForDb.feriaDbPath = dbPath;
  return database;
}

export function getDb() {
  if (!globalForDb.feriaDb) {
    throw new Error("La base todavía no está lista.");
  }
  return globalForDb.feriaDb;
}
