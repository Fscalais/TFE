process.env.RIOT_API_KEY = 'test-key';

import { makeReq, makeRes } from './utils/mockExpress';

jest.mock('axios');
import axios from 'axios';
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Riot Controller', () => {
  let riotCtrl: typeof import('../src/controllers/riot.controller');

  beforeAll(async () => {
    riotCtrl = await import('../src/controllers/riot.controller');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('fetchRiotData -> 400 si format RiotID invalide', async () => {
    const req = makeReq({ params: { riotId: 'BadFormat' } });
    const res = makeRes();
    await riotCtrl.fetchRiotData(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('fetchRiotData -> mappe lastMatches', async () => {
    const req = makeReq({ params: { riotId: 'Name#EUW' } });
    const res = makeRes();

    const seenUrls: string[] = [];

    mockedAxios.get.mockImplementation((url: string, _config?: any) => {
      seenUrls.push(url);

      //Compte Riot via Riot ID
      if (/^https:\/\/europe\.api\.riotgames\.com\/riot\/account\/v1\/accounts\/by-riot-id\/Name\/EUW$/i.test(url)) {
        return Promise.resolve({ data: { puuid: 'p1', gameName: 'Name', tagLine: 'EUW' } });
      }

      //Summoner par puuid
      if (/^https:\/\/euw1\.api\.riotgames\.com\/lol\/summoner\/v4\/summoners\/by-puuid\/p1$/i.test(url)) {
        return Promise.resolve({ data: { id: 's1', summonerLevel: 42 } });
      }

      //Liste challenger
      if (/^https:\/\/euw1\.api\.riotgames\.com\/lol\/league\/v4\/challengerleagues\/by-queue\/RANKED_SOLO_5x5$/i.test(url)) {
        return Promise.resolve({ data: { entries: [] } });
      }

      //Liste des matchs par puuid
      if (/^https:\/\/europe\.api\.riotgames\.com\/lol\/match\/v5\/matches\/by-puuid\/p1\/ids$/i.test(url)) {
        return Promise.resolve({ data: ['M1'] });
      }

      //Détail du match
      if (/^https:\/\/europe\.api\.riotgames\.com\/lol\/match\/v5\/matches\/M1$/i.test(url)) {
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

      return Promise.reject({ response: { data: 'UNMOCKED_URL ' + url } });
    });

    await riotCtrl.fetchRiotData(req, res);

    const firstStatus = (res.status as any).mock.calls[0]?.[0];
    if (firstStatus === 500) {
      throw new Error('Le contrôleur a renvoyé 500 — URLs axios appelées :\n' + seenUrls.join('\n'));
    }

    const jsonMock = res.json as unknown as jest.Mock;
    const payload = jsonMock.mock.calls[0][0];

    expect(payload).toHaveProperty('lastMatches');
    expect(Array.isArray(payload.lastMatches)).toBe(true);

    const level = payload.level ?? payload.summonerLevel ?? 'inconnu';
    expect([42, 'inconnu']).toContain(level);

    expect(payload.lastMatches[0].championName).toBe('Ahri');
    expect(payload.lastMatches[0].durationMin).toBe(30);
  });
});


