import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from "react-native";
import { ArrowLeft, Receipt, ExternalLink } from "lucide-react-native";
import { useRouter } from "expo-router";
import { SafeScreen } from "@/components/layout/SafeScreen";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { colors, fonts, fontSizes, spacing, radii } from "@/theme";
import api from "@/lib/api";

type Purchase = {
  id: string;
  courseTitle: string;
  amount: number;
  currency: string;
  createdAt: string;
  status: string;
};

export default function PurchasesScreen() {
  const router = useRouter();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const res = await api.get("/users/purchases");
      setPurchases(res.data);
    } catch (error) {
      console.error("Failed to fetch purchases", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  return (
    <SafeScreen>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft color={colors.foreground} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Purchase History</Text>
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchPurchases} tintColor={colors.neonCyan} />}
      >
        {purchases.length === 0 && !loading ? (
          <View style={styles.emptyState}>
            <Receipt color={colors.mutedForeground} size={48} />
            <Text style={styles.emptyTitle}>No purchases yet</Text>
            <Text style={styles.emptyDesc}>When you enroll in a course, your receipts will appear here.</Text>
            <Button 
              label="Browse Courses" 
              variant="outline"
              style={{ marginTop: spacing[6] }}
              onPress={() => router.push("/(tabs)/courses")}
            />
          </View>
        ) : (
          purchases.map(purchase => (
            <Card key={purchase.id} style={styles.purchaseCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.courseTitle}>{purchase.courseTitle}</Text>
                <Text style={styles.amount}>₹{purchase.amount.toLocaleString("en-IN")}</Text>
              </View>
              
              <View style={styles.cardDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Order ID</Text>
                  <Text style={styles.detailValue}>{purchase.id.split("-")[0]}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>
                    {new Date(purchase.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{purchase.status}</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity style={styles.receiptBtn}>
                <ExternalLink color={colors.neonCyan} size={16} />
                <Text style={styles.receiptText}>Download Receipt</Text>
              </TouchableOpacity>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[4],
  },
  backBtn: {
    padding: spacing[2],
    backgroundColor: colors.surface2,
    borderRadius: radii.full,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
    color: colors.foreground,
    letterSpacing: 1,
  },
  content: {
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[12],
  },
  emptyTitle: {
    fontFamily: fonts.display,
    fontSize: fontSizes.lg,
    color: colors.foreground,
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
  emptyDesc: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    textAlign: "center",
  },
  purchaseCard: {
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing[4],
  },
  courseTitle: {
    fontFamily: fonts.display,
    fontSize: fontSizes.base,
    color: colors.foreground,
    flex: 1,
    marginRight: spacing[4],
  },
  amount: {
    fontFamily: fonts.display,
    fontSize: fontSizes.lg,
    color: colors.neonCyan,
  },
  cardDetails: {
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
  },
  detailValue: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.sm,
    color: colors.foreground,
  },
  statusBadge: {
    backgroundColor: colors.neonCyan + "20",
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  statusText: {
    fontFamily: fonts.sans,
    fontSize: 10,
    color: colors.neonCyan,
    textTransform: "uppercase",
  },
  receiptBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  receiptText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.neonCyan,
  },
});
