import { Router, Request, Response } from "express";
import { addPlayerToQueue, getWaitingPlayers } from "../services/matchmaking.service";

const router = Router();

// POST /matchmaking/search
router.post("/search", (req: Request, res: Response) => {
  const { userId, language, role, mood } = req.body;

  if (!userId || !language || !role || !mood) {
    return res.status(400).json({ error: "Champs manquants" });
  }

  addPlayerToQueue({ userId, language, role, mood });

  return res.json({ message: "Recherche lancée" });
});

// GET /matchmaking/waiting (pour debug / voir qui attend)
router.get("/waiting", (req: Request, res: Response) => {
  return res.json(getWaitingPlayers());
});

export default router;
