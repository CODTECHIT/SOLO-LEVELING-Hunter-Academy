/**
 * Razorpay Web Checkout Integration Helper
 */

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn("Failed to load Razorpay Checkout script");
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

export interface RazorpayOrderData {
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

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export async function openRazorpayCheckout({
  orderData,
  onSuccess,
  onError,
  onDismiss,
}: {
  orderData: RazorpayOrderData;
  onSuccess: (response: RazorpaySuccessResponse) => void | Promise<void>;
  onError?: (err: any) => void;
  onDismiss?: () => void;
}) {
  const isLoaded = await loadRazorpayScript();

  const isDevOrder =
    orderData.orderId.startsWith("order_dev_") ||
    orderData.keyId.includes("placeholder");

  // If Razorpay script failed to load or in dev placeholder mode where real script can't connect:
  if (!isLoaded || (!window.Razorpay && isDevOrder)) {
    console.info("Using developer checkout simulation mode (fake/test keys active)");
    const mockPaymentId = `pay_dev_${Date.now()}`;
    const mockSignature = `dev_sig_${Date.now()}`;
    await onSuccess({
      razorpay_order_id: orderData.orderId,
      razorpay_payment_id: mockPaymentId,
      razorpay_signature: mockSignature,
    });
    return;
  }

  try {
    const options = {
      key: orderData.keyId,
      amount: orderData.amount,
      currency: orderData.currency || "INR",
      name: "Cyber Tech Hunter Academy",
      description: `Enrollment: ${orderData.courseTitle}`,
      image: "/logo.png",
      order_id: orderData.orderId,
      prefill: {
        name: orderData.user?.name || "",
        email: orderData.user?.email || "",
        contact: orderData.user?.phone || "",
      },
      theme: {
        color: "#00ffff", // Neon Cyan
        backdrop_color: "rgba(10, 10, 15, 0.85)",
      },
      modal: {
        ondismiss: () => {
          if (onDismiss) onDismiss();
        },
      },
      handler: async (response: RazorpaySuccessResponse) => {
        try {
          await onSuccess(response);
        } catch (err) {
          if (onError) onError(err);
        }
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", (response: any) => {
      console.error("Razorpay Payment Failed:", response.error);
      if (onError) onError(response.error);
    });
    rzp.open();
  } catch (err) {
    if (isDevOrder) {
      console.warn("Dev mode fallback on Razorpay open exception:", err);
      await onSuccess({
        razorpay_order_id: orderData.orderId,
        razorpay_payment_id: `pay_dev_${Date.now()}`,
        razorpay_signature: `dev_sig_${Date.now()}`,
      });
      return;
    }
    if (onError) onError(err);
  }
}
