import "./env.js";
import express from "express";
import cors from "cors";
import { UPLOAD_DIR } from "./paths.js";
import { ensureSeed } from "./db.js";
import { scheduleCleanup } from "./cleanup.js";
import authRoutes from "./routes/auth.js";
import videoRoutes from "./routes/videos.js";
import feedbackRoutes from "./routes/feedback.js";
import contentRoutes from "./routes/content.js";
import uploadRoutes from "./routes/upload.js";
import inquiryRoutes from "./routes/inquiries.js";

const app = express();
app.disable("x-powered-by");

const origins = (process.env.CORS_ORIGIN || "http://localhost:5173").split(",").map((s) => s.trim());
app.set("trust proxy", 1); // behind Nginx: real client IP for rate limiting
app.use(cors({ origin: origins }));
app.use(express.json({ limit: "400kb" }));

// Public data is always revalidated (cheap 304 when unchanged), so admin edits show up
// without anyone clearing their cache.
app.use(["/content", "/videos", "/feedback/approved"], (req, res, next) => {
  if (req.method === "GET") res.setHeader("Cache-Control", "no-cache");
  next();
});

// Uploaded images / videos (served with range support so videos can seek).
// Every upload gets a unique random file name, so a replaced image has a NEW url and is never
// stale; old names can be cached for a year safely.
app.use(
  "/uploads",
  express.static(UPLOAD_DIR, {
    maxAge: "365d",
    immutable: true,
    setHeaders: (res) => {
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.setHeader("X-Content-Type-Options", "nosniff");
    },
  })
);

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/auth", authRoutes);
app.use("/videos", videoRoutes);
app.use("/feedback", feedbackRoutes);
app.use("/content", contentRoutes);
app.use("/upload", uploadRoutes);
app.use("/inquiries", inquiryRoutes);

app.use((_req, res) => res.status(404).json({ detail: "Not found" }));
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.code === "LIMIT_FILE_SIZE" ? 413 : err.status || 400;
  res.status(status).json({ detail: err.message || "Request failed" });
});

const port = Number(process.env.PORT || 5006);
await ensureSeed();
scheduleCleanup();
app.listen(port, () => console.log(`Elipse Kids API running on port ${port}`));
