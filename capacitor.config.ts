import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dek.fitness',
  appName: 'DEK FITNESS',
  webDir: 'dist',
  backgroundColor: '#0A0B0D',
  android: { allowMixedContent: false },
  ios: { contentInset: 'never' },
};

export default config;
