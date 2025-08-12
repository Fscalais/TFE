import * as scrimCtrl from '../src/controllers/scrim.controller';
import Scrim from '../src/models/scrim.model';
import Team from '../src/models/team.model';
import axios from 'axios';

jest.mock('../src/models/scrim.model');
jest.mock('../src/models/team.model');
jest.mock('axios');

const mockRes = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });

describe('Scrim Controller', () => {
  let req: any, res: any;
  beforeEach(() => { jest.clearAllMocks(); req = {}; res = mockRes(); });

  test('respondRequest -> accepte, set teamB + confirme + invite discord', async () => {
    req.userId = 'host1';
    req.params = { id: 'scrim1' };
    req.body = { requestId: 'req1', action: 'accept' };

    (Team.findOne as jest.Mock).mockResolvedValue({ _id: 'teamA', members: ['host1'] });

    const reqDoc = { _id: 'req1', status: 'pending', teamId: 'teamB' };
    const scrim = {
      _id: 'scrim1',
      teamA: { toString: () => 'teamA' },
      status: 'open',
      requests: { id: (x: string) => (x === 'req1' ? reqDoc : null) },
      save: jest.fn().mockResolvedValue(true),
    };
    (Scrim.findById as jest.Mock).mockResolvedValue(scrim);
    (axios.post as jest.Mock).mockResolvedValue({ data: { inviteUrl: 'https://discord.gg/xxx' } });

    await scrimCtrl.respondRequest(req, res);

    expect(res.json).toHaveBeenCalledWith({ message: 'Demande acceptée' });
    expect(reqDoc.status).toBe('accepted');
    expect(scrim.status).toBe('confirmed');
  });
});
