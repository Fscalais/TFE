import { authenticate } from '../src/middleware/auth.middleware';
import jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');

describe('authenticate middleware', () => {
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('return 401 si pas Authorization header', () => {
    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Accès non autorisé' });
    expect(next).not.toHaveBeenCalled();
  });

  it('return 401 si Authorization header commence pas par Bearer', () => {
    req.headers.authorization = 'Basic token';
    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Accès non autorisé' });
    expect(next).not.toHaveBeenCalled();
  });

  it('return 401 si token pas valide', () => {
    req.headers.authorization = 'Bearer invalidtoken';
    (jwt.verify as jest.Mock).mockImplementation(() => { throw new Error('invalid'); });

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token invalide' });
    expect(next).not.toHaveBeenCalled();
  });

  it('next et défini req.userId si token valide', () => {
    req.headers.authorization = 'Bearer validtoken';
    (jwt.verify as jest.Mock).mockReturnValue({ id: 'user123' });

    authenticate(req, res, next);

    expect(req.userId).toBe('user123');
    expect(next).toHaveBeenCalled();
  });
});
