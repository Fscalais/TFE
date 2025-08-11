import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  createTeam,
  getTeamsForUser,
  getTeamById,
  inviteMember,
  getInvitationsForUser,
  acceptInvitation,
  declineInvitation,
  deleteTeam,
  leaveTeam,
  transferCreator,
} from '../controllers/team.controller';

const router = express.Router();

router.post('/', authenticate, createTeam);
router.get('/', authenticate, getTeamsForUser);
router.get('/invitations', authenticate, getInvitationsForUser);
router.get('/:id', authenticate, getTeamById);

router.post('/:id/invite', authenticate, inviteMember);

router.post('/:teamId/accept', authenticate, acceptInvitation);
router.post('/:teamId/decline', authenticate, declineInvitation);
router.post('/:id/leave', authenticate, leaveTeam);
router.post('/:id/transfer-creator', authenticate, transferCreator);

router.delete('/:id', authenticate, deleteTeam);

export default router;
