import { Router } from "express";
import { prisma, ah, feedbackOut } from "../db.js";
import { requireAdmin, rateLimit } from "../auth.js";

const r = Router();
const clip = (v, n) => (v == null ? null : String(v).trim().slice(0, n) || null);

r.get("/approved", ah(async (_req, res) => {
  const rows = await prisma.feedback.findMany({ where: { status: "approved" }, orderBy: { createdAt: "desc" } });
  res.json(rows.map(feedbackOut));
}));

r.post("/", rateLimit("feedback", 5, 60 * 60 * 1000), ah(async (req, res) => {
  const text = clip(req.body?.text, 1000);
  if (!text) return res.status(400).json({ detail: "Text is required" });
  await prisma.feedback.create({
    data: {
      text,
      author: clip(req.body?.author, 80),
      childAge: clip(req.body?.child_age, 20),
      rating: Math.min(5, Math.max(1, parseInt(req.body?.rating, 10) || 5)),
    },
  });
  res.status(201).json({ ok: true });
}));

r.get("/", requireAdmin, ah(async (_req, res) => {
  const rows = await prisma.feedback.findMany({ orderBy: { createdAt: "desc" } });
  res.json(rows.map(feedbackOut));
}));

const setStatus = (status) => ah(async (req, res) => {
  const found = await prisma.feedback.findUnique({ where: { id: req.params.id } });
  if (!found) return res.status(404).json({ detail: "Not found" });
  res.json(feedbackOut(await prisma.feedback.update({ where: { id: found.id }, data: { status } })));
});
r.patch("/:id/approve", requireAdmin, setStatus("approved"));
r.patch("/:id/reject", requireAdmin, setStatus("rejected"));
r.patch("/:id/restore", requireAdmin, setStatus("pending"));

r.delete("/:id", requireAdmin, ah(async (req, res) => {
  await prisma.feedback.deleteMany({ where: { id: req.params.id } });
  res.json({ ok: true });
}));

export default r;
