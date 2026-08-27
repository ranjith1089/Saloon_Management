import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.studieo.salon',
  appName: 'Studieo',
  webDir: 'dist',
  server: {
    // Serve the bundled web assets over https:// inside the WebView so the app
    // origin is secure (required for many browser APIs). API calls go to the
    // absolute VITE_API_URL baked into the build — see .env.production.
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#dc2626',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#dc2626',
    },
  },
};

export default config;
