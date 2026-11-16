import crypto from "node:crypto";
import path from "node:path";
import multer from "multer";
import { UPLOAD_DIR } from "./paths.js";

const IMAGE_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);
const VIDEO_EXT = new Set([".mp4", ".webm", ".mov", ".m4v"]);

export const isImage = (f) => f.mimetype.startsWith("image/") && IMAGE_EXT.has(path.extname(f.originalname).toLowerCase());
export const isVideo = (f) => f.mimetype.startsWith("video/") && VIDEO_EXT.has(path.extname(f.originalname).toLowerCase());

export const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req, file, cb) =>
      cb(null, crypto.randomUUID() + path.extname(file.originalname).toLowerCase()),
  }),
  limits: { fileSize: 500 * 1024 * 1024, files: 2 },
  fileFilter: (_req, file, cb) => {
    if (isImage(file) || isVideo(file)) return cb(null, true);
    cb(new Error("Only png/jpg/webp/gif images and mp4/webm/mov videos are allowed."));
  },
});

export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
export const publicPath = (file) => `/uploads/${file.filename}`;
