import type { Context } from '@netlify/functions';
import { buildResponse } from './word-logic';

// Netlify Functions v2 handler
export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  const rawQuery = url.search.replace('?', '');
  const version = '0.14.11';

  return new Response(JSON.stringify(buildResponse(rawQuery, version)), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
