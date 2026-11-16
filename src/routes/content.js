import { Router } from "express";
import { prisma, ah } from "../db.js";
import { requireAdmin } from "../auth.js";

const r = Router();

// Editable sections of the website. The frontend ships defaults for each one;
// what is stored here are the overrides saved from the admin panel.
export const SECTIONS = ["site", "hero", "bond", "whatsNew", "about", "partner", "pages"];

r.get("/", ah(async (_req, res) => {
  const rows = await prisma.content.findMany({ where: { key: { in: SECTIONS } } });
  res.json(Object.fromEntries(rows.map((row) => [row.key, row.value])));
}));

r.put("/:key", requireAdmin, ah(async (req, res) => {
  const { key } = req.params;
  if (!SECTIONS.includes(key)) return res.status(404).json({ detail: "Unknown section" });
  const value = req.body;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return res.status(400).json({ detail: "Body must be a JSON object" });
  }
  if (JSON.stringify(value).length > 300_000) return res.status(413).json({ detail: "Content too large" });
  await prisma.content.upsert({ where: { key }, update: { value }, create: { key, value } });
  res.json(value);
}));

// Reset a section back to the built-in defaults.
r.delete("/:key", requireAdmin, ah(async (req, res) => {
  if (!SECTIONS.includes(req.params.key)) return res.status(404).json({ detail: "Unknown section" });
  await prisma.content.deleteMany({ where: { key: req.params.key } });
  res.json({ ok: true });
}));

export default r;
