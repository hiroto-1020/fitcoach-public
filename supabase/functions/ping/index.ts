// supabase/functions/ping/index.ts
export default async (_req: Request) =>
  new Response(JSON.stringify({ pong: true, t: Date.now() }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
