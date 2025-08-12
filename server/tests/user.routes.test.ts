import express from 'express';
import request from 'supertest';

jest.mock('../src/middleware/auth.middleware', () => ({
  authenticate: (_req: any, _res: any, next: any) => { _req.userId = 'u1'; next(); },
}));

jest.mock('../src/models/user.model');
import User from '../src/models/user.model';
import userRouter from '../src/routes/user.routes';

const app = express();
app.use(express.json());
app.use('/api/users', userRouter);

describe('User Routes', () => {
  beforeEach(() => jest.clearAllMocks());

  test('GET /api/users/me -> 200', async () => {
    (User.findById as jest.Mock).mockReturnValue({ select: jest.fn().mockResolvedValue({ _id: 'u1', username: 'A' }) });
    const res = await request(app).get('/api/users/me');
    expect(res.status).toBe(200);
    expect(res.body.username).toBe('A');
  });

  test('PUT /api/users/me -> 200', async () => {
    (User.findByIdAndUpdate as jest.Mock).mockResolvedValue({ _id: 'u1', username: 'B' });
    const res = await request(app).put('/api/users/me').send({ username: 'B' });
    expect(res.status).toBe(200);
    expect(res.body.username).toBe('B');
  });

  test('GET /api/users/by-username/:username -> 200', async () => {
    (User.findOne as jest.Mock).mockReturnValue({ select: jest.fn().mockResolvedValue({ username: 'Zed' }) });
    const res = await request(app).get('/api/users/by-username/Zed');
    expect(res.status).toBe(200);
    expect(res.body.username).toBe('Zed');
  });

  test('GET /api/users/:id -> 404 si inconnu', async () => {
    (User.findById as jest.Mock).mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
    const res = await request(app).get('/api/users/doesnotexist');
    expect(res.status).toBe(404);
  });
});
