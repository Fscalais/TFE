import express from 'express';
import { fetchRiotData , fetchChampionMastery } from '../controllers/riot.controller';

const router = express.Router();

router.get('/data/:riotId', fetchRiotData);
router.get('/mastery/:puuid', fetchChampionMastery);

export default router;
