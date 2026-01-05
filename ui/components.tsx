import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
  type GestureResponderEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function Screen({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <SafeAreaView style={[styles.screen, style]}>{children}</SafeAreaView>;
}

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  return <Text style={[styles.sectionTitle, style]}>{children}</Text>;
}

type BtnProps = {
  title: string;
  onPress?: (e: GestureResponderEvent) => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({ title, onPress, disabled, style }: BtnProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.btnPrimary, disabled && styles.btnDisabled, style]}
    >
      <Text style={styles.btnPrimaryText}>{title}</Text>
    </TouchableOpacity>
  );
}

export function ButtonOutline({ title, onPress, style }: BtnProps) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.btnOutline, style]}>
      <Text style={styles.btnOutlineText}>{title}</Text>
    </TouchableOpacity>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  multiline = false,
  style,
}: {
  label: string;
  value?: string;
  onChangeText?: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  multiline?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={style}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        multiline={multiline}
        style={[styles.input, multiline && { height: 96 }]}
        placeholderTextColor="#9ca3af"
      />
    </View>
  );
}

export function Spacer({ size = 12 }: { size?: number }) {
  return <View style={{ height: size }} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#111827',
  },
  btnPrimary: { backgroundColor: '#2563eb', paddingVertical: 12, borderRadius: 10 },
  btnPrimaryText: { color: '#fff', textAlign: 'center', fontWeight: '700' },
  btnOutline: {
    borderWidth: 1,
    borderColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 10,
  },
  btnOutlineText: { color: '#2563eb', textAlign: 'center', fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
});
