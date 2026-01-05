export const nz = (v: any, d = 0) =>
  typeof v === "number" && isFinite(v) ? v : (typeof v === "string" && isFinite(Number(v)) ? Number(v) : d);

export const safe1 = (v: any) => {
  const n = nz(v, NaN);
  return isFinite(n) ? Math.round(n * 10) / 10 : undefined;
};

export const safeDateKey = (s: any): string | null => {
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return null;
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, "0");
    const day = `${d.getDate()}`.padStart(2, "0");
    return `${y}-${m}-${day}`;
  } catch { return null; }
};

export const compact = <T,>(arr?: T[]) => (Array.isArray(arr) ? arr.filter(Boolean) : []);
