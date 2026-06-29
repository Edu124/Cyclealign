import { Image, View } from 'react-native';

interface Props {
  size?: number;
  animate?: boolean;
  showName?: boolean;
  showTagline?: boolean;
}

export function Logo3D({ size = 240 }: Props) {
  return (
    <View style={{ width: size, height: size }}>
      <Image
        source={require('../../../assets/logo.jpg')}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </View>
  );
}
