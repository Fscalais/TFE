import * as teamCtrl from '../src/controllers/team.controller';
import Team from '../src/models/team.model';
import User from '../src/models/user.model';

jest.mock('../src/models/team.model');
jest.mock('../src/models/user.model');

const mockRes = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });

describe('Team Controller', () => {
  let req: any, res: any;
  beforeEach(() => { jest.clearAllMocks(); req = {}; res = mockRes(); });

  test('createTeam -> 401 si non authentifié', async () => {
    req.body = { name: 'TeamX', description: '' };
    await teamCtrl.createTeam(req as any, res as any);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('createTeam -> 400 si nom pris', async () => {
    req.userId = 'u1';
    req.body = { name: 'TeamX', description: '' };
    (Team.findOne as jest.Mock).mockResolvedValue({ _id: 't1' });
    await teamCtrl.createTeam(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Nom d’équipe déjà pris' });
  });

  test('deleteTeam -> seul créateur unique membre peut supprimer', async () => {
    req.userId = 'u1'; req.params = { id: 't1' };
    (Team.findById as jest.Mock).mockResolvedValue({
      _id: 't1',
      creator: { toString: () => 'u1' },
      members: [{ toString: () => 'u1' }],
    });
    (Team.findByIdAndDelete as jest.Mock).mockResolvedValue({});
    await teamCtrl.deleteTeam(req, res);
    expect(res.json).toHaveBeenCalledWith({ message: 'Équipe supprimée' });
  });

  test('inviteMember -> 404 si utilisateur inconnu', async () => {
    req.params = { id: 't1' };
    req.body = { username: 'bob' };
    (User.findOne as jest.Mock).mockResolvedValue(null);
    await teamCtrl.inviteMember(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
