import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

// Uploaded images / videos are stored on the server disk (back this folder up).
// Override with UPLOAD_DIR in .env to keep them outside the app folder.
export const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.resolve(here, "../uploads");

fs.mkdirSync(UPLOAD_DIR, { recursive: true });
