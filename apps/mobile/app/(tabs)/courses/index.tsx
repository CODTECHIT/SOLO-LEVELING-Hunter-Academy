import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  RefreshControl,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { BookOpen, Search, X } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeScreen } from "@/components/layout/SafeScreen";
import { Badge } from "@/components/ui/Badge";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { useCatalog } from "@/hooks/useCourses";
import { colors, fonts, fontSizes, spacing, radii } from "@/theme";

export default function CoursesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string; category?: string }>();
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState<"ALL" | "FULL" | "MODULE">(
    params.type === "MODULE" ? "MODULE" : params.type === "FULL" ? "FULL" : "ALL"
  );
  const [activeCategory, setActiveCategory] = useState(params.category ?? "");
  const [refreshing, setRefreshing] = useState(false);

  const { data: catalog, isLoading, refetch } = useCatalog();

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const courses = catalog?.courses ?? [];
  const categories = catalog?.categories ?? [];

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) || 
                          c.description.toLowerCase().includes(search.toLowerCase());
      const matchCat = activeCategory ? c.category.id === activeCategory : true;
      const matchType = activeType === "ALL" ? true : c.type === activeType;
      return matchSearch && matchCat && matchType;
    });
  }, [courses, search, activeCategory, activeType]);

  return (
    <SafeScreen>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Course Catalog</Text>
        {/* Search bar */}
        <View style={styles.searchRow}>
          <Search color={colors.mutedForeground} size={16} style={styles.searchIcon} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search courses..."
            placeholderTextColor={colors.mutedForeground}
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <X color={colors.mutedForeground} size={16} />
            </TouchableOpacity>
          )}
        </View>

        {/* Track Type Selector */}
        <View style={styles.typeRow}>
          <TouchableOpacity
            style={[styles.typeBtn, activeType === "ALL" && styles.typeBtnActive]}
            onPress={() => setActiveType("ALL")}
          >
            <Text style={[styles.typeBtnText, activeType === "ALL" && styles.typeBtnTextActive]}>
              All Courses
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeBtn, activeType === "FULL" && styles.typeBtnActivePurple]}
            onPress={() => setActiveType("FULL")}
          >
            <Text style={[styles.typeBtnText, activeType === "FULL" && styles.typeBtnTextActive]}>
              Masterclasses
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeBtn, activeType === "MODULE" && styles.typeBtnActiveCyan]}
            onPress={() => setActiveType("MODULE")}
          >
            <Text style={[styles.typeBtnText, activeType === "MODULE" && styles.typeBtnTextActive]}>
              Hunter Modules
            </Text>
          </TouchableOpacity>
        </View>

        {/* Category filter chips */}
        <FlatList
          horizontal
          data={[{ id: "", name: "All Topics" }, ...categories]}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.chip, activeCategory === item.id && styles.chipActive]}
              onPress={() => setActiveCategory(item.id)}
            >
              <Text style={[styles.chipText, activeCategory === item.id && styles.chipTextActive]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipList}
        />
      </View>

      {/* Course Grid */}
      {isLoading ? (
        <FlatList
          data={[1, 2, 3, 4]}
          numColumns={2}
          renderItem={() => <SkeletonCard style={styles.gridCard} />}
          keyExtractor={(i) => String(i)}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
        />
      ) : (
        <FlatList
          data={filteredCourses}
          numColumns={2}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.gridCard}
              activeOpacity={0.85}
              onPress={() => router.push(`/(tabs)/courses/${item.slug}` as any)}
            >
              <View style={styles.cardThumb}>
                {item.thumbnail ? (
                  <Image source={{ uri: item.thumbnail }} style={styles.thumbImg} />
                ) : (
                  <LinearGradient
                    colors={[colors.neonPurple + "40", colors.neonCyan + "20"]}
                    style={styles.thumbGrad}
                  >
                    <BookOpen color={colors.neonPurple} size={24} />
                  </LinearGradient>
                )}
                <View style={styles.typeTag}>
                  <Text style={styles.typeTagText}>{item.type}</Text>
                </View>
              </View>
              <View style={styles.cardBody}>
                <Badge label={item.category.name} variant="purple" />
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.lessons}>{item.lessons.length} lessons</Text>
                  <Text style={styles.price}>
                    {item.price === 0 ? "Free" : `₹${item.price.toLocaleString()}`}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.neonCyan}
              colors={[colors.neonCyan, colors.neonPurple]}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <BookOpen color={colors.mutedForeground} size={48} />
              <Text style={styles.emptyText}>No courses found</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeScreen>
  );
}

const CARD_W = "48%";

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[5],
    paddingBottom: spacing[3],
    gap: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  screenTitle: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
    color: colors.foreground,
    letterSpacing: 3,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.input,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    gap: spacing[2],
  },
  searchIcon: {},
  searchInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: fontSizes.base,
    color: colors.foreground,
  },
  typeRow: {
    flexDirection: "row",
    gap: spacing[2],
  },
  typeBtn: {
    flex: 1,
    paddingVertical: spacing[2],
    borderRadius: radii.md,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  typeBtnActive: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderColor: colors.foreground,
  },
  typeBtnActivePurple: {
    backgroundColor: "rgba(147, 51, 234, 0.2)",
    borderColor: colors.neonPurple,
  },
  typeBtnActiveCyan: {
    backgroundColor: "rgba(0, 243, 255, 0.15)",
    borderColor: colors.neonCyan,
  },
  typeBtnText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  typeBtnTextActive: {
    color: colors.foreground,
  },
  chipList: { gap: spacing[2], paddingRight: spacing[4] },
  chip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[1],
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
  },
  chipActive: {
    borderColor: colors.neonPurple + "80",
    backgroundColor: colors.neonPurpleAlpha20,
  },
  chipText: { fontFamily: fonts.sans, fontSize: fontSizes.xs, color: colors.mutedForeground, letterSpacing: 1 },
  chipTextActive: { color: colors.neonPurple },

  grid: { padding: spacing[4], gap: spacing[4], paddingBottom: 110 },
  row: { gap: spacing[4] },
  gridCard: {
    width: CARD_W,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.neonPurpleAlpha20,
    overflow: "hidden",
    shadowColor: colors.neonPurple,
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  cardThumb: { height: 110, position: "relative" },
  thumbImg: { width: "100%", height: "100%", resizeMode: "cover" },
  thumbGrad: { flex: 1, alignItems: "center", justifyContent: "center" },
  typeTag: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(13, 11, 24, 0.85)",
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.5)",
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  typeTagText: { fontFamily: fonts.display, fontSize: 8, color: colors.neonCyan, letterSpacing: 1, fontWeight: "bold" },
  cardBody: { padding: spacing[3], gap: spacing[2] },
  cardTitle: { fontFamily: fonts.sans, fontSize: fontSizes.sm, color: colors.foreground, lineHeight: 18, fontWeight: "600" },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  lessons: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.mutedForeground },
  price: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    color: colors.neonLime,
    fontWeight: "bold",
    letterSpacing: 0.5,
    backgroundColor: "rgba(74, 222, 128, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(74, 222, 128, 0.3)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: spacing[4] },
  emptyText: { fontFamily: fonts.body, fontSize: fontSizes.base, color: colors.mutedForeground },
});
