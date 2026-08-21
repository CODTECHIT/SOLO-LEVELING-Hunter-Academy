import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { BookOpen, Search, X } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeScreen } from "@/components/layout/SafeScreen";
import { Badge } from "@/components/ui/Badge";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { useCatalog } from "@/hooks/useCourses";
import { colors, fonts, fontSizes, spacing, radii } from "@/theme";

export default function CoursesScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("");

  const { data: catalog, isLoading } = useCatalog();

  const courses = catalog?.courses ?? [];
  const categories = catalog?.categories ?? [];

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) || 
                          c.description.toLowerCase().includes(search.toLowerCase());
      const matchCat = activeCategory ? c.category.id === activeCategory : true;
      return matchSearch && matchCat;
    });
  }, [courses, search, activeCategory]);

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
        {/* Category filter chips */}
        <FlatList
          horizontal
          data={[{ id: "", name: "All" }, ...categories]}
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
    borderColor: colors.border,
    overflow: "hidden",
    shadowColor: colors.neonPurple,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  cardThumb: { height: 110, position: "relative" },
  thumbImg: { width: "100%", height: "100%", resizeMode: "cover" },
  thumbGrad: { flex: 1, alignItems: "center", justifyContent: "center" },
  typeTag: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: colors.background + "cc",
    borderRadius: radii.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  typeTagText: { fontFamily: fonts.sans, fontSize: 9, color: colors.neonAmber, letterSpacing: 1 },
  cardBody: { padding: spacing[3], gap: spacing[2] },
  cardTitle: { fontFamily: fonts.sans, fontSize: fontSizes.sm, color: colors.foreground, lineHeight: 18 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  lessons: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.mutedForeground },
  price: { fontFamily: fonts.sans, fontSize: fontSizes.xs, color: colors.neonAmber },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: spacing[4] },
  emptyText: { fontFamily: fonts.body, fontSize: fontSizes.base, color: colors.mutedForeground },
});
