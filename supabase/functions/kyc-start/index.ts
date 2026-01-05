// supabase/functions/kyc-start/index.ts
// セッションIDを払い出し、モック画面 (kyc-mock-html) の URL を返す

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function uuid() {
  return crypto.randomUUID();
}

Deno.serve(async (req) => {
  // CORS (preflight)
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const url = new URL(req.url);
  const body = await req.json().catch(() => ({} as any));
  const provider = body?.provider ?? "persona";

  const sid = `sess_${uuid()}`;
  const projectRef = url.hostname.split(".")[0];

  // /functions/v1 を明示し、HTML モックへ誘導
  const start_url =
    `https://${projectRef}.functions.supabase.co/functions/v1/kyc-mock-html?` +
    `sid=${encodeURIComponent(sid)}&provider=${encodeURIComponent(provider)}`;

  return new Response(
    JSON.stringify({ provider, session_id: sid, start_url }),
    {
      headers: {
        "Content-Type": "application/json",
        "X-Debug": "kyc-start-v3",
        ...corsHeaders,
      },
    }
  );
});
