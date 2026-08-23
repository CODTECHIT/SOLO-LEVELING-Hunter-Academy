import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { ArrowLeft, Receipt, Download, Share2, CheckCircle2, Shield } from "lucide-react-native";
import { useRouter } from "expo-router";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { SafeScreen } from "@/components/layout/SafeScreen";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/authStore";
import { cyberAlert } from "@/store/alertStore";
import { colors, fonts, fontSizes, spacing, radii } from "@/theme";
import { api } from "@/lib/api";

type Purchase = {
  id: string;
  courseTitle: string;
  amount: number;
  currency: string;
  createdAt: string;
  status: string;
  razorpayPaymentId?: string | null;
  razorpayOrderId?: string | null;
};

export default function PurchasesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

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

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/profile");
    }
  };

  const handleDownloadReceipt = async (purchase: Purchase) => {
    try {
      setDownloadingId(purchase.id);

      const orderId = purchase.id;
      const displayOrderId = purchase.razorpayOrderId || orderId;
      const displayPaymentId = purchase.razorpayPaymentId || `PAY-${orderId.substring(0, 10).toUpperCase()}`;
      const courseTitle = purchase.courseTitle || "Hunter Academy Course";
      const amountFormatted = purchase.amount.toLocaleString("en-IN");
      const currency = purchase.currency || "INR";
      const purchaseDate = new Date(purchase.createdAt).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const purchaseTime = new Date(purchase.createdAt).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const studentName = user?.name || "Hunter Student";
      const studentEmail = user?.email || "student@cybertech.academy";

      const receiptHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Payment Receipt - ${orderId.split("-")[0]}</title>
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background-color: #ffffff;
      padding: 30px 25px;
      line-height: 1.5;
    }
    .receipt-container {
      max-width: 700px;
      margin: 0 auto;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 35px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 20px;
      margin-bottom: 25px;
    }
    .brand-logo {
      font-size: 20px;
      font-weight: 900;
      letter-spacing: 2px;
      color: #090d16;
      text-transform: uppercase;
    }
    .brand-sub {
      font-size: 11px;
      color: #64748b;
      letter-spacing: 1px;
      font-weight: 600;
      text-transform: uppercase;
      margin-top: 2px;
    }
    .invoice-title-block {
      text-align: right;
    }
    .invoice-title {
      font-size: 22px;
      font-weight: 800;
      color: #090d16;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .invoice-tag {
      display: inline-block;
      background: #ecfdf5;
      color: #059669;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 9999px;
      border: 1px solid #a7f3d0;
      margin-top: 4px;
    }
    .info-grid {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      gap: 20px;
    }
    .info-col {
      flex: 1;
    }
    .info-label {
      font-size: 11px;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 700;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .info-val-strong {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
    }
    .info-val {
      font-size: 13px;
      color: #334155;
      margin-top: 2px;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 25px;
    }
    .table th {
      background-color: #f8fafc;
      color: #475569;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 700;
      padding: 12px 14px;
      text-align: left;
      border-top: 1px solid #e2e8f0;
      border-bottom: 1px solid #e2e8f0;
    }
    .table td {
      padding: 16px 14px;
      border-bottom: 1px solid #f1f5f9;
      font-size: 14px;
      color: #1e293b;
    }
    .table .amount-col {
      text-align: right;
      font-weight: 700;
    }
    .course-meta {
      font-size: 12px;
      color: #64748b;
      margin-top: 3px;
    }
    .summary-box {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 30px;
    }
    .summary-table {
      width: 280px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 13px;
      color: #64748b;
    }
    .summary-row.total {
      border-top: 2px solid #0f172a;
      margin-top: 8px;
      padding-top: 10px;
      font-size: 17px;
      font-weight: 800;
      color: #0f172a;
    }
    .verification-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px 20px;
      margin-bottom: 25px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .verification-title {
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
    }
    .verification-sub {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }
    .verified-stamp {
      font-size: 12px;
      font-weight: 800;
      color: #059669;
      letter-spacing: 1px;
      text-transform: uppercase;
      border: 1.5px solid #059669;
      padding: 4px 10px;
      border-radius: 6px;
    }
    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 20px;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="header">
      <div>
        <div class="brand-logo">CYBER TECH ACADEMY</div>
        <div class="brand-sub">Hunters Training & Certification Guild</div>
      </div>
      <div class="invoice-title-block">
        <div class="invoice-title">Official Receipt</div>
        <div class="invoice-tag">✔ PAID & CONFIRMED</div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-col">
        <div class="info-label">Billed To</div>
        <div class="info-val-strong">${escapeHtml(studentName)}</div>
        <div class="info-val">${escapeHtml(studentEmail)}</div>
      </div>
      <div class="info-col" style="text-align: right;">
        <div class="info-label">Order Details</div>
        <div class="info-val"><strong>Date:</strong> ${purchaseDate} ${purchaseTime}</div>
        <div class="info-val"><strong>Order ID:</strong> ${escapeHtml(displayOrderId)}</div>
        <div class="info-val"><strong>Payment ID:</strong> ${escapeHtml(displayPaymentId)}</div>
      </div>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align: center;">Qty</th>
          <th class="amount-col">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <div style="font-weight: 700;">${escapeHtml(courseTitle)}</div>
            <div class="course-meta">Full Course Access • Lifetime Curriculum & Official Certificate</div>
          </td>
          <td style="text-align: center;">1</td>
          <td class="amount-col">₹${amountFormatted} ${currency}</td>
        </tr>
      </tbody>
    </table>

    <div class="summary-box">
      <div class="summary-table">
        <div class="summary-row">
          <span>Subtotal</span>
          <span>₹${amountFormatted} ${currency}</span>
        </div>
        <div class="summary-row">
          <span>Tax (Included)</span>
          <span>₹0.00</span>
        </div>
        <div class="summary-row total">
          <span>Total Paid</span>
          <span>₹${amountFormatted} ${currency}</span>
        </div>
      </div>
    </div>

    <div class="verification-box">
      <div>
        <div class="verification-title">Razorpay Secure Payment Gateway</div>
        <div class="verification-sub">Transaction verified and logged into Cyber Tech Ledger.</div>
      </div>
      <div class="verified-stamp">AUTH VERIFIED</div>
    </div>

    <div class="footer">
      <p>This is a computer-generated official receipt. Thank you for training with Cyber Tech Academy. Arise, Hunter.</p>
    </div>
  </div>
</body>
</html>
      `;

      // Generate PDF
      const { uri } = await Print.printToFileAsync({
        html: receiptHtml,
        base64: false,
      });

      // Share / Download PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: `Download Receipt - ${courseTitle}`,
          UTI: "com.adobe.pdf",
        });
      } else {
        cyberAlert("Receipt Ready", `Receipt PDF generated successfully. File stored in sandbox: ${uri}`, undefined, "success");
      }
    } catch (error: any) {
      console.error("Receipt generation error:", error);
      cyberAlert("Download Failed", error?.message || "Could not generate receipt PDF.", undefined, "error");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <SafeScreen>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.8}>
          <ArrowLeft color={colors.foreground} size={20} />
        </TouchableOpacity>
        <Text style={styles.title}>Purchase History</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchPurchases}
            tintColor={colors.neonCyan}
            colors={[colors.neonCyan, colors.neonPurple]}
          />
        }
      >
        {purchases.length === 0 && !loading ? (
          <View style={styles.emptyState}>
            <Receipt color={colors.mutedForeground} size={48} />
            <Text style={styles.emptyTitle}>No purchases yet</Text>
            <Text style={styles.emptyDesc}>
              When you enroll in a course, your official receipts will appear here.
            </Text>
            <Button
              label="Browse Courses"
              variant="secondary"
              style={{ marginTop: spacing[6] }}
              onPress={() => router.push("/(tabs)/courses")}
            />
          </View>
        ) : (
          purchases.map((purchase) => {
            const isDownloadingThis = downloadingId === purchase.id;
            return (
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
                      {new Date(purchase.createdAt).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status</Text>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>{purchase.status}</Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.receiptBtn}
                  activeOpacity={0.8}
                  onPress={() => handleDownloadReceipt(purchase)}
                  disabled={isDownloadingThis}
                >
                  {isDownloadingThis ? (
                    <ActivityIndicator size="small" color={colors.neonCyan} />
                  ) : (
                    <>
                      <Download color={colors.neonCyan} size={16} />
                      <Text style={styles.receiptText}>Download Official PDF Receipt</Text>
                    </>
                  )}
                </TouchableOpacity>
              </Card>
            );
          })
        )}
      </ScrollView>
    </SafeScreen>
  );
}

function escapeHtml(str: string): string {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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
    fontFamily: fonts.sans,
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
