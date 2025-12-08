import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL ?? process.env.DATABASE_PATH ?? "file:./blozhik.db";
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run drizzle commands");
}

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: connectionString,
  },
});
