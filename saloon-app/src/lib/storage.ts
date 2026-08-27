import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Token storage. SecureStore on native (encrypted keychain / keystore);
 * localStorage on web where SecureStore is unavailable.
 */
const webStore = {
  getItem: async (k: string) => (typeof localStorage !== 'undefined' ? localStorage.getItem(k) : null),
  setItem: async (k: string, v: string) => {
    if (typeof localStorage !== 'undefined') localStorage.setItem(k, v);
  },
  removeItem: async (k: string) => {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(k);
  },
};

const nativeStore = {
  getItem: (k: string) => SecureStore.getItemAsync(k),
  setItem: (k: string, v: string) => SecureStore.setItemAsync(k, v),
  removeItem: (k: string) => SecureStore.deleteItemAsync(k),
};

export const storage = Platform.OS === 'web' ? webStore : nativeStore;

export const TOKEN_KEY = 'accessToken';
export const REFRESH_KEY = 'refreshToken';
