import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Linking from "expo-linking";
import { CyberTechLogo } from "@/components/ui/CyberTechLogo";
import { handleOAuthUrl } from "@/lib/auth";
import { useAuthStore } from "@/store/authStore";
import { colors, fonts, fontSizes, spacing, radii } from "@/theme";
import { AlertCircle, ArrowLeft } from "lucide-react-native";

export default function AuthCallbackScreen() {
  const router = useRouter();
  const url = Linking.useURL();
  const params = useLocalSearchParams();
  const [status, setStatus] = useState("Verifying Google credentials...");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let handled = false;

    async function processCallback() {
      try {
        setStatus("Synchronizing Hunter profile...");
        // Prefer the full incoming URL if available, or build from parameters
        const callbackUrl = url || (typeof window !== "undefined" && window.location ? window.location.href : null);
        const result = await handleOAuthUrl(callbackUrl);

        if (!isMounted) return;
        handled = true;

        // Update auth state in store
        useAuthStore.setState({
          user: result.user,
          isAuthenticated: true,
          isLoading: false,
        });

        // Navigate to main application
        router.replace("/(tabs)");
      } catch (err: any) {
        if (!isMounted) return;
        console.error("Auth callback handling failed:", err);
        setErrorMsg(
          err?.response?.data?.message ||
            err?.message ||
            "Authentication could not be completed. Please try signing in again."
        );
      }
    }

    processCallback();

    // Timeout safety fallback (12s)
    const timeout = setTimeout(() => {
      if (isMounted && !handled && !errorMsg) {
        setErrorMsg("Authentication session timed out. Please try signing in again.");
      }
    }, 12000);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [url]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {errorMsg ? (
          <View style={styles.errorContent}>
            <View style={styles.errorIconBox}>
              <AlertCircle size={32} color={colors.destructive} />
            </View>
            <Text style={styles.title}>AUTHENTICATION FAILED</Text>
            <Text style={styles.errorText}>{errorMsg}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => router.replace("/(auth)/login")}
              activeOpacity={0.8}
            >
              <ArrowLeft size={18} color="#000" style={{ marginRight: 8 }} />
              <Text style={styles.retryBtnText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.loadingContent}>
            <CyberTechLogo size="lg" />
            <ActivityIndicator
              size="large"
              color={colors.neonCyan}
              style={styles.spinner}
            />
            <Text style={styles.title}>ENTERING THE GATE</Text>
            <Text style={styles.statusText}>{status}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing[6],
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: colors.card,
    borderRadius: radii["2xl"],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[8],
    alignItems: "center",
    shadowColor: colors.neonPurple,
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  loadingContent: {
    alignItems: "center",
    gap: spacing[4],
  },
  spinner: {
    marginVertical: spacing[3],
  },
  errorContent: {
    alignItems: "center",
    gap: spacing[4],
  },
  errorIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[2],
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSizes.lg,
    color: colors.foreground,
    letterSpacing: 2,
    textAlign: "center",
  },
  statusText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    textAlign: "center",
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: "rgba(255, 120, 120, 0.9)",
    textAlign: "center",
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: spacing[4],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.neonCyan,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
    borderRadius: radii.xl,
    shadowColor: colors.neonCyan,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  retryBtnText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    fontWeight: "700",
    color: "#000",
  },
});
