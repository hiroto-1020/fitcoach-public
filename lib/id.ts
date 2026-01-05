export function generateId(prefix = "m"): string {
  const rand = Math.random().toString(36).slice(2, 8);
  const ts = Date.now().toString(16);
  return `${prefix}_${rand}-${ts}`;
}
