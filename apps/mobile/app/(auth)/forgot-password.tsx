import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, KeyRound, Lock, Mail, Sparkles, CheckCircle2 } from "lucide-react-native";
import { SafeScreen } from "@/components/layout/SafeScreen";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CyberTechLogo } from "@/components/ui/CyberTechLogo";
import { api } from "@/lib/api";
import { colors, fonts, fontSizes, spacing, radii } from "@/theme";

import { cyberAlert } from "@/store/alertStore";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!email.trim()) {
      cyberAlert("Email Required", "Please enter your email address to receive the verification code.", undefined, "warning");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", { email: email.trim() });
      cyberAlert(
        "Verification Code Sent",
        res.data?.message || "A 6-digit verification code has been sent to your email.",
        undefined,
        "success"
      );
      setStep(2);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Could not send reset code";
      cyberAlert("Notice", typeof msg === "string" ? msg : "Could not send reset code", undefined, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!code.trim()) {
      cyberAlert("Code Required", "Please enter the 6-digit verification code sent to your email.", undefined, "warning");
      return;
    }
    if (newPassword.length < 6) {
      cyberAlert("Invalid Password", "Password must be at least 6 characters long.", undefined, "warning");
      return;
    }
    if (newPassword !== confirmPassword) {
      cyberAlert("Password Mismatch", "New password and confirmation do not match.", undefined, "warning");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/reset-password", {
        email: email.trim(),
        code: code.trim(),
        newPassword,
      });
      cyberAlert(
        "Password Reset Successful",
        res.data?.message || "Your password has been successfully updated. Please sign in.",
        [
          {
            text: "Sign In",
            onPress: () => router.replace("/(auth)/login" as any),
          },
        ],
        "success"
      );
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Password reset failed";
      cyberAlert("Reset Failed", typeof msg === "string" ? msg : "Password reset failed", undefined, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeScreen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <ArrowLeft color={colors.foreground} size={20} />
            <Text style={styles.backText}>Back to Sign In</Text>
          </TouchableOpacity>

          {/* Logo & Brand */}
          <View style={styles.brand}>
            <CyberTechLogo size="lg" />
            <Text style={styles.title}>
              {step === 1 ? "Reset Password" : "Set New Password"}
            </Text>
            <Text style={styles.subtitle}>
              {step === 1
                ? "Enter your email to receive a 6-digit reset code"
                : `Enter the code sent to ${email}`}
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            {step === 1 ? (
              <>
                <Input
                  label="Hunter Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  placeholder="hunter@gmail.com"
                />

                <Button
                  label="Send Verification Code"
                  onPress={handleSendCode}
                  loading={loading}
                  fullWidth
                  style={styles.btn}
                />
              </>
            ) : (
              <>
                <Input
                  label="6-Digit Reset Code"
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholder="654321"
                />

                <Input
                  label="New Password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  autoComplete="password-new"
                  placeholder="••••••••"
                />

                <Input
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoComplete="password-new"
                  placeholder="••••••••"
                />

                <Button
                  label="Reset Password"
                  onPress={handleResetPassword}
                  loading={loading}
                  fullWidth
                  style={styles.btn}
                />

                <TouchableOpacity
                  onPress={() => setStep(1)}
                  style={styles.resendBtn}
                  activeOpacity={0.8}
                >
                  <Text style={styles.resendText}>Didn't receive code? Resend</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              onPress={() => router.replace("/(auth)/login" as any)}
              style={styles.link}
            >
              <Text style={styles.linkText}>
                Remembered your password?{" "}
                <Text style={{ color: colors.neonCyan }}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "center", padding: spacing[6] },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    marginBottom: spacing[4],
  },
  backText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
  },
  brand: { alignItems: "center", marginBottom: spacing[6], gap: spacing[2] },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
    color: colors.foreground,
    letterSpacing: 1,
    marginTop: spacing[2],
    textAlign: "center",
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    textAlign: "center",
    maxWidth: 280,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii["2xl"],
    borderWidth: 1,
    borderColor: "rgba(147, 51, 234, 0.3)",
    padding: spacing[6],
    gap: spacing[4],
    shadowColor: colors.neonPurple,
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  btn: { marginTop: spacing[2] },
  resendBtn: {
    alignItems: "center",
    paddingVertical: spacing[2],
  },
  resendText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    color: colors.neonCyan,
    textDecorationLine: "underline",
  },
  link: { alignItems: "center", marginTop: spacing[2] },
  linkText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
  },
});
