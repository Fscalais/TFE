import { Router } from 'express';
import * as scrimController from '../controllers/scrim.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/scrims', authenticate, scrimController.createScrim);
router.get('/scrims', scrimController.listScrims);
router.post('/scrims/:id/request', authenticate, scrimController.requestScrim);
router.post('/scrims/:id/respond', authenticate, scrimController.respondRequest);
router.get('/scrims/my', authenticate, scrimController.getMyScrims);
router.get('/scrims/:id/requests', authenticate, scrimController.listRequestsForScrim);

export default router;
