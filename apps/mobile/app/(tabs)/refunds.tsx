import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from "react-native";
import { ArrowLeft, Receipt, AlertCircle } from "lucide-react-native";
import { useRouter } from "expo-router";
import { SafeScreen } from "@/components/layout/SafeScreen";
import { Card } from "@/components/ui/Card";
import { colors, fonts, fontSizes, spacing, radii } from "@/theme";
import { api } from "@/lib/api";

type Refund = {
  id: string;
  courseTitle: string;
  amount: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
};

export default function RefundsScreen() {
  const router = useRouter();
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      const res = await api.get("/users/refunds");
      setRefunds(res.data);
    } catch (error) {
      console.error("Failed to fetch refunds", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED": return colors.neonLime;
      case "REJECTED": return colors.destructive;
      case "PENDING":
      default:
        return colors.neonAmber;
    }
  };

  return (
    <SafeScreen>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft color={colors.foreground} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Refunds</Text>
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchRefunds} tintColor={colors.neonAmber} />}
      >
        <View style={styles.infoBanner}>
          <AlertCircle color={colors.neonAmber} size={20} />
          <Text style={styles.infoText}>
            Refunds are processed within 5-7 business days. You can request a refund within 7 days of purchase.
          </Text>
        </View>

        {refunds.length === 0 && !loading ? (
          <View style={styles.emptyState}>
            <Receipt color={colors.mutedForeground} size={48} />
            <Text style={styles.emptyTitle}>No refunds requested</Text>
            <Text style={styles.emptyDesc}>If you request a refund, its status will appear here.</Text>
          </View>
        ) : (
          refunds.map(refund => (
            <Card key={refund.id} style={styles.refundCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.courseTitle}>{refund.courseTitle}</Text>
                <Text style={styles.amount}>₹{refund.amount.toLocaleString("en-IN")}</Text>
              </View>
              
              <View style={styles.cardDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date Requested</Text>
                  <Text style={styles.detailValue}>
                    {new Date(refund.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(refund.status) + "20" }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(refund.status) }]}>{refund.status}</Text>
                  </View>
                </View>
                <View style={{ marginTop: spacing[2] }}>
                  <Text style={styles.detailLabel}>Reason</Text>
                  <Text style={styles.reasonText}>{refund.reason}</Text>
                </View>
              </View>
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
    paddingBottom: 110,
  },
  infoBanner: {
    flexDirection: "row",
    backgroundColor: colors.neonAmber + "10",
    borderWidth: 1,
    borderColor: colors.neonAmber + "30",
    padding: spacing[3],
    borderRadius: radii.lg,
    gap: spacing[3],
    marginBottom: spacing[6],
  },
  infoText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.foreground,
    lineHeight: 20,
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
  refundCard: {
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
    color: colors.foreground,
  },
  cardDetails: {
    gap: spacing[2],
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
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.foreground,
  },
  statusBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  statusText: {
    fontFamily: fonts.sans,
    fontSize: 10,
    textTransform: "uppercase",
  },
  reasonText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.foreground,
    marginTop: 4,
    backgroundColor: colors.surface2,
    padding: spacing[2],
    borderRadius: radii.md,
  },
});
