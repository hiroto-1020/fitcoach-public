// supabase/functions/kyc-mock/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve((req) => {
  const url = new URL(req.url);
  const sid = url.searchParams.get("sid") ?? "sess_demo";
  const provider = url.searchParams.get("provider") ?? "persona";
  const projectRef = url.hostname.split(".")[0];
  const webhookUrl = `https://${projectRef}.functions.supabase.co/functions/v1/kyc-webhook`;

  const html = `<!DOCTYPE html>
<html lang="ja"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>KYCモック v2</title>
<style>
body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:24px}
.box{max-width:520px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;padding:16px}
button{padding:10px 14px;border-radius:8px;border:1px solid #e5e7eb;margin-right:8px;cursor:pointer}
.ok{background:#16a34a;color:#fff;border-color:#16a34a}
.ng{background:#ef4444;color:#fff;border-color:#ef4444}
.muted{color:#64748b}.m{margin-top:12px}
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
async function send(status){
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
    (res.ok ? '送信しました: ' : '送信失敗: ') + status;
}
</script>
</body></html>`;

  //  文字列ではなく Response で返す（）
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
});
