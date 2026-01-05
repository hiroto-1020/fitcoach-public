// lib/id.ts
// 依存ナシの簡易ユニークIDジェネレーター
// 例: "m_ks9f3-14f1cab5e2a"
export function generateId(prefix = "m"): string {
  // ランダム部（36進数）＋ タイムスタンプ（16進数）
  const rand = Math.random().toString(36).slice(2, 8); // 6文字
  const ts = Date.now().toString(16);                  // 可変長
  return `${prefix}_${rand}-${ts}`;
}
