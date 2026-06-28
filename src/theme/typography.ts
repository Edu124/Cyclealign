import { TextStyle } from 'react-native';
import { palette } from './colors';

/**
 * Type scale. Uses system fonts by default so the app runs with zero font
 * assets; swap `fontFamily` here once custom fonts are loaded in the root layout.
 */
export const typography = {
  display: {
    fontSize: 40,
    lineHeight: 46,
    fontWeight: '800',
    color: palette.ink,
    letterSpacing: 0.5,
  } as TextStyle,
  h1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: palette.ink,
  } as TextStyle,
  h2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    color: palette.ink,
  } as TextStyle,
  h3: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    color: palette.ink,
  } as TextStyle,
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    color: palette.inkSoft,
  } as TextStyle,
  bodyStrong: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    color: palette.ink,
  } as TextStyle,
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: palette.muted,
  } as TextStyle,
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    color: palette.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  } as TextStyle,
} as const;
