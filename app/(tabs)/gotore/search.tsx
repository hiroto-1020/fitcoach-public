// app/(tabs)/gotore/search.tsx（例）
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View } from 'react-native';
import { supabase } from '../../../lib/supabase';
import { useMyGender } from '../../../lib/gotore/useMyGender';
import type { MatchTarget } from '../../../lib/gotore/types';
import MatchTargetSelector from '../../../ui/MatchTargetSelector';
// 既存: useAppPrefs があればそれで保存/復元してOK

export default function SearchScreen() {
  const myGender = useMyGender();
  const [matchTarget, setMatchTarget] = useState<MatchTarget>('any');
  const [items, setItems] = useState<any[]>([]);

  // 性別が不明になったら「同士のみ」を回避
  useEffect(() => {
    if (myGender === 'unknown' && matchTarget === 'same_gender') {
      setMatchTarget('any');
    }
  }, [myGender, matchTarget]);

  const fetchCandidates = useCallback(async () => {
    const { data: me } = await supabase.auth.getUser();
    const myId = me.user?.id;

    let q = supabase
      .from('gotore_profiles') // 候補一覧テーブル想定
      .select('id, nickname, gender, first_photo_url, ...') // 必要項目に
      .neq('user_id', myId) // 自分除外

    if (matchTarget === 'same_gender') {
      if (myGender === 'male' || myGender === 'female') {
        q = q.eq('gender', myGender);
      } else {
        // 念のためガード（ここには通常来ない）
        q = q; 
      }
    }
    const { data, error } = await q.limit(100);
    if (!error) setItems(data ?? []);
  }, [matchTarget, myGender]);

  // マッチ条件や性別が変わったら再取得（KYCの性別変更も含む）
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
      {/* ここに一覧UI（カード）を表示 */}
    </View>
  );
}
