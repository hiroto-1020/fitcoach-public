// supabase/functions/healthz/index.ts
export default async (_req: Request) => new Response(null, { status: 204 });
