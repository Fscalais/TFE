import { Router } from 'express';
import * as scrimController from '../controllers/scrim.controller';
import { authenticate } from '../middleware/auth.middleware';

import { validateBody } from '../middleware/validate';
import { requireTeamMember } from '../middleware/authorization';
import { createScrimSchema } from '../validation/scrim.schema';

const router = Router();

router.get('/scrims', authenticate, scrimController.listScrims);

router.get('/scrims/my', authenticate, scrimController.getMyScrims);

router.post(
  '/scrims',
  authenticate,
  validateBody(createScrimSchema),
  requireTeamMember('teamId'),
  scrimController.createScrim
);

router.get('/scrims/:id', authenticate, scrimController.getScrimByIdForUser);

router.post('/scrims/:id/request', authenticate, scrimController.requestScrim);

router.post('/scrims/:id/respond', authenticate, scrimController.respondRequest);
router.get('/scrims/:id/requests', authenticate, scrimController.listRequestsForScrim);

router.get('/scrims/:id/discord', authenticate, scrimController.getDiscordInvite);

export default router;
