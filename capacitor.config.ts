import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.nrnworld.neonpathpuzzle",
  appName: "Neon Path Puzzle",
  webDir: "dist/public",
  backgroundColor: "#0a0f1e",
  zoomEnabled: false,
  android: {
    backgroundColor: "#0a0f1e",
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
    loggingBehavior: "debug",
    minWebViewVersion: 83,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: "#0a0f1e",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#0a0f1e",
      overlaysWebView: false,
    },
  },
};

export default config;
