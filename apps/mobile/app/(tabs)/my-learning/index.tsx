import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { GraduationCap, BookOpen } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeScreen } from "@/components/layout/SafeScreen";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { useEnrolledCourses } from "@/hooks/useCourses";
import { colors, fonts, fontSizes, spacing, radii } from "@/theme";

export default function MyLearningScreen() {
  const router = useRouter();
  const { data: courses, isLoading } = useEnrolledCourses();

  return (
    <SafeScreen>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>My Learning</Text>
        <Text style={styles.subtitle}>
          {courses?.length ?? 0} course{courses?.length !== 1 ? "s" : ""} enrolled
        </Text>
      </View>

      {isLoading ? (
        <FlatList
          data={[1, 2, 3]}
          renderItem={() => <SkeletonCard style={styles.card} />}
          keyExtractor={(i) => String(i)}
          contentContainerStyle={styles.list}
        />
      ) : (
        <FlatList
          data={courses ?? []}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => router.push(`/(tabs)/my-learning/${item.id}` as any)}
            >
              <View style={styles.cardThumb}>
                {(item as any).thumbnail ? (
                  <Image
                    source={{ uri: (item as any).thumbnail }}
                    style={styles.thumbImg}
                  />
                ) : (
                  <LinearGradient
                    colors={[colors.neonPurple + "40", colors.neonCyan + "20"]}
                    style={styles.thumbGrad}
                  >
                    <BookOpen color={colors.neonPurple} size={28} />
                  </LinearGradient>
                )}
              </View>
              <View style={styles.cardBody}>
                <View style={styles.topRow}>
                  <Badge label={(item as any).category?.name ?? "Course"} variant="purple" />
                  {(item as any).expired && <Badge label="Expired" variant="pink" />}
                </View>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                <ProgressBar
                  value={item.progress}
                  color={item.progress >= 100 ? colors.neonLime : colors.neonPurple}
                  label={`${item.completedLessons}/${item.totalLessons} lessons`}
                  showPercent
                  height={6}
                />
              </View>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <GraduationCap color={colors.mutedForeground} size={56} />
              <Text style={styles.emptyTitle}>No courses yet</Text>
              <Text style={styles.emptySubtitle}>
                Browse the catalog and enroll in your first course.
              </Text>
            </View>
          }
        />
      )}
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[5],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 4,
  },
  screenTitle: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
    color: colors.foreground,
    letterSpacing: 3,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  list: { padding: spacing[4], gap: spacing[4] },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    flexDirection: "row",
    shadowColor: colors.neonPurple,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  cardThumb: { width: 100 },
  thumbImg: { width: "100%", height: "100%", resizeMode: "cover" },
  thumbGrad: { flex: 1, alignItems: "center", justifyContent: "center" },
  cardBody: { flex: 1, padding: spacing[4], gap: spacing[2] },
  topRow: { flexDirection: "row", gap: spacing[2] },
  cardTitle: { fontFamily: fonts.sans, fontSize: fontSizes.base, color: colors.foreground, lineHeight: 20 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: spacing[4], paddingHorizontal: spacing[6] },
  emptyTitle: { fontFamily: fonts.display, fontSize: fontSizes.lg, color: colors.foreground, letterSpacing: 2 },
  emptySubtitle: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.mutedForeground, textAlign: "center", lineHeight: 20 },
});
