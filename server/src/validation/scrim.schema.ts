import { z } from 'zod';
import mongoose from 'mongoose';

export const createScrimSchema = z.object({
  datetime: z.string().datetime(),
  matchType: z.enum(['bo1','bo3','bo5']),
  minRank: z.enum(['bronze','silver','gold','platinum','diamond','master','grandmaster','challenger']),
  teamId: z.string().refine((v) => mongoose.isValidObjectId(v), 'teamId invalide'),
});
