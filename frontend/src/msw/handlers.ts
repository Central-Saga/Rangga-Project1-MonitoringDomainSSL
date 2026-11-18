import { setupServer } from 'msw/node/server';
import { rest } from 'msw';

// Mock asset API endpoints
export const handlers = [
  rest.get('*/api/assets', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        data: [
          {
            id: 1,
            name: 'Domain Contoh',
            type: 'domain',
            status: 'active',
            days_until_expiry: 30,
            renewal_cost: '100000',
          },
        ],
        meta: { current_page: 1, last_page: 1, total: 1, per_page: 15 },
      })
    );
  }),

  rest.post('*/api/assets', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        data: {
          id: 1,
          name: 'Domain Baru',
          type: 'domain',
          status: 'active',
        },
      })
    );
  }),

  rest.get('*/api/assets/*', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        data: {
          id: Number(req.params.id),
          name: 'Asset Detail',
          type: 'domain',
        },
      })
    );
  }),

  rest.put('*/api/assets/*', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        data: {
          id: Number(req.params.id),
          name: 'Asset Diperbarui',
        },
      })
    );
  }),

  rest.delete('*/api/assets/*', (req, res, ctx) => {
    return res(
      ctx.status(204),
      ctx.json({}),
    );
  }),

  // Auth endpoints
  rest.post('*/api/auth/login', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        token: 'mock-token',
        user: { id: 1, name: 'Test User', email: 'test@example.com' },
      })
    );
  }),

  rest.post('*/api/auth/register', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        token: 'mock-register-token',
        user: { id: 2, name: 'New User', email: 'new@example.com' },
      })
    );
  }),
];