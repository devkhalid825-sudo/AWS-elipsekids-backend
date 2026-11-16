import fs from "node:fs";
import path from "node:path";
import { Router } from "express";
import { prisma, ah, videoOut } from "../db.js";
import { UPLOAD_DIR } from "../paths.js";
import { requireAdmin } from "../auth.js";
import { upload, isImage, isVideo, publicPath, MAX_IMAGE_BYTES } from "../upload.js";

const r = Router();

export function parseYoutubeId(input = "") {
  const s = String(input).trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  const m =
    s.match(/[?&]v=([\w-]{11})/) ||
    s.match(/youtu\.be\/([\w-]{11})/) ||
    s.match(/youtube(?:-nocookie)?\.com\/(?:embed|shorts|live|v)\/([\w-]{11})/);
  return m ? m[1] : null;
}

const removeUpload = (url) => {
  if (!url || !url.startsWith("/uploads/")) return;
  fs.rm(path.join(UPLOAD_DIR, path.basename(url)), { force: true }, () => {});
};
const discard = (files) => Object.values(files || {}).flat().forEach((f) => fs.rm(f.path, { force: true }, () => {}));

// Public: list videos (newest first)
r.get("/", ah(async (_req, res) => {
  const rows = await prisma.video.findMany({ orderBy: { createdAt: "desc" } });
  res.json(rows.map(videoOut));
}));

// Admin: add a video. Either JSON {embed_url, title} (YouTube link)
// or multipart with a `video` file (+ optional `thumbnail` image) and `title`.
r.post(
  "/",
  requireAdmin,
  upload.fields([{ name: "video", maxCount: 1 }, { name: "thumbnail", maxCount: 1 }]),
  ah(async (req, res) => {
    const files = req.files || {};
    const title = String(req.body.title || "").trim().slice(0, 200);
    if (!title) { discard(files); return res.status(400).json({ detail: "Title is required" }); }

    const video = files.video?.[0];
    const thumb = files.thumbnail?.[0];
    if (thumb && (!isImage(thumb) || thumb.size > MAX_IMAGE_BYTES)) {
      discard(files);
      return res.status(400).json({ detail: "Thumbnail must be an image under 15MB" });
    }

    let data;
    if (video) {
      if (!isVideo(video)) { discard(files); return res.status(400).json({ detail: "Invalid video file" }); }
      data = { source: "upload", fileUrl: publicPath(video) };
    } else {
      const ytId = parseYoutubeId(req.body.embed_url);
      if (!ytId) { discard(files); return res.status(400).json({ detail: "Could not find a YouTube video id in that link" }); }
      data = { source: "youtube", youtubeId: ytId };
    }

    const item = await prisma.video.create({
      data: { title, ...data, thumbUrl: thumb ? publicPath(thumb) : null },
    });
    res.status(201).json(videoOut(item));
  })
);

r.delete("/:id", requireAdmin, ah(async (req, res) => {
  const v = await prisma.video.findUnique({ where: { id: req.params.id } });
  if (!v) return res.status(404).json({ detail: "Not found" });
  await prisma.video.delete({ where: { id: v.id } });
  removeUpload(v.fileUrl);
  removeUpload(v.thumbUrl);
  res.json({ ok: true });
}));

export default r;
