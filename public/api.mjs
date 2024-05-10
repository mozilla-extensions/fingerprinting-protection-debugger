const { Preferences } = ChromeUtils.importESModule(
  "resource://gre/modules/Preferences.sys.mjs"
);

const OVERRIDES_PREF = "privacy.fingerprintingProtection.overrides";

this.fppOverrides = class extends ExtensionAPI {
  getAPI(context) {
    return {
      fppOverrides: {
        get() {
          const overrides = deserializeOverrides(
            Preferences.get(OVERRIDES_PREF)
          );
          if (Object.keys(overrides).length === 0) {
            this.defaults().forEach((t) => {
              overrides[t] = true;
            });
          }
          return overrides;
        },
        set(target, enabled) {
          const overrides = this.get();
          if (Object.keys(overrides).length === 0) {
            this.defaults().forEach((t) => {
              overrides[t] = true;
            });
          }
          overrides[target] = enabled;
          setSerialized(serializeOverrides(overrides));
        },
        setAll(enabled) {
          setSerialized(
            serializeOverrides(
              Object.fromEntries(
                Object.entries(TARGETS).map(([t]) => [t, enabled])
              )
            )
          );
        },
        resetToDefaults() {
          setSerialized(serializeOverrides(DEFAULT_TARGETS));
        },
        invalidTargets() {
          return invalidTargets(Preferences.get(OVERRIDES_PREF));
        },
        targets() {
          return Object.keys(TARGETS);
        },
        defaults() {
          return Object.keys(DEFAULT_TARGETS);
        },
      },
    };
  }
};

const TARGETS = {
  TouchEvents: false,
  PointerEvents: false,
  KeyboardEvents: false,
  ScreenOrientation: false,
  SpeechSynthesis: false,
  CSSPrefersColorScheme: false,
  CSSPrefersReducedMotion: false,
  CSSPrefersContrast: false,
  CanvasRandomization: true,
  CanvasImageExtractionPrompt: false,
  CanvasExtractionFromThirdPartiesIsBlocked: false,
  CanvasExtractionBeforeUserInputIsBlocked: false,
  JSLocale: false,
  NavigatorAppVersion: false,
  NavigatorBuildID: false,
  NavigatorHWConcurrency: false,
  NavigatorOscpu: false,
  NavigatorPlatform: false,
  NavigatorUserAgent: false,
  StreamTrackLabel: false,
  StreamVideoFacingMode: false,
  JSDateTimeUTC: false,
  JSMathFdlibm: false,
  Gamepad: false,
  HttpUserAgent: false,
  WindowOuterSize: false,
  WindowScreenXY: false,
  WindowInnerScreenXY: false,
  ScreenPixelDepth: false,
  ScreenRect: false,
  ScreenAvailRect: false,
  VideoElementMozFrames: false,
  VideoElementMozFrameDelay: false,
  VideoElementPlaybackQuality: false,
  ReduceTimerPrecision: false,
  WidgetEvents: false,
  MediaDevices: false,
  MediaCapabilities: false,
  AudioSampleRate: false,
  NavigatorConnection: false,
  WindowDevicePixelRatio: false,
  MouseEventScreenPoint: false,
  FontVisibilityBaseSystem: false,
  FontVisibilityLangPack: true,
  DeviceSensors: false,
  FrameRate: false,
  RoundWindowSize: false,
  UseStandinsForNativeColors: false,
  AudioContext: false,
  MediaError: false,
  DOMStyleOsxFontSmoothing: false,
  CSSDeviceSize: false,
  CSSColorInfo: false,
  CSSResolution: false,
  CSSPrefersReducedTransparency: false,
  CSSInvertedColors: false,
  CSSVideoDynamicRange: false,
  CSSPointerCapabilities: false,
  WebGLRenderCapability: false,
  WebGLRenderInfo: false,
  SiteSpecificZoom: false,
  FontVisibilityRestrictGenerics: false,

  // Hide IsAlwaysEnabledForPrecompute because overriding
  // it may result in undefined behaviour
  // IsAlwaysEnabledForPrecompute: false,

  // Hide AllTargets because it results in +/-AllTargets,+/-Target
  // which is not desired since we use checkboxes to indicate +/-
  // and it can create ambiguity in UI
  // AllTargets: false,
};

const DEFAULT_TARGETS = Object.fromEntries(
  Object.entries(TARGETS).filter(([, d]) => d)
);

function deserializeOverrides(str) {
  const targets = {};
  if (str.length === 0) {
    return targets;
  }
  for (let targetS of str.split(",")) {
    targetS = targetS.trim();
    const [op, target] = [targetS.slice(0, 1), targetS.slice(1)];
    targets[target] = op === "+";
  }
  return targets;
}

function serializeOverrides(targets) {
  return Object.entries(targets)
    .map(([target, enabled]) => (enabled ? "+" : "-") + target)
    .join(",");
}

function setSerialized(overrides) {
  Preferences.set(OVERRIDES_PREF, overrides);
}

function invalidTargets(str) {
  const invalid = [];
  if (str.length === 0) {
    return invalid;
  }
  for (let targetS of str.split(",")) {
    targetS = targetS.trim();
    const [op, target] = [targetS.slice(0, 1), targetS.slice(1)];
    if (!validateOverride(op, target)) {
      invalid.push(op + target);
    }
  }
  return invalid;
}

function validateOverride(op, target) {
  return ["-", "+"].includes(op) && TARGETS.hasOwnProperty(target);
}
