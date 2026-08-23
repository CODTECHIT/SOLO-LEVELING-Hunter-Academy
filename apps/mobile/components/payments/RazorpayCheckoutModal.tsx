import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from "react-native";
import { WebView } from "react-native-webview";
import { X, ShieldCheck } from "lucide-react-native";
import { colors, fonts, fontSizes, spacing, radii } from "@/theme";

export interface MobileRazorpayOrderData {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  courseTitle: string;
  courseDescription?: string | null;
  user?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

export interface MobileRazorpaySuccessPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayCheckoutModalProps {
  visible: boolean;
  orderData: MobileRazorpayOrderData | null;
  onClose: () => void;
  onSuccess: (payload: MobileRazorpaySuccessPayload) => void;
  onFailure?: (error: any) => void;
}

export function RazorpayCheckoutModal({
  visible,
  orderData,
  onClose,
  onSuccess,
  onFailure,
}: RazorpayCheckoutModalProps) {
  if (!orderData) return null;

  const isDevOrder =
    orderData.orderId.startsWith("order_dev_") ||
    orderData.keyId.includes("placeholder");

  const checkoutHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Cyber Tech Razorpay Checkout</title>
  <script src="https://checkout.razorpay.com/v1/checkout.js" onload="initCheckout()"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #1a1629;
      color: #f0eff8;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
      text-align: center;
    }
    .card {
      background: #1e1d3a;
      border: 1px solid #3e3a60;
      border-radius: 16px;
      padding: 24px;
      width: 100%;
      max-width: 360px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    }
    .title {
      font-size: 18px;
      font-weight: 700;
      color: #67e8f9;
      margin-bottom: 8px;
    }
    .desc {
      font-size: 14px;
      color: #7878a8;
      margin-bottom: 20px;
    }
    .price {
      font-size: 28px;
      font-weight: 800;
      color: #a3e635;
      margin-bottom: 24px;
    }
    .btn {
      background: linear-gradient(135deg, #b060f0, #67e8f9);
      color: #000;
      border: none;
      border-radius: 10px;
      padding: 14px 20px;
      font-size: 16px;
      font-weight: 700;
      width: 100%;
      cursor: pointer;
      margin-top: 12px;
    }
    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid rgba(103, 232, 249, 0.2);
      border-top-color: #67e8f9;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <div class="title">${orderData.courseTitle}</div>
    <div class="desc">Connecting to Razorpay Secure Gateway...</div>
    <div class="price">₹${((orderData.amount || 0) / 100).toLocaleString("en-IN")}</div>
    <button class="btn" id="pay-btn" onclick="initCheckout()">
      Open Razorpay Gateway
    </button>
  </div>

  <script>
    var rzpInstance = null;
    var attempts = 0;

    function sendMessage(msg) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(msg));
      }
    }

    function initCheckout() {
      if (!window.Razorpay) {
        attempts++;
        if (attempts < 30) {
          setTimeout(initCheckout, 200);
        } else {
          console.error("Razorpay script timeout");
        }
        return;
      }

      try {
        var options = {
          key: ${JSON.stringify(orderData.keyId)},
          amount: ${orderData.amount},
          currency: ${JSON.stringify(orderData.currency || "INR")},
          name: "Cyber Tech Hunter Academy",
          description: ${JSON.stringify("Enrollment: " + orderData.courseTitle)},
          order_id: ${JSON.stringify(orderData.orderId)},
          prefill: {
            name: ${JSON.stringify(orderData.user?.name || "")},
            email: ${JSON.stringify(orderData.user?.email || "")},
            contact: ${JSON.stringify(orderData.user?.phone || "")}
          },
          theme: {
            color: "#67e8f9",
            backdrop_color: "rgba(26, 22, 41, 0.9)"
          },
          modal: {
            ondismiss: function() {
              sendMessage({ type: 'PAYMENT_DISMISSED' });
            }
          },
          handler: function(response) {
            sendMessage({
              type: 'PAYMENT_SUCCESS',
              payload: response
            });
          }
        };

        rzpInstance = new window.Razorpay(options);
        rzpInstance.on('payment.failed', function(res) {
          sendMessage({
            type: 'PAYMENT_ERROR',
            payload: res.error || res
          });
        });
        rzpInstance.open();
      } catch (err) {
        console.error("Razorpay open error:", err);
      }
    }

    // Auto-launch checkout once DOM and script are ready
    if (document.readyState === 'complete') {
      setTimeout(initCheckout, 300);
    } else {
      window.addEventListener('load', function() {
        setTimeout(initCheckout, 300);
      });
    }
  </script>
</body>
</html>
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "PAYMENT_SUCCESS") {
        onSuccess(data.payload);
      } else if (data.type === "PAYMENT_ERROR") {
        if (onFailure) onFailure(data.payload);
      } else if (data.type === "PAYMENT_DISMISSED") {
        onClose();
      }
    } catch (e) {
      console.warn("Failed to parse WebView message:", e);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <ShieldCheck color={colors.neonCyan} size={20} />
            <Text style={styles.headerTitle}>Secure Razorpay Checkout</Text>
          </View>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <X color={colors.foreground} size={22} />
          </TouchableOpacity>
        </View>

        {/* WebView Bridge */}
        <WebView
          originWhitelist={["*"]}
          source={{ html: checkoutHtml }}
          onMessage={handleMessage}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.neonCyan} size="large" />
            </View>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  headerTitle: {
    fontSize: fontSizes.base,
    fontFamily: fonts.display,
    color: colors.foreground,
    fontWeight: "700",
  },
  closeBtn: {
    padding: spacing[1],
  },
  webview: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
});
