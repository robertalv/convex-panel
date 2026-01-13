module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // Remove console.log statements in production
      process.env.NODE_ENV === "production" && [
        "transform-remove-console",
        {
          exclude: ["error", "warn"],
        },
      ],
      // react-native-reanimated plugin must be listed last
      "react-native-reanimated/plugin",
    ].filter(Boolean),
  };
};
