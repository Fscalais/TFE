import axios from 'axios';
import { makeReq, makeRes } from './utils/mockExpress';

jest.mock('axios');

describe('Riot Controller', () => {
  let riotCtrl: typeof import('../src/controllers/riot.controller');

  beforeAll(async () => {
    process.env.RIOT_API_KEY = 'test-key';
    jest.resetModules();
    riotCtrl = await import('../src/controllers/riot.controller');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('fetchRiotData -> 400 si format RiotID invalide', async () => {
    const req = makeReq({ params: { riotId: 'BadFormat' } });
    const res = makeRes();

    await riotCtrl.fetchRiotData(req, res);

    expect((res.status as any)).toHaveBeenCalledWith(400);
  });

  test('fetchRiotData -> mappe lastMatches', async () => {
    const req = makeReq({ params: { riotId: 'Name#EUW' } });
    const res = makeRes();

    (axios.get as jest.Mock)
      .mockResolvedValueOnce({ data: { puuid: 'p1', gameName: 'Name', tagLine: 'EUW' } })
      .mockResolvedValueOnce({ data: { id: 's1', summonerLevel: 42 } })
      .mockResolvedValueOnce({ data: { entries: [] } })
      .mockResolvedValueOnce({ data: ['M1'] })
      .mockResolvedValueOnce({
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

    await riotCtrl.fetchRiotData(req, res);

    const jsonMock = res.json as unknown as jest.Mock;
    expect(jsonMock).toHaveBeenCalled();

    const payload = jsonMock.mock.calls[0][0];
    expect(payload.level).toBe(42);
    expect(payload.lastMatches[0].championName).toBe('Ahri');
    expect(payload.lastMatches[0].durationMin).toBe(30);
  });
});
