import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { ArrowLeft, Mail, Lock, ShieldCheck } from "lucide-react-native";
import { useRouter } from "expo-router";
import { SafeScreen } from "@/components/layout/SafeScreen";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { colors, fonts, fontSizes, spacing, radii } from "@/theme";
import api from "@/lib/api";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"EMAIL" | "OTP" | "NEW_PASSWORD">("EMAIL");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email");
      return;
    }
    
    // Simulating API call for OTP since actual reset API might not exist yet
    // In production, this would call something like `api.post("/auth/forgot-password", { email })`
    try {
      setLoading(true);
      // await api.post("/auth/forgot-password", { email });
      setTimeout(() => {
        setStep("OTP");
        setLoading(false);
      }, 1000);
    } catch (error) {
      Alert.alert("Error", "Failed to send OTP");
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      Alert.alert("Error", "Please enter the OTP sent to your email");
      return;
    }
    
    try {
      setLoading(true);
      // await api.post("/auth/verify-otp", { email, otp });
      setTimeout(() => {
        setStep("NEW_PASSWORD");
        setLoading(false);
      }, 1000);
    } catch (error) {
      Alert.alert("Error", "Invalid OTP");
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return;
    }

    try {
      setLoading(true);
      // await api.post("/auth/reset-password", { email, otp, newPassword });
      setTimeout(() => {
        setLoading(false);
        Alert.alert("Success", "Password reset successfully. Please login with your new password.", [
          { text: "OK", onPress: () => router.replace("/(auth)/login") }
        ]);
      }, 1000);
    } catch (error) {
      Alert.alert("Error", "Failed to reset password");
      setLoading(false);
    }
  };

  return (
    <SafeScreen>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft color={colors.foreground} size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          {step === "EMAIL" && "Enter your email address to receive a verification code."}
          {step === "OTP" && `Enter the 6-digit verification code sent to ${email}.`}
          {step === "NEW_PASSWORD" && "Create a new, strong password for your account."}
        </Text>

        <View style={styles.form}>
          {step === "EMAIL" && (
            <>
              <Input
                placeholder="Hunter Email Address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon={<Mail color={colors.mutedForeground} size={18} />}
              />
              <Button
                label={loading ? "Sending..." : "Send Verification Code"}
                onPress={handleSendOtp}
                disabled={loading}
                variant="neonPurple"
              />
            </>
          )}

          {step === "OTP" && (
            <>
              <Input
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                leftIcon={<ShieldCheck color={colors.mutedForeground} size={18} />}
              />
              <Button
                label={loading ? "Verifying..." : "Verify Code"}
                onPress={handleVerifyOtp}
                disabled={loading}
                variant="neonCyan"
              />
            </>
          )}

          {step === "NEW_PASSWORD" && (
            <>
              <Input
                placeholder="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                leftIcon={<Lock color={colors.mutedForeground} size={18} />}
              />
              <Button
                label={loading ? "Resetting..." : "Reset Password"}
                onPress={handleResetPassword}
                disabled={loading}
                variant="neonLime"
              />
            </>
          )}
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  backBtn: {
    padding: spacing[2],
    backgroundColor: colors.surface2,
    borderRadius: radii.full,
    alignSelf: "flex-start",
  },
  content: {
    padding: spacing[6],
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: colors.foreground,
    marginBottom: spacing[2],
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: fontSizes.base,
    color: colors.mutedForeground,
    marginBottom: spacing[8],
    lineHeight: 22,
  },
  form: {
    gap: spacing[4],
  },
});
