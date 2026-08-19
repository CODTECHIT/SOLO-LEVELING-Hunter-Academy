import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { colors } from "@/theme";
import { CyberTechLogo } from "@/components/ui/CyberTechLogo";

export default function Index() {
  const { loadUser, isAuthenticated, isLoading } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadUser().finally(() => setReady(true));
  }, [loadUser]);

  if (!ready || isLoading) {
    return (
      <View style={styles.center}>
        <CyberTechLogo size="lg" />
        <ActivityIndicator color={colors.neonCyan} size="small" style={{ marginTop: 24 }} />
      </View>
    );
  }

  return isAuthenticated ? <Redirect href="/(tabs)" /> : <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    padding: 20,
  },
});
