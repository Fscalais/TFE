import express, { Express } from 'express';
import request from 'supertest';
import authRouter from '../src/routes/auth.routes';

// Mock mongoose model User et bcrypt + jwt
jest.mock('../src/models/user.model');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

import User from '../src/models/user.model';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

const app: Express = express();
app.use(express.json());
app.use('/api/auth', authRouter);

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should return 400 if missing fields', async () => {
      const res = await request(app).post('/api/auth/register').send({});
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Tous les champs sont obligatoires');
    });

    it('should return 400 if email already used', async () => {
      (User.findOne as jest.Mock).mockResolvedValueOnce({}); // email exists
      const res = await request(app).post('/api/auth/register').send({
        username: 'user1',
        email: 'test@test.com',
        password: 'password123',
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Email déjà utilisé');
    });

    it('should create user successfully', async () => {
      (User.findOne as jest.Mock).mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
      (User.create as jest.Mock).mockResolvedValue({ _id: 'user123' });

      const res = await request(app).post('/api/auth/register').send({
        username: 'user1',
        email: 'test@test.com',
        password: 'password123',
      });
      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Utilisateur créé');
      expect(res.body.userId).toBe('user123');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return 400 if invalid email/password format', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'invalid-email',
        password: 'short',
      });
      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it('should return 401 if user not found', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const res = await request(app).post('/api/auth/login').send({
        email: 'test@test.com',
        password: 'password123',
      });
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Identifiants incorrects');
    });

    it('should return 401 if password incorrect', async () => {
      (User.findOne as jest.Mock).mockResolvedValue({ password: 'hashed' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const res = await request(app).post('/api/auth/login').send({
        email: 'test@test.com',
        password: 'password123',
      });
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Identifiants incorrects');
    });

    it('should login successfully and return token', async () => {
      (User.findOne as jest.Mock).mockResolvedValue({ _id: 'user123', username: 'user1', email: 'test@test.com', password: 'hashed' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('fake-jwt-token');

      const res = await request(app).post('/api/auth/login').send({
        email: 'test@test.com',
        password: 'password123',
      });
      expect(res.status).toBe(200);
      expect(res.body.token).toBe('fake-jwt-token');
      expect(res.body.user).toMatchObject({
        id: 'user123',
        username: 'user1',
        email: 'test@test.com',
      });
    });
  });
});
