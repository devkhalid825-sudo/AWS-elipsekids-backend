import { PrismaClient } from "@prisma/client";
import { SEED_VIDEOS } from "./seed.js";

export const prisma = new PrismaClient();

// First run only: put the videos that used to be hard-coded on the site into the
// database so they can be managed from the admin panel.
export async function ensureSeed() {
  const marker = await prisma.content.findUnique({ where: { key: "_seeded" } });
  if (marker) return;
  const base = Date.now();
  // Oldest first, so the first video in the list ends up newest (the site lists newest first).
  await prisma.video.createMany({
    data: [...SEED_VIDEOS].reverse().map((v, i) => ({
      title: v.title,
      source: "youtube",
      youtubeId: v.youtube_id,
      createdAt: new Date(base + i * 1000),
    })),
  });
  await prisma.content.create({ data: { key: "_seeded", value: true } });
}

// Wrap async route handlers so errors reach the Express error handler (Express 4).
export const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// DB rows -> the JSON shape the website / admin panel already expects.
export const videoOut = (v) => ({
  id: v.id, title: v.title, source: v.source,
  youtube_id: v.youtubeId, file_url: v.fileUrl, thumb_url: v.thumbUrl,
  created_at: v.createdAt,
});
export const feedbackOut = (f) => ({
  id: f.id, text: f.text, author: f.author, child_age: f.childAge,
  rating: f.rating, status: f.status, created_at: f.createdAt,
});
export const inquiryOut = (i) => ({
  id: i.id, name: i.name, company: i.company, email: i.email,
  category: i.category, message: i.message, read: i.read, created_at: i.createdAt,
});
