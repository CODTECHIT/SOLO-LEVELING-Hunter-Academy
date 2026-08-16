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
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Zap } from "lucide-react-native";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { SafeScreen } from "@/components/layout/SafeScreen";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/authStore";
import { colors, fonts, fontSizes, spacing, radii } from "@/theme";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type LoginForm = z.infer<typeof loginSchema>;

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: "PLACEHOLDER_ANDROID_CLIENT_ID",
    iosClientId: "PLACEHOLDER_IOS_CLIENT_ID",
    webClientId: "PLACEHOLDER_WEB_CLIENT_ID",
  });

  React.useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;
      // In production, send authentication?.accessToken to your backend
      console.log("Google Auth Success", authentication);
      Alert.alert(
        "Google Login Successful", 
        "Waiting on backend API to issue session token. Since this is using placeholder client IDs, this shouldn't be reached yet!"
      );
    }
  }, [response]);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    }
  });

  const onSubmit = async (values: LoginForm) => {
    setLoading(true);
    try {
      await login(values.email, values.password);
      router.replace("/(tabs)");
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? err?.message ?? "Login failed";
      Alert.alert("Login Failed", msg);
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
          {/* Logo & Brand */}
          <View style={styles.brand}>
            <View style={styles.logoBox}>
              <Zap color={colors.neonCyan} size={32} />
            </View>
            <Text style={styles.title}>HUNTER ACADEMY</Text>
            <Text style={styles.subtitle}>Sign in to continue your journey</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Email"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  error={errors.email?.message}
                  placeholder="hunter@cybertech.com"
                />
              )}
            />
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Password"
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry
                  autoComplete="password"
                  error={errors.password?.message}
                  placeholder="••••••••"
                />
              )}
            />

            <Button
              label="Sign In"
              onPress={handleSubmit(onSubmit)}
              loading={loading}
              fullWidth
              style={styles.btn}
            />

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <Button
              label="Continue with Google"
              onPress={() => promptAsync()}
              disabled={!request || loading}
              variant="outline"
              fullWidth
              style={styles.googleBtn}
            />

            <TouchableOpacity onPress={() => router.push("/(auth)/signup")} style={styles.link}>
              <Text style={styles.linkText}>
                No account yet?{" "}
                <Text style={{ color: colors.neonPurple }}>Register as a Hunter</Text>
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
  brand: { alignItems: "center", marginBottom: spacing[8], gap: spacing[3] },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: radii.xl,
    backgroundColor: colors.neonCyanAlpha20,
    borderWidth: 1,
    borderColor: colors.neonCyan + "60",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.neonCyan,
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
    color: colors.foreground,
    letterSpacing: 4,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii["2xl"],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[6],
    gap: spacing[5],
    shadowColor: colors.neonPurple,
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  btn: { marginTop: spacing[2] },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing[4],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    marginHorizontal: spacing[4],
  },
  googleBtn: {
    marginBottom: spacing[2],
  },
  link: { alignItems: "center" },
  linkText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
  },
  footerLinkText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.neonCyan,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginTop: spacing[2],
  },
  forgotPasswordText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.neonPurple,
  },
});
