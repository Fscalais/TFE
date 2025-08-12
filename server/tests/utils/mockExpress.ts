import type { Request, Response, NextFunction } from 'express';

export const makeRes = (): Response => {
  const res = {} as Response;
  (res.status as any) = jest.fn().mockReturnValue(res);
  (res.json as any) = jest.fn().mockReturnValue(res);
  (res.send as any) = jest.fn().mockReturnValue(res);
  return res;
};

export const makeReq = (overrides: Partial<Request> = {}): Request => {
  return {
    headers: {},
    params: {},
    query: {},
    body: {},
    ...overrides,
  } as unknown as Request;
};

export const makeNext = (): NextFunction => jest.fn() as unknown as NextFunction;
