import { Platform } from 'react-native';

/**
 * API base URL. Set EXPO_PUBLIC_API_URL for real builds (see .env). The dev
 * fallbacks below let it work out of the box against a local backend:
 *  - Android emulator reaches the host PC via 10.0.2.2
 *  - web / iOS simulator reach it via localhost
 * A physical device must use your PC's LAN IP (set EXPO_PUBLIC_API_URL).
 */
const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();

function devFallback() {
  if (Platform.OS === 'android') return 'http://10.0.2.2:5000/api/v1';
  return 'http://localhost:5000/api/v1';
}

export const API_URL = fromEnv && fromEnv.length > 0 ? fromEnv : devFallback();
