import { http, HttpResponse } from 'msw';

// Mock asset API endpoints (MSW v2)
export const handlers = [
  http.get('*/api/assets', () => {
    return HttpResponse.json({
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
    });
  }),

  http.post('*/api/assets', () => {
    return HttpResponse.json(
      {
        data: {
          id: 1,
          name: 'Domain Baru',
          type: 'domain',
          status: 'active',
        },
      },
      { status: 201 }
    );
  }),

  http.get('*/api/assets/:id', ({ params }) => {
    return HttpResponse.json({
      data: {
        id: Number(params.id),
        name: 'Asset Detail',
        type: 'domain',
      },
    });
  }),

  http.put('*/api/assets/:id', ({ params }) => {
    return HttpResponse.json({
      data: {
        id: Number(params.id),
        name: 'Asset Diperbarui',
      },
    });
  }),

  http.delete('*/api/assets/:id', () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Auth endpoints
  http.post('*/api/auth/login', () => {
    return HttpResponse.json({
      user: { id: 1, name: 'Test User', email: 'test@example.com' },
    });
  }),

  http.post('*/api/auth/register', () => {
    return HttpResponse.json(
      {
        user: { id: 2, name: 'New User', email: 'new@example.com' },
      },
      { status: 201 }
    );
  }),
];
