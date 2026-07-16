module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    // 古い Expo Go / Hermes のパーサは #private（プライベートフィールド/
    // メソッド）構文を実行時に解釈できず
    // 「private properties are not supported」で落ちる。
    // babel-preset-expo は Hermes 向けにこれらを温存するため、
    // 明示プラグインで必ず旧構文へ変換し、Hermes バージョン非依存にする。
    plugins: [
      ["@babel/plugin-transform-private-methods", { loose: true }],
      ["@babel/plugin-transform-class-properties", { loose: true }],
      ["@babel/plugin-transform-private-property-in-object", { loose: true }],
    ],
  };
};
