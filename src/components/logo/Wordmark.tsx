import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform, StyleSheet, Text, TextStyle } from 'react-native';
import { gradients, palette } from '@/theme';
import { fonts } from '@/theme/fonts';

interface Props {
  size?: number;
  style?: TextStyle;
}

/** "CycleAlign" wordmark in Segoe Print, filled with the brand gradient. */
export function Wordmark({ size = 30, style }: Props) {
  const textStyle: TextStyle = {
    fontSize: size,
    fontFamily: fonts.name,
    letterSpacing: 0.5,
  };

  // MaskedView isn't available on web; fall back to a solid brand colour there.
  if (Platform.OS === 'web') {
    return (
      <Text style={[textStyle, { color: palette.lavenderDeep }, style]}>
        CycleAlign
      </Text>
    );
  }

  return (
    <MaskedView
      maskElement={
        <Text style={[textStyle, styles.mask, style]}>CycleAlign</Text>
      }
    >
      <LinearGradient
        colors={gradients.ring}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={[textStyle, styles.transparent, style]}>CycleAlign</Text>
      </LinearGradient>
    </MaskedView>
  );
}

const styles = StyleSheet.create({
  mask: { backgroundColor: 'transparent' },
  transparent: { opacity: 0 },
});
