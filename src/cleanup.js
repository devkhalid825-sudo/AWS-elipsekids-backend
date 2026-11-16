import fs from "node:fs";
import path from "node:path";
import { prisma } from "./db.js";
import { UPLOAD_DIR } from "./paths.js";

// Files in uploads/ that nothing references any more (an image you replaced or removed)
// are deleted, so the disk does not fill up. A 24h grace period protects files that were
// just uploaded but not saved yet.
const GRACE_MS = 24 * 60 * 60 * 1000;

export async function cleanupUploads() {
  const refs = new Set();
  const collect = (text) => {
    for (const m of String(text ?? "").matchAll(/\/uploads\/([\w.-]+)/g)) refs.add(m[1]);
  };

  // If either query fails this throws before anything is deleted.
  const [contents, videos] = await Promise.all([prisma.content.findMany(), prisma.video.findMany()]);
  contents.forEach((c) => collect(JSON.stringify(c.value)));
  videos.forEach((v) => { collect(v.fileUrl); collect(v.thumbUrl); });

  let removed = 0;
  for (const name of await fs.promises.readdir(UPLOAD_DIR)) {
    if (refs.has(name)) continue;
    const full = path.join(UPLOAD_DIR, name);
    const st = await fs.promises.stat(full);
    if (!st.isFile() || Date.now() - st.mtimeMs < GRACE_MS) continue;
    await fs.promises.rm(full, { force: true });
    removed++;
  }
  return removed;
}

export function scheduleCleanup() {
  const run = () =>
    cleanupUploads()
      .then((n) => n && console.log(`Cleanup: removed ${n} unused upload(s)`))
      .catch((e) => console.error("Cleanup failed:", e.message));
  setTimeout(run, 60 * 1000);
  setInterval(run, 12 * 60 * 60 * 1000).unref();
}
