import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

type Status = {
  freeRemaining: number;
  paidRemaining: number;
  totalRemaining: number;
};

export function useLikeStatus() {
  const [status, setStatus] = useState<Status | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [outOfLikes, setOutOfLikes] = useState(false);
  const tickRef = useRef<NodeJS.Timeout | null>(null);

  const parseRow = (row: any): Status => ({
    freeRemaining: Number(row?.free_remaining ?? 0),
    paidRemaining: Number(row?.paid_remaining ?? 0),
    totalRemaining: Number(row?.total_remaining ?? 0),
  });

  const calcMsUntil = (iso: string | null | undefined) => {
    if (!iso) return null;
    const t = new Date(iso).getTime();
    return Math.max(0, t - Date.now());
  };

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_like_status');
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      const s = parseRow(row);
      setStatus(s);
      setTimeLeft(calcMsUntil(row?.reset_at));
    } finally {
      setLoading(false);
    }
  }, []);

    const consumeOne = useCallback(async () => {
      const { data, error } = await supabase.rpc('consume_like');
      if (error) {
        await reload();
        return false;
      }

      const row = Array.isArray(data) ? data[0] : data;
      const consumed = Boolean(row?.consumed);

      setStatus({
        freeRemaining: Number(row?.free_remaining ?? 0),
        paidRemaining: Number(row?.paid_remaining ?? 0),
        totalRemaining: Number(row?.total_remaining ?? 0),
      });
      setTimeLeft(row?.reset_at ? Math.max(0, new Date(row.reset_at).getTime() - Date.now()) : null);

      if (!consumed) return false;

      return true;
    }, [reload]);


  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      setTimeLeft((prev) => (prev == null ? prev : Math.max(0, prev - 1000)));
    }, 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, []);

  useEffect(() => { reload(); }, [reload]);

  return useMemo(() => ({
    status,
    loading,
    timeLeft,
    outOfLikes,
    setOutOfLikes,
    reload,
    consumeOne,
  }), [status, loading, timeLeft, outOfLikes, reload, consumeOne]);
}
