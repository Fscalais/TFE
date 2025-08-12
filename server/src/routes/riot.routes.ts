import express from 'express';
import { fetchRiotData , fetchChampionMastery, getCachedDDragonVersion } from '../controllers/riot.controller';

const router = express.Router();

router.get('/data/:riotId', fetchRiotData);
router.get('/mastery/:puuid', fetchChampionMastery);
router.get('/ddragon/version', getCachedDDragonVersion);

export default router;
