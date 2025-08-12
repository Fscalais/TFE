import express from 'express';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import axios from 'axios';

jest.mock('axios');
const axiosPost = axios.post as unknown as jest.Mock;

describe('E2E Happy Path', () => {
  let mongod: MongoMemoryServer;
  let app: express.Express;

  jest.setTimeout(120_000);

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.DISCORD_BOT_URL = 'http://mock-discord';

    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    const { default: authRoutes }  = await import('../src/routes/auth.routes');
    const { default: userRoutes }  = await import('../src/routes/user.routes');
    const { default: teamRoutes }  = await import('../src/routes/team.routes');
    const { default: scrimRoutes } = await import('../src/routes/scrim.routes');

    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/teams', teamRoutes);
    app.use('/api', scrimRoutes);

    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(async () => {
    await mongoose.connection.db?.dropDatabase();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  it('enchaine: register -> login -> /me -> team -> invite -> accept -> scrim -> request -> respond -> discord', async () => {
    const resRegA = await request(app).post('/api/auth/register').send({
      username: 'Alice', email: 'alice@gmail.com', password: 'password123',
    });
    expect(resRegA.status).toBe(201);

    const resRegB = await request(app).post('/api/auth/register').send({
      username: 'Bob', email: 'bob@gmail.com', password: 'password123',
    });
    expect(resRegB.status).toBe(201);

    const resLoginA = await request(app).post('/api/auth/login').send({
      email: 'alice@gmail.com', password: 'password123',
    });
    expect(resLoginA.status).toBe(200);
    const tokenA = resLoginA.body.token;

    const resLoginB = await request(app).post('/api/auth/login').send({
      email: 'bob@gmail.com', password: 'password123',
    });
    expect(resLoginB.status).toBe(200);
    const tokenB = resLoginB.body.token;

    const resMe = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${tokenA}`);
    expect(resMe.status).toBe(200);
    expect(resMe.body.username).toBe('Alice');

    const resCreateTeam = await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'TeamX', description: 'La team X' });
    expect(resCreateTeam.status).toBe(201);
    const team = resCreateTeam.body;

    const resInvite = await request(app)
      .post(`/api/teams/${team._id}/invite`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ username: 'Bob' });
    expect(resInvite.status).toBe(200);

    const resInvitations = await request(app)
      .get('/api/teams/invitations')
      .set('Authorization', `Bearer ${tokenB}`);
    expect(resInvitations.status).toBe(200);
    const invitedTeamId = resInvitations.body[0]._id;

    const resAccept = await request(app)
      .post(`/api/teams/${invitedTeamId}/accept`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(resAccept.status).toBe(200);

    const nowPlus1h = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const resCreateScrim = await request(app)
      .post('/api/scrims')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ datetime: nowPlus1h, matchType: 'bo1', minRank: 'gold', teamId: team._id });
    expect(resCreateScrim.status).toBe(201);
    const scrim = resCreateScrim.body;

    const resRequest = await request(app)
      .post(`/api/scrims/${scrim._id}/request`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(resRequest.status).toBe(200);

    const resListReq = await request(app)
      .get(`/api/scrims/${scrim._id}/requests`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(resListReq.status).toBe(200);
    const requestId = resListReq.body[0]._id;

    axiosPost.mockResolvedValueOnce({ data: { inviteUrl: 'https://discord.gg/fake' } });

    const resRespond = await request(app)
      .post(`/api/scrims/${scrim._id}/respond`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ requestId, action: 'accept' });
    expect(resRespond.status).toBe(200);

    const resDiscord = await request(app)
      .get(`/api/scrims/${scrim._id}/discord`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(resDiscord.status).toBe(200);
    expect(resDiscord.body.discordInvite).toBe('https://discord.gg/fake');
  });
});

