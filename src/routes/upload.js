import fs from "node:fs";
import { Router } from "express";
import { requireAdmin } from "../auth.js";
import { upload, isImage, publicPath, MAX_IMAGE_BYTES } from "../upload.js";

const r = Router();

// Admin: upload one image or video, get back its URL to paste into any content field.
r.post("/", requireAdmin, upload.single("file"), (req, res) => {
  const f = req.file;
  if (!f) return res.status(400).json({ detail: "No file received" });
  if (isImage(f) && f.size > MAX_IMAGE_BYTES) {
    fs.rm(f.path, { force: true }, () => {});
    return res.status(400).json({ detail: "Images must be under 15MB" });
  }
  res.status(201).json({ url: publicPath(f), type: isImage(f) ? "image" : "video", size: f.size });
});

export default r;
