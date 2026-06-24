module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // react-native-reanimated/plugin removed — MixMatch does not use Reanimated
    // The plugin was causing production build crashes (ExpoModulesWorklets init crash)
  };
};
