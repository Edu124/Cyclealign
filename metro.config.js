const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Prefer react-native / require / default export conditions so that packages
// like @supabase/supabase-js resolve to their CJS build instead of the ESM
// build (which uses import.meta and breaks Metro's web bundler).
config.resolver.unstable_conditionNames = ['react-native', 'require', 'default'];

module.exports = config;
