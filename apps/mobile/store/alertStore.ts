import { create } from "zustand";

export type CyberAlertButton = {
  text: string;
  style?: "default" | "cancel" | "destructive" | "primary";
  onPress?: () => void;
};

export type CyberAlertType = "success" | "error" | "warning" | "info";

export type CyberAlertConfig = {
  title: string;
  message?: string;
  type?: CyberAlertType;
  buttons?: CyberAlertButton[];
};

type AlertState = {
  alert: CyberAlertConfig | null;
  showAlert: (config: CyberAlertConfig) => void;
  hideAlert: () => void;
};

export const useAlertStore = create<AlertState>((set) => ({
  alert: null,
  showAlert: (config) => set({ alert: config }),
  hideAlert: () => set({ alert: null }),
}));

export const cyberAlert = (
  title: string,
  message?: string,
  buttons?: CyberAlertButton[] | Array<{ text: string; onPress?: () => void; style?: any }>,
  type?: CyberAlertType
) => {
  // Infer type if not explicitly provided
  let inferredType: CyberAlertType = type || "info";
  const lowerTitle = title.toLowerCase();
  if (!type) {
    if (
      lowerTitle.includes("success") ||
      lowerTitle.includes("enrolled") ||
      lowerTitle.includes("confirmed") ||
      lowerTitle.includes("granted") ||
      lowerTitle.includes("completed") ||
      lowerTitle.includes("passed") ||
      lowerTitle.includes("sent") ||
      lowerTitle.includes("saved")
    ) {
      inferredType = "success";
    } else if (
      lowerTitle.includes("error") ||
      lowerTitle.includes("failed") ||
      lowerTitle.includes("invalid") ||
      lowerTitle.includes("rejected") ||
      lowerTitle.includes("denied")
    ) {
      inferredType = "error";
    } else if (
      lowerTitle.includes("warning") ||
      lowerTitle.includes("notice") ||
      lowerTitle.includes("required") ||
      lowerTitle.includes("mismatch") ||
      lowerTitle.includes("attention") ||
      lowerTitle.includes("alert")
    ) {
      inferredType = "warning";
    }
  }

  useAlertStore.getState().showAlert({
    title,
    message,
    type: inferredType,
    buttons: buttons as CyberAlertButton[],
  });
};
