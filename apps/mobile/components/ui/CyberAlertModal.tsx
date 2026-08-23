import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  Platform,
} from "react-native";
import {
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  Sparkles,
  Info,
  X,
  ShieldAlert,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, fonts, fontSizes, spacing, radii } from "@/theme";
import { useAlertStore, CyberAlertButton, CyberAlertType } from "@/store/alertStore";

const { width } = Dimensions.get("window");

export function CyberAlertModal() {
  const { alert, hideAlert } = useAlertStore();

  if (!alert) return null;

  const { title, message, type = "info", buttons } = alert;

  const getTypeDetails = () => {
    switch (type) {
      case "success":
        return {
          icon: CheckCircle2,
          color: colors.neonLime,
          borderColor: "rgba(163, 230, 53, 0.4)",
          glowBg: "rgba(163, 230, 53, 0.12)",
          badgeText: "SYSTEM SUCCESS",
        };
      case "error":
        return {
          icon: AlertOctagon,
          color: colors.destructive,
          borderColor: "rgba(239, 68, 68, 0.4)",
          glowBg: "rgba(239, 68, 68, 0.12)",
          badgeText: "SYSTEM ALERT",
        };
      case "warning":
        return {
          icon: AlertTriangle,
          color: colors.neonAmber,
          borderColor: "rgba(251, 191, 36, 0.4)",
          glowBg: "rgba(251, 191, 36, 0.12)",
          badgeText: "SECURITY NOTICE",
        };
      case "info":
      default:
        return {
          icon: Sparkles,
          color: colors.neonCyan,
          borderColor: "rgba(103, 232, 249, 0.4)",
          glowBg: "rgba(103, 232, 249, 0.12)",
          badgeText: "HUNTER TRANSMISSION",
        };
    }
  };

  const details = getTypeDetails();
  const IconComp = details.icon;

  const handleButtonPress = (btn?: CyberAlertButton) => {
    hideAlert();
    if (btn?.onPress) {
      btn.onPress();
    }
  };

  const renderButtons = () => {
    if (!buttons || buttons.length === 0) {
      return (
        <TouchableOpacity
          style={[styles.btn, styles.primaryBtn, { borderColor: details.color }]}
          activeOpacity={0.8}
          onPress={() => handleButtonPress()}
        >
          <Text style={styles.primaryBtnText}>Acknowledge</Text>
        </TouchableOpacity>
      );
    }

    if (buttons.length === 1) {
      const btn = buttons[0];
      const isDestructive = btn.style === "destructive";
      return (
        <TouchableOpacity
          style={[
            styles.btn,
            styles.primaryBtn,
            {
              borderColor: isDestructive ? colors.destructive : details.color,
              backgroundColor: isDestructive ? colors.destructive : colors.neonPurple,
            },
          ]}
          activeOpacity={0.8}
          onPress={() => handleButtonPress(btn)}
        >
          <Text style={styles.primaryBtnText}>{btn.text}</Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.buttonRow}>
        {buttons.map((btn, idx) => {
          const isCancel = btn.style === "cancel";
          const isDestructive = btn.style === "destructive";

          return (
            <TouchableOpacity
              key={idx}
              style={[
                styles.btn,
                styles.multiBtn,
                isCancel
                  ? styles.cancelBtn
                  : isDestructive
                  ? styles.destructiveBtn
                  : styles.primaryBtn,
                !isCancel && !isDestructive && { borderColor: details.color },
              ]}
              activeOpacity={0.8}
              onPress={() => handleButtonPress(btn)}
            >
              <Text
                style={[
                  isCancel
                    ? styles.cancelBtnText
                    : isDestructive
                    ? styles.destructiveBtnText
                    : styles.primaryBtnText,
                ]}
                numberOfLines={1}
              >
                {btn.text}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={hideAlert}
    >
      <TouchableWithoutFeedback onPress={hideAlert}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.dialogCard, { borderColor: details.borderColor }]}>
              {/* Top ambient glow */}
              <LinearGradient
                colors={[details.glowBg, "transparent"]}
                style={styles.cardGlow}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
              />

              {/* Close X button */}
              <TouchableOpacity
                style={styles.closeBtn}
                activeOpacity={0.7}
                onPress={hideAlert}
              >
                <X color={colors.mutedForeground} size={18} />
              </TouchableOpacity>

              {/* Icon */}
              <View style={[styles.iconBox, { backgroundColor: details.glowBg, borderColor: details.color }]}>
                <IconComp color={details.color} size={28} />
              </View>

              {/* Badge */}
              <View style={[styles.badge, { borderColor: details.color }]}>
                <Text style={[styles.badgeText, { color: details.color }]}>
                  {details.badgeText}
                </Text>
              </View>

              {/* Title */}
              <Text style={styles.title}>{title}</Text>

              {/* Message */}
              {message ? <Text style={styles.message}>{message}</Text> : null}

              {/* Action Buttons */}
              <View style={styles.footer}>{renderButtons()}</View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(4, 6, 15, 0.85)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing[4],
  },
  dialogCard: {
    width: Math.min(width - 40, 380),
    backgroundColor: "#101222",
    borderRadius: radii.xl,
    borderWidth: 1.5,
    padding: spacing[5],
    alignItems: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 20,
  },
  cardGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  closeBtn: {
    position: "absolute",
    top: spacing[3],
    right: spacing[3],
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    zIndex: 10,
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[3],
  },
  badge: {
    borderWidth: 1,
    paddingHorizontal: spacing[3],
    paddingVertical: 2,
    borderRadius: radii.full,
    marginBottom: spacing[2],
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  badgeText: {
    fontFamily: fonts.display,
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSizes.lg,
    color: colors.foreground,
    textAlign: "center",
    marginBottom: spacing[2],
    letterSpacing: 0.5,
  },
  message: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.mutedForeground,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: spacing[5],
    paddingHorizontal: spacing[1],
  },
  footer: {
    width: "100%",
    marginTop: spacing[1],
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing[2],
    width: "100%",
  },
  btn: {
    height: 44,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[4],
  },
  multiBtn: {
    flex: 1,
  },
  primaryBtn: {
    backgroundColor: colors.neonPurple,
    borderWidth: 1,
    borderColor: colors.neonCyan,
  },
  primaryBtnText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.md,
    color: colors.white,
    letterSpacing: 0.5,
  },
  cancelBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.md,
    color: colors.mutedForeground,
  },
  destructiveBtn: {
    backgroundColor: colors.destructive,
    borderWidth: 1,
    borderColor: colors.destructive,
  },
  destructiveBtnText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.md,
    color: colors.white,
  },
});
