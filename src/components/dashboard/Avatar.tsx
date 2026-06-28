import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text } from 'react-native';
import { dash } from '@/theme';
import { fonts } from '@/theme/fonts';

interface Props {
  name: string;
  size?: number;
}

/** Soft gradient avatar with the user's initial — no photo asset needed. */
export function Avatar({ name, size = 48 }: Props) {
  const initial = (name?.trim()?.[0] ?? '?').toUpperCase();
  return (
    <LinearGradient
      colors={[dash.sageTint, dash.clayTint]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.wrap, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <Text style={[styles.initial, { fontSize: size * 0.42 }]}>{initial}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  initial: { fontFamily: fonts.heading, color: dash.sageDeep },
});
