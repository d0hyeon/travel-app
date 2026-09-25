import {
  type ConfigPlugin,
  withAppDelegate,
  withInfoPlist,
} from "expo/config-plugins";
import semver from "semver";

export type ExpoUIScenePluginOptions = {
  enabled?: boolean;
};

const PLUGIN_NAME = "expo-uiscene-lifecycle";
const MINIMUM_EXPO_VERSION = "57.0.23";
const ORIGINAL_APP_DELEGATE = "class AppDelegate: ExpoAppDelegate {";
const SCENE_APP_DELEGATE =
  "class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {";
const FACTORY_ASSIGNMENT = "    reactNativeFactory = factory";
const LEGACY_STARTUP = `    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
`;

const SCENE_MANIFEST = {
  UIApplicationSupportsMultipleScenes: false,
  UISceneConfigurations: {
    UIWindowSceneSessionRoleApplication: [
      {
        UISceneConfigurationName: "Default Configuration",
        UISceneDelegateClassName: "EXExpoAppSceneDelegate",
      },
    ],
  },
};

function assertSdk57(sdkVersion: string | undefined): void {
  // @expo/config는 config.sdkVersion을 항상 "<major>.0.0"으로 뭉갠다
  // (getExpoSDKVersion.js). 그래서 patch 버전 하한(57.0.23)을 그 값과 비교하면
  // 실제로 57.0.23 이상이 설치돼 있어도 항상 실패한다. 설치된 expo 패키지의
  // 진짜 버전으로 비교한다.
  const installedVersion: string = require("expo/package.json").version;
  if (
    !sdkVersion ||
    semver.gt(MINIMUM_EXPO_VERSION, installedVersion) ||
    semver.gte(installedVersion, "58.0.0")
  ) {
    throw new Error(
      `${PLUGIN_NAME} supports Expo ${MINIMUM_EXPO_VERSION} through SDK 57 only (received ${JSON.stringify(installedVersion ?? "unknown")}).`,
    );
  }
}

function isOwnedManifest(manifest: unknown): boolean {
  return JSON.stringify(manifest) === JSON.stringify(SCENE_MANIFEST);
}

function updateAppDelegate(contents: string, enabled: boolean): string {
  const isEnabled = contents.includes(SCENE_APP_DELEGATE);

  if (enabled && isEnabled) {
    return contents;
  }
  if (!enabled && !isEnabled) {
    return contents;
  }

  if (enabled) {
    const startup = `\n${LEGACY_STARTUP}`;
    if (
      !contents.includes(ORIGINAL_APP_DELEGATE) ||
      !contents.includes(startup)
    ) {
      throw new Error(
        `${PLUGIN_NAME} requires the standard Expo SDK 57 Swift AppDelegate.`,
      );
    }
    // startup은 "#if ...\n"의 개행부터 LEGACY_STARTUP 끝 개행(="#endif" 직전
    // 개행)까지를 통째로 지운다. 그대로 빈 문자열로 치환하면 "#if ...#endif"가
    // 개행 없이 붙어 Swift가 "extra tokens" 에러를 낸다. 개행 하나를 남겨
    // "#if ...\n#endif" 형태를 유지한다.
    return contents
      .replace(ORIGINAL_APP_DELEGATE, SCENE_APP_DELEGATE)
      .replace(startup, "\n");
  }

  return contents
    .replace(SCENE_APP_DELEGATE, ORIGINAL_APP_DELEGATE)
    .replace(
      `${FACTORY_ASSIGNMENT}\n\n`,
      `${FACTORY_ASSIGNMENT}\n\n${LEGACY_STARTUP}\n`,
    );
}

const withExpoUIScene: ConfigPlugin<ExpoUIScenePluginOptions | void> = (
  config,
  options,
) => {
  assertSdk57(config.sdkVersion);
  const enabled = options?.enabled !== false;

  config = withAppDelegate(config, (config) => {
    if (config.modResults.language !== "swift") {
      throw new Error(
        `${PLUGIN_NAME} requires the standard Expo SDK 57 Swift AppDelegate.`,
      );
    }
    config.modResults.contents = updateAppDelegate(
      config.modResults.contents,
      enabled,
    );
    return config;
  });

  return withInfoPlist(config, (config) => {
    const manifest = config.modResults.UIApplicationSceneManifest;
    if (enabled) {
      if (manifest !== undefined && !isOwnedManifest(manifest)) {
        throw new Error(
          `${PLUGIN_NAME} cannot enable because UIApplicationSceneManifest is already declared by the app.`,
        );
      }
      config.modResults.UIApplicationSceneManifest = SCENE_MANIFEST;
    } else if (isOwnedManifest(manifest)) {
      delete config.modResults.UIApplicationSceneManifest;
    }
    return config;
  });
};

export default withExpoUIScene;
