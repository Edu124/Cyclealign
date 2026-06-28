import { StyleSheet, Text, TextInput } from 'react-native';
import { INTER_BY_WEIGHT } from './fonts';

/**
 * Makes Inter the default font for every <Text> / <TextInput>, picking the
 * correct Inter weight family from the element's `fontWeight` (custom fonts
 * don't synthesise weights reliably on native, so we map explicitly). Any text
 * that sets its own `fontFamily` (e.g. a Playfair Display heading) is left
 * untouched.
 *
 * We modify the INPUT props.style (a valid RN style array on every platform);
 * react-native-web then resolves it to the right CSS. Call once after fonts
 * have loaded.
 */
export function applyGlobalFont() {
  patch(Text as any);
  patch(TextInput as any);
}

function patch(Component: any) {
  if (!Component || Component.__fontPatched) return;
  const oldRender = Component.render;
  if (typeof oldRender !== 'function') return;

  Component.render = function (props: any, ref: any) {
    const flat = StyleSheet.flatten(props?.style) || {};
    // Respect an explicit font family (Playfair headings, brand name, etc.).
    if (flat.fontFamily) return oldRender.call(this, props, ref);

    const weight = String(flat.fontWeight ?? '400');
    const family = INTER_BY_WEIGHT[weight] ?? 'Inter_400Regular';
    const next = { ...props, style: [{ fontFamily: family }, props?.style] };
    return oldRender.call(this, next, ref);
  };
  Component.__fontPatched = true;
}
