import { getProfile, updateProfile } from '../src/controllers/user.controller';
import User from '../src/models/user.model';

jest.mock('../src/models/user.model');

describe('User Controller', () => {
  const mockReq: any = {};
  const mockRes: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it("return profil quand l'utilisateur existe", async () => {
      const fakeUser = { _id: '123', username: 'testuser', email: 'test@test.com' };
      mockReq.userId = '123';
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(fakeUser),
      });

      await getProfile(mockReq, mockRes);

      expect(User.findById).toHaveBeenCalledWith('123');
      expect(mockRes.json).toHaveBeenCalledWith(fakeUser);
    });

    it('return 404 si utilisateur introuvable', async () => {
      mockReq.userId = '123';
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await getProfile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Utilisateur non trouvé' });
    });

    it("return 500 en cas d'erreur", async () => {
      mockReq.userId = '123';
      const error = new Error('DB error');
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockRejectedValue(error),
      });

      await getProfile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Erreur serveur', error });
    });
  });

  describe('updateProfile', () => {
    it('met à jour et return profil', async () => {
      mockReq.userId = '123';
      mockReq.body = {
        username: 'newname',
        riotSummonerName: 'summoner1',
        languages: ['fr', 'en'],
        location: 'Paris',
        games: ['LoL'],
        roles: ['mid'],
        age: 25,
        mood: 'happy',
        rank: 'Gold',
        bio: 'Hello!',
      };

      const updatedUser = { ...mockReq.body, _id: '123' };
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(updatedUser);

      await updateProfile(mockReq, mockRes);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        '123',
        mockReq.body,
        { new: true }
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(updatedUser);
    });

    it("return 500 en cas d'erreur", async () => {
      mockReq.userId = '123';
      mockReq.body = {};

      const error = new Error('DB update error');
      (User.findByIdAndUpdate as jest.Mock).mockRejectedValue(error);

      await updateProfile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Erreur serveur', error });
    });
  });
});
