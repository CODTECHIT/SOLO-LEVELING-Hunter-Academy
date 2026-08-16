import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { colors } from "@/theme";

export default function Index() {
  const { loadUser, isAuthenticated, isLoading } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadUser().finally(() => setReady(true));
  }, [loadUser]);

  if (!ready || isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.neonPurple} size="large" />
      </View>
    );
  }

  return isAuthenticated ? <Redirect href="/(tabs)" /> : <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
});
