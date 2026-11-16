import { Router } from "express";
import { prisma, ah, inquiryOut } from "../db.js";
import { requireAdmin, rateLimit } from "../auth.js";
import { sendInquiryEmail } from "../mailer.js";

const r = Router();
const field = (v, max) => String(v ?? "").trim().slice(0, max);

// Public: partner inquiry form on /partner
r.post("/", rateLimit("inquiry", 5, 60 * 60 * 1000), ah(async (req, res) => {
  const data = {
    name: field(req.body?.name, 120),
    company: field(req.body?.company, 160),
    email: field(req.body?.email, 200),
    category: field(req.body?.category, 120),
    message: field(req.body?.message, 3000),
  };
  if (!data.name || !data.company || !data.message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return res.status(400).json({ detail: "Please fill in name, company, a valid email and a message." });
  }
  const saved = await prisma.inquiry.create({ data });
  const emailed = await sendInquiryEmail(saved);
  res.status(201).json({ ok: true, emailed });
}));

r.get("/", requireAdmin, ah(async (_req, res) => {
  const rows = await prisma.inquiry.findMany({ orderBy: { createdAt: "desc" } });
  res.json(rows.map(inquiryOut));
}));

r.patch("/:id/read", requireAdmin, ah(async (req, res) => {
  const found = await prisma.inquiry.findUnique({ where: { id: req.params.id } });
  if (!found) return res.status(404).json({ detail: "Not found" });
  res.json(inquiryOut(await prisma.inquiry.update({ where: { id: found.id }, data: { read: true } })));
}));

r.delete("/:id", requireAdmin, ah(async (req, res) => {
  await prisma.inquiry.deleteMany({ where: { id: req.params.id } });
  res.json({ ok: true });
}));

export default r;
