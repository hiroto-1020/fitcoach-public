import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import type { Gender } from './types';

export function useMyGender() {
  const [gender, setGender] = useState<Gender>('unknown');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id ?? null;
      setUserId(uid);

      if (uid) {
        const { data: prof } = await supabase
          .from('user_profiles')
          .select('gender')
          .eq('id', uid)
          .maybeSingle();
        const g = prof?.gender;
        setGender(g === 'male' || g === 'female' ? g : 'unknown');
      }
    })();
  }, []);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel('me-gender-watch')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_profiles',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          const g = payload.new?.gender;
          setGender(g === 'male' || g === 'female' ? g : 'unknown');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return gender;
}
