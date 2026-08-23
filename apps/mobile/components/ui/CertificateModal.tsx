import React, { useState, useEffect } from "react";
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
  Image,
  ImageBackground,
} from "react-native";
import { Award, Download, Share2, X, Shield, CheckCircle2, RefreshCw } from "lucide-react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { cyberAlert } from "@/store/alertStore";
import { colors, fonts, fontSizes, spacing, radii } from "@/theme";
import { api } from "@/lib/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export interface CertificateData {
  id: string;
  certificateNo: string;
  issueDate: string | Date;
  user?: { id: string; name: string; email: string };
  course?: { id: string; title: string };
}

export interface CertificateTemplateData {
  id?: string;
  title?: string;
  imageUrl?: string | null;
  signatoryName?: string;
  signatoryTitle?: string;
  signatureUrl?: string | null;
  sealUrl?: string | null;
}

interface CertificateModalProps {
  visible: boolean;
  onClose: () => void;
  userName?: string;
  courseTitle?: string;
  courseId: string;
  certificate?: CertificateData | null;
  template?: CertificateTemplateData | null;
}

export function CertificateModal({
  visible,
  onClose,
  userName = "Hunter",
  courseTitle = "Mastery Pathway",
  courseId,
  certificate: initialCert,
  template: initialTemplate,
}: CertificateModalProps) {
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [certData, setCertData] = useState<CertificateData | null>(initialCert || null);
  const [templateData, setTemplateData] = useState<CertificateTemplateData | null>(
    initialTemplate || null,
  );

  useEffect(() => {
    if (visible && courseId) {
      fetchCertificateAndTemplate();
    }
  }, [visible, courseId]);

  const fetchCertificateAndTemplate = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/certificates/course/${courseId}`);
      if (res.data) {
        if (res.data.certificate) setCertData(res.data.certificate);
        if (res.data.template) setTemplateData(res.data.template);
      }
    } catch (err: any) {
      console.warn("Could not fetch remote certificate template:", err?.message);
    } finally {
      setLoading(false);
    }
  };

  const recipientName =
    certData?.user?.name || userName || "Student";
  const displayCourseTitle =
    certData?.course?.title || courseTitle || "Mastery Pathway";
  const certNumber =
    certData?.certificateNo ||
    `CTA-${courseId.slice(-6).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
  const issueDateFormatted = certData?.issueDate
    ? new Date(certData.issueDate).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });

  const signatory = templateData?.signatoryName || "Director of Cyber Tech Academy";
  const signatoryRole = templateData?.signatoryTitle || "Chief Instructor & Guildmaster";
  const bgImageUrl = templateData?.imageUrl?.trim() || null;
  const signatureImageUrl = templateData?.signatureUrl?.trim() || null;
  const sealImageUrl = templateData?.sealUrl?.trim() || null;

  // Generate high-resolution HTML for PDF export using the Admin's uploaded PNG Template
  const generateCertificateHtml = () => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Rajdhani:wght@600;700&family=Inter:wght@400;600;700&display=swap');
        @page {
          size: landscape;
          margin: 0;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          margin: 0;
          padding: 0;
          background: #050810;
          color: #ffffff;
          font-family: 'Inter', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
        }
        .cert-wrapper {
          position: relative;
          width: 1000px;
          height: 625px;
          border-radius: 12px;
          overflow: hidden;
          background: ${
            bgImageUrl
              ? `url('${bgImageUrl}') no-repeat center center / cover`
              : `linear-gradient(135deg, #090d1a 0%, #0d1326 50%, #060913 100%)`
          };
          border: ${bgImageUrl ? "none" : "3px solid #00f3ff"};
          box-shadow: 0 0 50px rgba(0, 243, 255, 0.3);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 40px 50px;
          text-align: center;
        }
        ${
          !bgImageUrl
            ? `
        .cert-wrapper::before {
          content: "";
          position: absolute;
          inset: 15px;
          border: 1px dashed rgba(168, 85, 247, 0.4);
          border-radius: 8px;
          pointer-events: none;
        }
        `
            : ""
        }
        .cert-header {
          position: relative;
          z-index: 10;
        }
        .cert-academy {
          font-family: 'Orbitron', sans-serif;
          font-size: 24px;
          font-weight: 900;
          color: #00f3ff;
          letter-spacing: 4px;
          text-transform: uppercase;
          text-shadow: 0 0 20px rgba(0, 243, 255, 0.5);
        }
        .cert-subtitle {
          font-family: 'Rajdhani', sans-serif;
          font-size: 13px;
          color: #a855f7;
          letter-spacing: 5px;
          text-transform: uppercase;
          margin-top: 4px;
          font-weight: 700;
        }
        .cert-title {
          font-family: 'Orbitron', sans-serif;
          font-size: 16px;
          color: #f1f5f9;
          letter-spacing: 2px;
          margin-top: 20px;
          text-transform: uppercase;
        }
        .cert-student-name {
          font-family: 'Orbitron', sans-serif;
          font-size: 32px;
          font-weight: 900;
          color: #00f3ff;
          margin: 12px 0 8px;
          letter-spacing: 2px;
          text-shadow: 0 0 25px rgba(0, 243, 255, 0.4);
        }
        .cert-divider {
          width: 260px;
          height: 2px;
          background: linear-gradient(90deg, transparent, #00f3ff, #a855f7, transparent);
          margin: 0 auto 12px;
        }
        .cert-desc {
          font-size: 13px;
          color: #cbd5e1;
          max-width: 680px;
          margin: 0 auto;
          line-height: 1.5;
        }
        .cert-course {
          color: #22c55e;
          font-weight: 700;
          font-size: 15px;
          font-family: 'Rajdhani', sans-serif;
          letter-spacing: 1px;
        }
        .cert-footer {
          position: relative;
          z-index: 10;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          padding-top: 15px;
          border-top: 1px solid rgba(255, 255, 255, 0.12);
        }
        .footer-col {
          text-align: left;
          font-size: 11px;
          color: #94a3b8;
        }
        .footer-col-right {
          text-align: right;
        }
        .cert-id-badge {
          color: #00f3ff;
          font-family: monospace;
          font-weight: bold;
          font-size: 12px;
        }
        .signature-box {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }
        .sig-img {
          height: 40px;
          object-fit: contain;
          margin-bottom: 4px;
        }
        .sig-name {
          font-size: 12px;
          font-weight: 700;
          color: #f8fafc;
        }
        .sig-title {
          font-size: 10px;
          color: #94a3b8;
        }
      </style>
    </head>
    <body>
      <div class="cert-wrapper">
        <div class="cert-header">
          <div class="cert-academy">CYBER TECH ACADEMY</div>
          <div class="cert-subtitle">Hunter Guild Certification of Mastery</div>
          <div class="cert-title">CERTIFICATE OF COMPLETION</div>
        </div>

        <div>
          <div class="cert-student-name">${recipientName}</div>
          <div class="cert-divider"></div>
          <div class="cert-desc">
            Has successfully conquered all required tactical lessons, combat challenges, and assessments in <span class="cert-course">${displayCourseTitle}</span>.
          </div>
        </div>

        <div class="cert-footer">
          <div class="footer-col">
            <div>Issued: <strong style="color:#f8fafc;">${issueDateFormatted}</strong></div>
            <div style="margin-top: 4px;">Certificate ID: <span class="cert-id-badge">${certNumber}</span></div>
            <div style="margin-top: 4px; color:#22c55e;">✔ Officially Authenticated</div>
          </div>

          <div class="footer-col footer-col-right">
            <div class="signature-box">
              ${
                signatureImageUrl
                  ? `<img src="${signatureImageUrl}" class="sig-img" alt="Signature" />`
                  : ""
              }
              <div class="sig-name">${signatory}</div>
              <div class="sig-title">${signatoryRole}</div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      const html = generateCertificateHtml();
      const { uri } = await Print.printToFileAsync({
        html,
        width: 1000,
        height: 625,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: `Download Certificate - ${displayCourseTitle}`,
          UTI: "com.adobe.pdf",
        });
      } else {
        cyberAlert("Certificate Ready", `Official certificate PDF generated successfully. File stored in sandbox: ${uri}`, undefined, "success");
      }
    } catch (err: any) {
      cyberAlert("Download Failed", err?.message ?? "Could not generate certificate PDF.", undefined, "error");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Award color={colors.neonCyan} size={22} />
              <Text style={styles.headerTitle}>Official Certificate</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X color={colors.mutedForeground} size={20} />
            </TouchableOpacity>
          </View>

          {/* Certificate Preview Card */}
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color={colors.neonCyan} size="large" />
                <Text style={styles.loadingText}>Fetching official certificate template...</Text>
              </View>
            ) : bgImageUrl ? (
              /* Admin Uploaded PNG Template Preview */
              <View style={styles.templateCardContainer}>
                <ImageBackground
                  source={{ uri: bgImageUrl }}
                  style={styles.templateBgImage}
                  imageStyle={styles.templateBgImageStyle}
                  resizeMode="cover"
                >
                  <View style={styles.templateOverlayContent}>
                    {/* Header */}
                    <View style={styles.templateTopSection}>
                      <View style={styles.certTopBadge}>
                        <Shield color={colors.neonCyan} size={14} />
                        <Text style={styles.certTopBadgeText}>VERIFIED GUILD CERTIFICATE</Text>
                      </View>
                      <Text style={styles.templateBrandTitle}>CYBER TECH ACADEMY</Text>
                      <Text style={styles.templateBrandSub}>CERTIFICATE OF COMPLETION</Text>
                    </View>

                    {/* Student Info */}
                    <View style={styles.templateMiddleSection}>
                      <Text style={styles.templatePresentedText}>PROUDLY PRESENTED TO</Text>
                      <Text style={styles.templateStudentName} numberOfLines={1}>
                        {recipientName}
                      </Text>
                      <View style={styles.templateDivider} />
                      <Text style={styles.templateCourseTitle} numberOfLines={2}>
                        {displayCourseTitle}
                      </Text>
                    </View>

                    {/* Footer Info */}
                    <View style={styles.templateBottomSection}>
                      <View>
                        <Text style={styles.templateMetaLabel}>ISSUE DATE</Text>
                        <Text style={styles.templateMetaVal}>{issueDateFormatted}</Text>
                        <Text style={styles.templateCertNo}>{certNumber}</Text>
                      </View>

                      <View style={styles.templateSignatoryBox}>
                        {signatureImageUrl && (
                          <Image
                            source={{ uri: signatureImageUrl }}
                            style={styles.signaturePreviewImg}
                            resizeMode="contain"
                          />
                        )}
                        <Text style={styles.templateSignatoryName}>{signatory}</Text>
                        <Text style={styles.templateSignatoryRole}>{signatoryRole}</Text>
                      </View>
                    </View>
                  </View>
                </ImageBackground>
              </View>
            ) : (
              /* Fallback Cyber Luxury Card */
              <View style={styles.certCard}>
                <View style={styles.certTopBadge}>
                  <Shield color={colors.neonCyan} size={16} />
                  <Text style={styles.certTopBadgeText}>OFFICIALLY VERIFIED</Text>
                </View>

                <Text style={styles.brandTitle}>CYBER TECH ACADEMY</Text>
                <Text style={styles.brandSubtitle}>CERTIFICATE OF COMPLETION</Text>

                <View style={styles.divider} />

                <Text style={styles.awardedTo}>PROUDLY PRESENTED TO</Text>
                <Text style={styles.studentName}>{recipientName}</Text>

                <Text style={styles.certDesc}>
                  For successfully mastering all lessons, tactical modules, and final assessments in:
                </Text>
                <Text style={styles.courseName}>{displayCourseTitle}</Text>

                <View style={styles.metaRow}>
                  <View>
                    <Text style={styles.metaLabel}>ISSUED DATE</Text>
                    <Text style={styles.metaVal}>{issueDateFormatted}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.metaLabel}>VERIFICATION ID</Text>
                    <Text style={[styles.metaVal, { color: colors.neonCyan }]}>{certNumber}</Text>
                  </View>
                </View>

                <View style={styles.verifiedRow}>
                  <CheckCircle2 color={colors.neonLime} size={16} />
                  <Text style={styles.verifiedText}>
                    Authenticated & Sealed by Cyber Tech Guild
                  </Text>
                </View>
              </View>
            )}

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
                    <Text style={styles.downloadBtnText}>Download / Share Official PDF</Text>
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
    justifyContent: "center",
    alignItems: "center",
    padding: spacing[4],
  },
  container: {
    width: "100%",
    maxHeight: "92%",
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.4)",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface2,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  headerTitle: {
    fontFamily: fonts.display,
    fontSize: fontSizes.md,
    color: colors.foreground,
  },
  closeBtn: {
    padding: spacing[1],
  },
  scrollContent: {
    padding: spacing[4],
    alignItems: "center",
  },
  loadingBox: {
    paddingVertical: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    marginTop: spacing[2],
  },
  // Template PNG Container
  templateCardContainer: {
    width: "100%",
    aspectRatio: 16 / 10,
    borderRadius: radii.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.neonPurple,
    marginBottom: spacing[4],
  },
  templateBgImage: {
    width: "100%",
    height: "100%",
  },
  templateBgImageStyle: {
    borderRadius: radii.lg,
  },
  templateOverlayContent: {
    flex: 1,
    backgroundColor: "rgba(5, 8, 16, 0.45)",
    padding: spacing[3],
    justifyContent: "space-between",
  },
  templateTopSection: {
    alignItems: "center",
  },
  templateBrandTitle: {
    fontFamily: fonts.display,
    fontSize: fontSizes.md,
    color: colors.neonCyan,
    letterSpacing: 2,
    marginTop: 4,
  },
  templateBrandSub: {
    fontFamily: fonts.sans,
    fontSize: 10,
    color: colors.neonPurple,
    letterSpacing: 2,
  },
  templateMiddleSection: {
    alignItems: "center",
  },
  templatePresentedText: {
    fontFamily: fonts.sans,
    fontSize: 9,
    color: colors.mutedForeground,
    letterSpacing: 1.5,
  },
  templateStudentName: {
    fontFamily: fonts.display,
    fontSize: fontSizes.lg,
    color: colors.neonCyan,
    textAlign: "center",
    marginTop: 2,
  },
  templateDivider: {
    width: 120,
    height: 1.5,
    backgroundColor: colors.neonCyan,
    marginVertical: 4,
    opacity: 0.6,
  },
  templateCourseTitle: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.neonLime,
    textAlign: "center",
  },
  templateBottomSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  templateMetaLabel: {
    fontFamily: fonts.sans,
    fontSize: 8,
    color: colors.mutedForeground,
  },
  templateMetaVal: {
    fontFamily: fonts.sans,
    fontSize: 10,
    color: colors.foreground,
  },
  templateCertNo: {
    fontFamily: fonts.sans,
    fontSize: 9,
    color: colors.neonCyan,
    marginTop: 2,
  },
  templateSignatoryBox: {
    alignItems: "flex-end",
  },
  signaturePreviewImg: {
    width: 60,
    height: 24,
    marginBottom: 2,
  },
  templateSignatoryName: {
    fontFamily: fonts.sans,
    fontSize: 10,
    color: colors.foreground,
  },
  templateSignatoryRole: {
    fontFamily: fonts.sans,
    fontSize: 8,
    color: colors.mutedForeground,
  },
  // Default Luxury Card
  certCard: {
    width: "100%",
    backgroundColor: colors.surface2,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.neonCyan,
    padding: spacing[6],
    alignItems: "center",
    marginBottom: spacing[4],
  },
  certTopBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    backgroundColor: "rgba(0, 243, 255, 0.1)",
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: "rgba(0, 243, 255, 0.3)",
    marginBottom: spacing[2],
  },
  certTopBadgeText: {
    fontFamily: fonts.sans,
    fontSize: 10,
    color: colors.neonCyan,
    letterSpacing: 1,
  },
  brandTitle: {
    fontFamily: fonts.display,
    fontSize: fontSizes.lg,
    color: colors.neonCyan,
    letterSpacing: 2,
  },
  brandSubtitle: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    color: colors.neonPurple,
    letterSpacing: 3,
    marginTop: 2,
  },
  divider: {
    width: "60%",
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing[3],
  },
  awardedTo: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    color: colors.mutedForeground,
    letterSpacing: 2,
  },
  studentName: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
    color: colors.foreground,
    marginVertical: spacing[1],
    textAlign: "center",
  },
  certDesc: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    textAlign: "center",
    marginTop: spacing[1],
  },
  courseName: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.md,
    color: colors.neonLime,
    textAlign: "center",
    marginTop: spacing[1],
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: spacing[6],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  metaLabel: {
    fontFamily: fonts.sans,
    fontSize: 10,
    color: colors.mutedForeground,
    letterSpacing: 1,
  },
  metaVal: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    color: colors.foreground,
    marginTop: 2,
  },
  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    marginTop: spacing[4],
  },
  verifiedText: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.neonLime,
  },
  actions: {
    width: "100%",
    marginTop: spacing[2],
  },
  downloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    backgroundColor: colors.neonCyan,
    borderRadius: radii.md,
    paddingVertical: spacing[4],
  },
  downloadBtnText: {
    fontFamily: fonts.display,
    fontSize: fontSizes.sm,
    color: colors.background,
  },
});
