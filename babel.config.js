// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // plugins は一旦なし（Reanimated等を使う時にだけ追加）
    plugins: [
      // 他にプラグインがあればそのまま
      'react-native-reanimated/plugin', // ← 必ず最後
    ],
  };
};
