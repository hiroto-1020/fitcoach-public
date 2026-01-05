import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

export default function HeaderBuyLikes() {
  const router = useRouter();
  return (
    <View style={{ backgroundColor: 'transparent' }}>
      <TouchableOpacity
        onPress={() => router.push('/(tabs)/gotore/purchase')}
        activeOpacity={0.85}
        style={styles.button}
      >
        <Text style={styles.plus}>＋</Text>
        <Text style={styles.label}>いいね購入</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    paddingHorizontal: 14,
    backgroundColor: '#22c55e',
    borderRadius: 999,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  plus:  { color: '#062d19', fontWeight: '900', marginRight: 4 },
  label: { color: '#062d19', fontWeight: '900' },
});
