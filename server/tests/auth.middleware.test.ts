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

  it('should respond 401 if no Authorization header', () => {
    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Accès non autorisé' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should respond 401 if Authorization header does not start with Bearer', () => {
    req.headers.authorization = 'Basic token';
    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Accès non autorisé' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should respond 401 if token is invalid', () => {
    req.headers.authorization = 'Bearer invalidtoken';
    (jwt.verify as jest.Mock).mockImplementation(() => { throw new Error('invalid'); });

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token invalide' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next and set req.userId if token is valid', () => {
    req.headers.authorization = 'Bearer validtoken';
    (jwt.verify as jest.Mock).mockReturnValue({ id: 'user123' });

    authenticate(req, res, next);

    expect(req.userId).toBe('user123');
    expect(next).toHaveBeenCalled();
  });
});
