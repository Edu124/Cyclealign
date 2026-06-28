import { Pressable, StyleSheet, Text, View } from 'react-native';
import { dash } from '@/theme';
import { fonts } from '@/theme/fonts';
import { Avatar } from './Avatar';

interface Props {
  name: string;
  subtitle?: string;
  onAvatarPress?: () => void;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning,';
  if (h < 17) return 'Good Afternoon,';
  return 'Good Evening,';
}

export function DashboardHeader({
  name,
  subtitle = "Here's your health overview",
  onAvatarPress,
}: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={styles.greeting}>{greeting()}</Text>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.leaf}>🌿</Text>
          </View>
        </View>

        <Pressable onPress={onAvatarPress} hitSlop={8}>
          <Avatar name={name} size={48} />
        </Pressable>
      </View>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: { flex: 1 },
  greeting: { fontSize: 15, color: dash.inkSoft },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  name: { fontFamily: fonts.headingBold, fontSize: 30, color: dash.ink },
  leaf: { fontSize: 22 },
  subtitle: { fontSize: 15, color: dash.inkSoft },
});
