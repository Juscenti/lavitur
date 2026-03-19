module.exports = {
    name: 'Lavitúr Admin',
    slug: 'lavitur-admin',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'dark',
    splash: { resizeMode: 'contain', backgroundColor: '#0A0A0F' },
    assetBundlePatterns: ['**/*'],
    ios: { supportsTablet: true, bundleIdentifier: 'com.lavitur.admin' },
    android: { adaptiveIcon: { backgroundColor: '#0A0A0F' }, package: 'com.lavitur.admin' },
    web: { bundler: 'metro', output: 'static' },
    plugins: ['expo-router', 'expo-secure-store', 'expo-font'],
    // Disable typed routes generation to avoid `expo-router/internal/routing` crashes.
    experiments: { typedRoutes: false },
    scheme: 'lavitur-admin',
  };