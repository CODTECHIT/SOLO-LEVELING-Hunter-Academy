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
import { Shield } from "lucide-react-native";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { SafeScreen } from "@/components/layout/SafeScreen";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CyberTechLogo } from "@/components/ui/CyberTechLogo";
import { useAuthStore } from "@/store/authStore";
import { colors, fonts, fontSizes, spacing, radii } from "@/theme";

const schema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

type SignupForm = z.infer<typeof schema>;

WebBrowser.maybeCompleteAuthSession();

export default function SignupScreen() {
  const router = useRouter();
  const { signup } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: "PLACEHOLDER_ANDROID_CLIENT_ID",
    iosClientId: "PLACEHOLDER_IOS_CLIENT_ID",
    webClientId: "PLACEHOLDER_WEB_CLIENT_ID",
  });

  React.useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;
      console.log("Google Auth Success", authentication);
      Alert.alert(
        "Google Signup Successful", 
        "Waiting on backend API to issue session token. Since this is using placeholder client IDs, this shouldn't be reached yet!"
      );
    }
  }, [response]);

  const { control, handleSubmit, formState: { errors } } = useForm<SignupForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirm: "",
    }
  });

  const onSubmit = async (values: SignupForm) => {
    setLoading(true);
    try {
      await signup(values.name, values.email, values.password);
      router.replace("/(tabs)");
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? err?.message ?? "Registration failed";
      Alert.alert("Registration Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeScreen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <CyberTechLogo size="lg" />
            <Text style={styles.subtitle}>Create your hunter account</Text>
          </View>

          <View style={styles.card}>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Hunter Name"
                  value={value}
                  onChangeText={onChange}
                  autoCapitalize="words"
                  error={errors.name?.message}
                  placeholder="Jin-Woo Sung"
                />
              )}
            />
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
                  error={errors.password?.message}
                  placeholder="Min. 6 characters"
                />
              )}
            />
            <Controller
              control={control}
              name="confirm"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Confirm Password"
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry
                  error={errors.confirm?.message}
                  placeholder="Repeat password"
                />
              )}
            />

            <Button
              label="Create Account"
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
              variant="secondary"
              fullWidth
              style={styles.googleBtn}
            />

            <TouchableOpacity onPress={() => router.push("/(auth)/login")} style={styles.link}>
              <Text style={styles.linkText}>
                Already a hunter?{" "}
                <Text style={{ color: colors.neonPurple }}>Sign In</Text>
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
    backgroundColor: colors.neonLimeAlpha20,
    borderWidth: 1,
    borderColor: colors.neonLime + "60",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.neonLime,
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
    shadowColor: colors.neonLime,
    shadowOpacity: 0.1,
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
  linkText: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.mutedForeground },
});
