import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Award, Download, Share2, X, Shield, CheckCircle2 } from "lucide-react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { colors, fonts, fontSizes, spacing, radii } from "@/theme";

interface CertificateModalProps {
  visible: boolean;
  onClose: () => void;
  userName: string;
  courseTitle: string;
  courseId: string;
  completedDate?: string;
}

export function CertificateModal({
  visible,
  onClose,
  userName,
  courseTitle,
  courseId,
  completedDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }),
}: CertificateModalProps) {
  const [downloading, setDownloading] = useState(false);
  const certId = `CTA-${courseId.slice(-6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const generateCertificateHtml = () => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Rajdhani:wght@600;700&display=swap');
        body {
          margin: 0;
          padding: 30px;
          background: #050810;
          color: #ffffff;
          font-family: 'Rajdhani', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 90vh;
        }
        .cert-card {
          width: 100%;
          max-width: 850px;
          background: linear-gradient(135deg, #0b0f19 0%, #050810 100%);
          border: 3px solid #00f3ff;
          box-shadow: 0 0 40px rgba(0, 243, 255, 0.4);
          border-radius: 20px;
          padding: 40px;
          text-align: center;
          position: relative;
        }
        .cert-header {
          font-family: 'Orbitron', sans-serif;
          font-size: 26px;
          font-weight: 900;
          color: #00f3ff;
          letter-spacing: 4px;
          text-transform: uppercase;
        }
        .cert-sub {
          font-size: 14px;
          color: #a855f7;
          letter-spacing: 6px;
          text-transform: uppercase;
          margin-top: 6px;
        }
        .cert-title {
          font-family: 'Orbitron', sans-serif;
          font-size: 20px;
          color: #ffffff;
          margin-top: 28px;
          letter-spacing: 2px;
        }
        .cert-name {
          font-family: 'Orbitron', sans-serif;
          font-size: 32px;
          font-weight: 900;
          color: #00f3ff;
          margin: 20px 0;
          letter-spacing: 2px;
          border-bottom: 2px solid rgba(0, 243, 255, 0.4);
          display: inline-block;
          padding-bottom: 8px;
        }
        .cert-body {
          font-size: 16px;
          color: #94a3b8;
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.6;
        }
        .course-highlight {
          color: #22c55e;
          font-weight: 700;
        }
        .cert-footer {
          margin-top: 36px;
          display: flex;
          justify-content: space-between;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 20px;
          font-size: 13px;
          color: #64748b;
        }
        .cert-id {
          color: #00f3ff;
          font-family: monospace;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="cert-card">
        <div class="cert-header">CYBER TECH ACADEMY</div>
        <div class="cert-sub">Hunter Guild Certification</div>
        <div class="cert-title">CERTIFICATE OF MASTERY & AWAKENING</div>
        <div class="cert-name">${userName}</div>
        <div class="cert-body">
          Has demonstrated exceptional cyber combat prowess, theoretical mastery, and successfully conquered all lessons and dungeon assessments in <span class="course-highlight">${courseTitle}</span>.
        </div>
        <div class="cert-footer">
          <div>Verified Date: <strong>${completedDate}</strong></div>
          <div>Certificate ID: <span class="cert-id">${certId}</span></div>
          <div>Rank: <strong>OFFICIAL GRADUATE</strong></div>
        </div>
      </div>
    </body>
    </html>
  `;

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      const html = generateCertificateHtml();
      const { uri } = await Print.printToFileAsync({ html });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          UTI: ".pdf",
          mimeType: "application/pdf",
          dialogTitle: `Download Certificate - ${courseTitle}`,
        });
      } else {
        Alert.alert("Success", `Certificate generated: ${uri}`);
      }
    } catch (err: any) {
      Alert.alert("Download Failed", err?.message ?? "Could not generate certificate");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Award color={colors.neonCyan} size={24} />
              <Text style={styles.headerTitle}>Hunter Certificate</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X color={colors.mutedForeground} size={20} />
            </TouchableOpacity>
          </View>

          {/* Certificate Preview Card */}
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.certCard}>
              <View style={styles.certTopBadge}>
                <Shield color={colors.neonCyan} size={16} />
                <Text style={styles.certTopBadgeText}>OFFICIALLY VERIFIED</Text>
              </View>

              <Text style={styles.brandTitle}>CYBER TECH ACADEMY</Text>
              <Text style={styles.brandSubtitle}>CERTIFICATE OF COMPLETION</Text>

              <View style={styles.divider} />

              <Text style={styles.awardedTo}>PROUDLY PRESENTED TO</Text>
              <Text style={styles.studentName}>{userName}</Text>

              <Text style={styles.certDesc}>
                For successfully mastering all lessons, tactical modules, and final assessments in:
              </Text>
              <Text style={styles.courseName}>{courseTitle}</Text>

              <View style={styles.metaRow}>
                <View>
                  <Text style={styles.metaLabel}>ISSUED DATE</Text>
                  <Text style={styles.metaVal}>{completedDate}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.metaLabel}>VERIFICATION ID</Text>
                  <Text style={[styles.metaVal, { color: colors.neonCyan }]}>{certId}</Text>
                </View>
              </View>

              <View style={styles.verifiedRow}>
                <CheckCircle2 color={colors.neonLime} size={16} />
                <Text style={styles.verifiedText}>
                  Authenticated & Sealed by Cyber Tech Guild
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.downloadBtn}
                activeOpacity={0.85}
                onPress={handleDownloadPdf}
                disabled={downloading}
              >
                {downloading ? (
                  <ActivityIndicator color={colors.background} size="small" />
                ) : (
                  <>
                    <Download color={colors.background} size={20} />
                    <Text style={styles.downloadBtnText}>Download / Save PDF</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii["2xl"],
    borderTopRightRadius: radii["2xl"],
    maxHeight: "90%",
    borderTopWidth: 1,
    borderColor: colors.neonCyan + "40",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  headerTitle: {
    fontFamily: fonts.display,
    fontSize: fontSizes.lg,
    color: colors.foreground,
    letterSpacing: 1,
  },
  closeBtn: {
    padding: 6,
    borderRadius: radii.full,
    backgroundColor: colors.surface2,
  },
  scrollContent: {
    padding: spacing[4],
    gap: spacing[4],
  },
  certCard: {
    backgroundColor: "#070a14",
    borderRadius: radii.xl,
    borderWidth: 2,
    borderColor: colors.neonCyan + "60",
    padding: spacing[5],
    alignItems: "center",
    shadowColor: colors.neonCyan,
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  certTopBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.neonCyan + "20",
    paddingHorizontal: spacing[3],
    paddingVertical: 4,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.neonCyan + "40",
    marginBottom: spacing[3],
  },
  certTopBadgeText: {
    fontFamily: fonts.sans,
    fontSize: 10,
    color: colors.neonCyan,
    fontWeight: "bold",
    letterSpacing: 1.5,
  },
  brandTitle: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
    color: colors.neonCyan,
    letterSpacing: 3,
    fontWeight: "900",
    textAlign: "center",
  },
  brandSubtitle: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    color: colors.neonPurple,
    letterSpacing: 4,
    marginTop: 2,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    width: "80%",
    backgroundColor: colors.border,
    marginVertical: spacing[4],
  },
  awardedTo: {
    fontFamily: fonts.sans,
    fontSize: 10,
    color: colors.mutedForeground,
    letterSpacing: 3,
    fontWeight: "700",
  },
  studentName: {
    fontFamily: fonts.display,
    fontSize: fontSizes["2xl"],
    color: colors.foreground,
    fontWeight: "900",
    letterSpacing: 1,
    marginVertical: spacing[2],
    textAlign: "center",
  },
  certDesc: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    textAlign: "center",
    marginTop: spacing[2],
  },
  courseName: {
    fontFamily: fonts.display,
    fontSize: fontSizes.base,
    color: colors.neonLime,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 4,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: spacing[5],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border + "80",
  },
  metaLabel: {
    fontFamily: fonts.sans,
    fontSize: 9,
    color: colors.mutedForeground,
    letterSpacing: 1,
  },
  metaVal: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    color: colors.foreground,
    fontWeight: "bold",
    marginTop: 2,
  },
  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing[4],
  },
  verifiedText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.neonLime,
  },
  actions: {
    marginTop: spacing[2],
    marginBottom: spacing[6],
  },
  downloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    backgroundColor: colors.neonCyan,
    paddingVertical: 14,
    borderRadius: radii.lg,
    shadowColor: colors.neonCyan,
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 6,
  },
  downloadBtnText: {
    fontFamily: fonts.display,
    fontSize: fontSizes.sm,
    color: "#050810",
    fontWeight: "bold",
    letterSpacing: 1,
  },
});
