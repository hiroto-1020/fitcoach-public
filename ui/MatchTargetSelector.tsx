import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { Gender, MatchTarget } from '../lib/gotore/types';
import { labelForSameGender } from '../lib/gotore/types';

type Props = {
  myGender: Gender;
  value: MatchTarget;
  onChange: (v: MatchTarget) => void;
};

export default function MatchTargetSelector({ myGender, value, onChange }: Props) {
  const sameLabel = labelForSameGender(myGender);
  const sameDisabled = myGender === 'unknown';

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>マッチ対象</Text>
      <View style={styles.segment}>
        <Pressable
          onPress={() => onChange('any')}
          style={[styles.item, value === 'any' && styles.active]}
        >
          <Text style={[styles.text, value === 'any' && styles.activeText]}>男女問わず</Text>
        </Pressable>

        <Pressable
          onPress={() => onChange('same_gender')}
          disabled={sameDisabled}
          style={[
            styles.item,
            value === 'same_gender' && styles.active,
            sameDisabled && styles.disabled,
          ]}
        >
          <Text
            style={[
              styles.text,
              value === 'same_gender' && styles.activeText,
              sameDisabled && styles.disabledText,
            ]}
          >
            {sameLabel}
          </Text>
        </Pressable>
      </View>
      {sameDisabled && (
        <Text style={styles.hint}>※ 性別未設定です。本人確認で性別を設定してください。</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  label: { fontSize: 14, opacity: 0.7 },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#1f1f22',
    padding: 4,
    borderRadius: 14,
  },
  item: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  active: { backgroundColor: '#2e2e34' },
  text: { fontSize: 15 },
  activeText: { fontWeight: '700' },
  disabled: { opacity: 0.5 },
  disabledText: {},
  hint: { fontSize: 12, opacity: 0.7 },
});
