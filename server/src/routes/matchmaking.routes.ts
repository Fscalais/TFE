import { Router, Request, Response } from "express";
import { addPlayerToQueue, getWaitingPlayers } from "../services/matchmaking.service";

const router = Router();

// POST /matchmaking/search
router.post("/search", (req: Request, res: Response) => {
  const { userId, languages, roles, moods } = req.body;
  if (!userId || !Array.isArray(languages) || languages.length === 0 ||
      !Array.isArray(roles) || roles.length === 0 || roles.length > 2 ||
      !Array.isArray(moods) || moods.length === 0) {
    return res.status(400).json({ error: "Champs invalides" });
  }
  addPlayerToQueue({ userId, languages, roles, moods });
  return res.json({ message: "Recherche lancée" });
});

// GET /matchmaking/waiting (pour debug / voir qui attend)
router.get("/waiting", (req: Request, res: Response) => {
  return res.json(getWaitingPlayers());
});

export default router;
