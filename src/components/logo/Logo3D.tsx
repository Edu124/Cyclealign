import { Image, View } from 'react-native';

interface Props {
  size?: number;
  showTagline?: boolean;
  showName?: boolean;
  animate?: boolean;
}

const RING = '#A8C293'; // sage — matches palette.lavender

export function Logo3D({ size = 240 }: Props) {
  const innerSize = size * 0.88;

  return (
    // Outer ring — cream app background colour
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#F7F4EF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#9C8C78',
        shadowOpacity: 0.15,
        shadowRadius: size * 0.12,
        shadowOffset: { width: 0, height: size * 0.03 },
        elevation: 4,
      }}
    >
      {/* Inner circle — white, matches the logo image background exactly */}
      <View
        style={{
          width: innerSize,
          height: innerSize,
          borderRadius: innerSize / 2,
          backgroundColor: '#FFFFFF',
          borderWidth: 1,
          borderColor: RING + '44',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <Image
          source={require('../../../assets/logo.png')}
          style={{ width: innerSize * 0.9, height: innerSize * 0.9 }}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}
