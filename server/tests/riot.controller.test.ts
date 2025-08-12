import axios from 'axios';
import { makeReq, makeRes } from './utils/mockExpress';

jest.mock('axios');

describe('Riot Controller', () => {
  let riotCtrl: typeof import('../src/controllers/riot.controller');

  beforeAll(async () => {
    process.env.RIOT_API_KEY = 'test-key';
    jest.resetModules();
    riotCtrl = await import('../src/controllers/riot.controller');
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  beforeEach(() => jest.clearAllMocks());

  test('fetchRiotData -> 400 si format RiotID invalide', async () => {
    const req = makeReq({ params: { riotId: 'BadFormat' } });
    const res = makeRes();
    await riotCtrl.fetchRiotData(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('fetchRiotData -> mappe lastMatches', async () => {
    const req = makeReq({ params: { riotId: 'Name#EUW' } });
    const res = makeRes();

    (axios.get as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/riot/account/v1/accounts/by-riot-id/')) {
        return Promise.resolve({ data: { puuid: 'p1', gameName: 'Name', tagLine: 'EUW' } });
      }
      if (url.includes('/lol/summoner/v4/summoners/by-puuid/')) {
        return Promise.resolve({ data: { id: 's1', summonerLevel: 42 } });
      }
      if (url.includes('/lol/league/v4/challengerleagues')) {
        return Promise.resolve({ data: { entries: [] } });
      }
      if (url.includes('/lol/match/v5/matches/by-puuid/')) {
        return Promise.resolve({ data: ['M1'] });
      }
      if (url.includes('/lol/match/v5/matches/M1')) {
        return Promise.resolve({
          data: {
            info: {
              gameDuration: 1800,
              gameMode: 'CLASSIC',
              participants: [{
                puuid: 'p1',
                championName: 'Ahri',
                kills: 5, deaths: 2, assists: 7,
                totalMinionsKilled: 150, neutralMinionsKilled: 10,
                win: true, teamPosition: 'MIDDLE',
                goldEarned: 12000, totalDamageDealtToChampions: 18000, visionScore: 20,
              }],
            },
          },
        });
      }
      throw new Error('unexpected url ' + url);
    });

    await riotCtrl.fetchRiotData(req, res);

    const payload = (res.json as unknown as jest.Mock).mock.calls[0][0];
    expect(payload.level).toBe(42);
    expect(payload.lastMatches[0].championName).toBe('Ahri');
    expect(payload.lastMatches[0].durationMin).toBe(30);
  });
});


