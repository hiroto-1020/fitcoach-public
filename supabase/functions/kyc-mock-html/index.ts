// supabase/functions/kyc-mock-html/index.ts
// HTML を「絶対に」text/html で返す v5（Blob + ヘッダ強制 + nosniff + HEAD 対応）

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, HEAD",
};

Deno.serve(async (req) => {
  const { method } = req;

  // CORS preflight/HEAD
  if (method === "OPTIONS" || method === "HEAD") {
    return new Response(null, { headers: { ...corsHeaders } });
  }

  if (method !== "GET") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
        ...corsHeaders,
      },
    });
  }

  const url = new URL(req.url);
  const sid = url.searchParams.get("sid") ?? "sess_demo";
  const provider = url.searchParams.get("provider") ?? "persona";
  const projectRef = url.hostname.split(".")[0];
  const webhookUrl = `https://${projectRef}.functions.supabase.co/functions/v1/kyc-webhook`;

  const html = `<!doctype html>
<html lang="ja"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>本人確認（モック）</title>
<style>
  body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; padding:24px; background:#fafafa; }
  .box { max-width:520px; margin:0 auto; border:1px solid #e5e7eb; border-radius:12px; padding:16px; background:#fff; }
  button { padding:10px 14px; border-radius:8px; border:1px solid #e5e7eb; margin-right:8px; cursor:pointer; }
  .ok { background:#16a34a; color:#fff; border-color:#16a34a; }
  .ng { background:#ef4444; color:#fff; border-color:#ef4444; }
  .muted { color:#64748b; }
  .m { margin-top:12px }
  code { background:#f3f4f6; padding:2px 6px; border-radius:6px; }
</style>
</head><body>
  <div class="box">
    <h2>本人確認（モック）</h2>
    <p class="muted">Session: <code>${sid}</code> / Provider: <code>${provider}</code></p>
    <p class="m">下のボタンで結果を送信できます。</p>
    <div class="m">
      <button class="ok" onclick="send('approved')">承認（approved）</button>
      <button class="ng" onclick="send('rejected')">拒否（rejected）</button>
      <button onclick="send('failed')">失敗（failed）</button>
      <button onclick="send('pending')">保留（pending）</button>
    </div>
    <p id="status" class="m muted">未送信</p>
    <p class="m">送信後はアプリに戻ってください（アプリ側が自動で状態を反映します）。</p>
  </div>
<script>
  async function send(status) {
    try {
      const res = await fetch('${webhookUrl}', {
        method:'POST',
        headers:{'content-type':'application/json'},
        body: JSON.stringify({
          provider: '${provider}',
          session_id: '${sid}',
          person_id: 'p_demo_' + '${sid}'.slice(-6),
          status
        })
      });
      document.getElementById('status').textContent =
        (res.ok ? '送信しました: ' : '送信失敗: ') + status + ' (' + res.status + ')';
    } catch (e) {
      document.getElementById('status').textContent = '送信エラー: ' + (e?.message || e);
    }
  }
</script>
</body></html>`;

  // 本文は Blob/Uint8Array にして返却（ヘッダも二重に指定）
  const blob = new Blob([html], { type: "text/html; charset=utf-8" });
  const headers = new Headers({
    "Content-Type": "text/html; charset=utf-8",
    "Content-Disposition": "inline",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "no-store",
    "Vary": "Accept-Encoding",
    "X-Debug": "kyc-mock-html-v5",
    ...corsHeaders,
  });

  return new Response(blob, { status: 200, headers });
});
