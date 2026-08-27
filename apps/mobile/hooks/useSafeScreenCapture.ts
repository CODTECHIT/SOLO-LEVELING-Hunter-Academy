import { useEffect } from "react";
import { Platform } from "react-native";
import * as ScreenCapture from "expo-screen-capture";

/**
 * Platform-safe hook to prevent screenshots and screen recording on Android/iOS native devices,
 * gracefully no-opping on web previews.
 */
export function useSafePreventScreenCapture(key: string = "learning_player_screen") {
  useEffect(() => {
    if (Platform.OS === "web") return;

    // Enforce hardware-level FLAG_SECURE immediately
    ScreenCapture.preventScreenCaptureAsync(key).catch((err) => {
      console.warn("ScreenCapture prevent error:", err);
    });
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



