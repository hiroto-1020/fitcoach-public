// plugins/with-mlkit-pose.js
const {
  withDangerousMod,
  withAppBuildGradle,
  withGradleProperties,
  withInfoPlist,
} = require('expo/config-plugins');

module.exports = function withMlkitPose(config) {
  // iOS: Podfile に ML Kit Pose を追加
  config = withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const fs = require('fs');
      const path = require('path');
      const podfilePath = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      let podfile = fs.readFileSync(podfilePath, 'utf8');

      if (!podfile.includes(`GoogleMLKit/PoseDetection`)) {
        podfile = podfile.replace(
          /use_expo_modules!\n/,
          `use_expo_modules!\n  pod 'GoogleMLKit/PoseDetectionAccurate'\n`
        );
        fs.writeFileSync(podfilePath, podfile);
      }
      return cfg;
    },
  ]);

  // Android: app/build.gradle に ML Kit 依存を追加
  config = withAppBuildGradle(config, (cfg) => {
    if (!cfg.modResults.contents.includes('com.google.mlkit:pose-detection')) {
      cfg.modResults.contents = cfg.modResults.contents.replace(
        /dependencies\s*{/,
        `dependencies {
    implementation "com.google.mlkit:pose-detection-accurate:17.0.0"`
      );
    }
    return cfg;
  });

  // Android: gradle.properties の設定（必要なら）
  config = withGradleProperties(config, (cfg) => {
    const props = cfg.modResults;
    const addProp = (k, v) => {
      if (!props.some(p => p.key === k)) props.push({ type: 'property', key: k, value: v });
    };
    addProp('android.useAndroidX', 'true');
    addProp('android.enableJetifier', 'true');
    return cfg;
  });

  // iOS: プライバシー用途文言（念のため）
  config = withInfoPlist(config, (cfg) => {
    cfg.modResults.NSCameraUsageDescription =
      cfg.modResults.NSCameraUsageDescription || 'ポーズ推定のためカメラを使用します。';
    return cfg;
  });

  return config;
};
