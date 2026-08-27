/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#111827',
    background: '#f9fafb',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
    // salon UI tokens
    screen: '#f9fafb',
    card: '#ffffff',
    border: '#f0f1f3',
    muted: '#6b7280',
    faint: '#9ca3af',
  },
  dark: {
    text: '#f4f4f5',
    background: '#09090b',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
    // salon UI tokens
    screen: '#09090b',
    card: '#18181b',
    border: '#27272a',
    muted: '#a1a1aa',
    faint: '#71717a',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/**
 * Fixed brand palette — the salon red and semantic status tones. These read the
 * same in light and dark mode (they sit on white cards / coloured chips).
 */
export const Brand = {
  primary: '#dc2626',
  primaryDark: '#b91c1c',
  primaryDeep: '#991b1b',
  primaryLight: '#fee2e2',
  primaryTint: '#fef2f2',
  onPrimary: '#ffffff',
  star: '#f59e0b',
  // status tones: [text, background]
  amber: '#b45309', amberBg: '#fef3c7',
  blue: '#1d4ed8', blueBg: '#dbeafe',
  green: '#15803d', greenBg: '#dcfce7',
  purple: '#7e22ce', purpleBg: '#f3e8ff',
  indigo: '#4f46e5', indigoBg: '#e0e7ff',
} as const;

export const Radius = { sm: 10, md: 14, lg: 16, xl: 20, pill: 999 } as const;

/** Booking status → friendly label + tone (mirrors the web app's util). */
export const BookingStatus: Record<string, { label: string; fg: string; bg: string }> = {
  PENDING: { label: 'Awaiting confirmation', fg: Brand.amber, bg: Brand.amberBg },
  CONFIRMED: { label: 'Confirmed', fg: Brand.blue, bg: Brand.blueBg },
  IN_PROGRESS: { label: 'In progress', fg: Brand.purple, bg: Brand.purpleBg },
  COMPLETED: { label: 'Completed', fg: Brand.green, bg: Brand.greenBg },
  CANCELLED: { label: 'Cancelled', fg: '#b91c1c', bg: '#fee2e2' },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
