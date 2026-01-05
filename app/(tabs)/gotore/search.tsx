import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View } from 'react-native';
import { supabase } from '../../../lib/supabase';
import { useMyGender } from '../../../lib/gotore/useMyGender';
import type { MatchTarget } from '../../../lib/gotore/types';
import MatchTargetSelector from '../../../ui/MatchTargetSelector';

export default function SearchScreen() {
  const myGender = useMyGender();
  const [matchTarget, setMatchTarget] = useState<MatchTarget>('any');
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (myGender === 'unknown' && matchTarget === 'same_gender') {
      setMatchTarget('any');
    }
  }, [myGender, matchTarget]);

  const fetchCandidates = useCallback(async () => {
    const { data: me } = await supabase.auth.getUser();
    const myId = me.user?.id;

    let q = supabase
      .from('gotore_profiles')
      .select('id, nickname, gender, first_photo_url, ...')
      .neq('user_id', myId)

    if (matchTarget === 'same_gender') {
      if (myGender === 'male' || myGender === 'female') {
        q = q.eq('gender', myGender);
      } else {
        q = q; 
      }
    }
    const { data, error } = await q.limit(100);
    if (!error) setItems(data ?? []);
  }, [matchTarget, myGender]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  return (
    <View style={{ padding: 16, gap: 16 }}>
      <MatchTargetSelector
        myGender={myGender}
        value={matchTarget}
        onChange={setMatchTarget}
      />
    </View>
  );
}
