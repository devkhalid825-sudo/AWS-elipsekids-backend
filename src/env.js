// Must be imported first: loads backend/.env into process.env (Node 20.12+).
import path from "node:path";
import { fileURLToPath } from "node:url";

const file = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env");
try {
  process.loadEnvFile(file);
} catch {
  /* no .env file: rely on real environment variables */
}
