import { useEffect } from "react";
import { Platform } from "react-native";
import * as ScreenCapture from "expo-screen-capture";

/**
 * Platform-safe hook to prevent screenshots and screen recording on Android/iOS native devices,
 * gracefully no-opping on web previews.
 */
export function useSafePreventScreenCapture(key?: string) {
  useEffect(() => {
    if (Platform.OS === "web") return;

    try {
      ScreenCapture.preventScreenCaptureAsync(key).catch(() => {});
    } catch {
      // Ignore native module availability exceptions on unsupported platforms
    }

    return () => {
      if (Platform.OS !== "web") {
        try {
          ScreenCapture.allowScreenCaptureAsync(key).catch(() => {});
        } catch {
          // Ignore
        }
      }
    };
  }, [key]);
}

export function useScreenshotListener(listener: () => void) {
  useEffect(() => {
    if (Platform.OS === "web") return;

    let subscription: ScreenCapture.Subscription | null = null;
    try {
      subscription = ScreenCapture.addScreenshotListener(listener);
    } catch {
      // Ignore
    }

    return () => {
      subscription?.remove();
    };
  }, [listener]);
}



