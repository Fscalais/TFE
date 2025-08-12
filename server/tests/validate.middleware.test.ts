import { z } from 'zod';
import { validateBody } from '../src/middleware/validate';

const mockRes = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });

test('validateBody -> 400 si invalide', () => {
  const schema = z.object({ email: z.string().email() });
  const req: any = { body: { email: 'bad' } };
  const res = mockRes(); const next = jest.fn();
  validateBody(schema)(req as any, res as any, next);
  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ errors: expect.any(Array) }));
});
