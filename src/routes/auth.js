import { Router } from "express";
import { checkCredentials, signToken, rateLimit } from "../auth.js";

const r = Router();

r.post("/login", rateLimit("login", 10, 15 * 60 * 1000), (req, res) => {
  const { name, password } = req.body || {};
  if (!checkCredentials(name, password)) return res.status(401).json({ detail: "Invalid credentials" });
  res.json({ access_token: signToken(name), token_type: "bearer" });
});

export default r;
