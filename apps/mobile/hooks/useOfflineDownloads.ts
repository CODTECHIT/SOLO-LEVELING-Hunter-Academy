import { create } from "zustand";
import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import { getCloudFrontUrl, getYouTubeVideoId } from "@/lib/cdn";

const OFFLINE_DIR = FileSystem.documentDirectory ? `${FileSystem.documentDirectory}cybertech_offline/` : "";
const INDEX_FILE = FileSystem.documentDirectory ? `${FileSystem.documentDirectory}cybertech_offline/index.json` : "";

export interface OfflineLesson {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  localUri: string;
  fileSize?: number;
  duration?: number;
  thumbnail?: string;
  downloadedAt: string;
}

interface OfflineStoreState {
  downloads: Record<string, OfflineLesson>;
  progressMap: Record<string, number>;
  initialized: boolean;
  init: () => Promise<void>;
  downloadLesson: (lesson: {
    id: string;
    title: string;
    courseId: string;
    courseTitle: string;
    videoUrl: string;
    duration?: number;
    thumbnail?: string;
  }) => Promise<void>;
  deleteDownload: (lessonId: string) => Promise<void>;
}

// Active resumable download handles (kept in memory outside reactive state)
const activeDownloaders: Record<string, FileSystem.DownloadResumable> = {};

export const useOfflineStore = create<OfflineStoreState>((set, get) => ({
  downloads: {},
  progressMap: {},
  initialized: false,

  init: async () => {
    if (Platform.OS === "web" || !FileSystem.documentDirectory) {
      set({ downloads: {}, initialized: true });
      return;
    }

    try {
      // Ensure directory exists
      const dirInfo = await FileSystem.getInfoAsync(OFFLINE_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(OFFLINE_DIR, { intermediates: true });
      }

      // Read index file
      const indexInfo = await FileSystem.getInfoAsync(INDEX_FILE);
      if (indexInfo.exists) {
        const raw = await FileSystem.readAsStringAsync(INDEX_FILE);
        if (raw) {
          const parsed = JSON.parse(raw) as Record<string, OfflineLesson>;
          const verified: Record<string, OfflineLesson> = {};
          
          for (const [id, item] of Object.entries(parsed)) {
            try {
              const fileInfo = await FileSystem.getInfoAsync(item.localUri);
              if (fileInfo.exists) {
                verified[id] = item;
              }
            } catch {
              // File inaccessible or corrupted
            }
          }
          set({ downloads: verified, initialized: true });
          return;
        }
      }
      set({ downloads: {}, initialized: true });
    } catch (err) {
      console.error("Failed to initialize offline downloads index:", err);
      set({ downloads: {}, initialized: true });
    }
  },

  downloadLesson: async (lesson) => {
    if (Platform.OS === "web" || !FileSystem.documentDirectory) {
      throw new Error("Offline downloads are only supported on native mobile devices (iOS/Android).");
    }

    if (getYouTubeVideoId(lesson.videoUrl)) {
      throw new Error("YouTube streamed videos cannot be saved for offline playback.");
    }

    const remoteUrl = getCloudFrontUrl(lesson.videoUrl);
    if (!remoteUrl) {
      throw new Error("Invalid video download source URL");
    }

    // Ensure directory exists
    const dirInfo = await FileSystem.getInfoAsync(OFFLINE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(OFFLINE_DIR, { intermediates: true });
    }

    const filename = `lesson_${lesson.id}_${Date.now()}.mp4`;
    const fileUri = `${OFFLINE_DIR}${filename}`;

    try {
      const downloadResumable = FileSystem.createDownloadResumable(
        remoteUrl,
        fileUri,
        {},
        (progress) => {
          const total = progress.totalBytesExpectedToWrite;
          const written = progress.totalBytesWritten;
          const pct = total > 0 ? Math.round((written / total) * 100) : 0;
          set((state) => ({
            progressMap: { ...state.progressMap, [lesson.id]: pct },
          }));
        },
      );

      activeDownloaders[lesson.id] = downloadResumable;

      const result = await downloadResumable.downloadAsync();
      if (result && result.uri) {
        const fileInfo = await FileSystem.getInfoAsync(result.uri);
        const newEntry: OfflineLesson = {
          id: lesson.id,
          courseId: lesson.courseId,
          courseTitle: lesson.courseTitle,
          title: lesson.title,
          localUri: result.uri,
          fileSize: (fileInfo as any).size || 0,
          duration: lesson.duration,
          thumbnail: lesson.thumbnail,
          downloadedAt: new Date().toISOString(),
        };

        const currentDownloads = get().downloads;
        const updated = { ...currentDownloads, [lesson.id]: newEntry };
        
        // Persist to file
        await FileSystem.writeAsStringAsync(INDEX_FILE, JSON.stringify(updated));
        set({ downloads: updated });
      }
    } catch (err: any) {
      console.error(`Download error for lesson ${lesson.id}:`, err);
      throw err;
    } finally {
      delete activeDownloaders[lesson.id];
      set((state) => {
        const nextProgress = { ...state.progressMap };
        delete nextProgress[lesson.id];
        return { progressMap: nextProgress };
      });
    }
  },

  deleteDownload: async (lessonId: string) => {
    if (Platform.OS === "web" || !FileSystem.documentDirectory) {
      return;
    }

    const item = get().downloads[lessonId];
    if (item?.localUri) {
      try {
        await FileSystem.deleteAsync(item.localUri, { idempotent: true });
      } catch (err) {
        console.error("Failed to delete offline file:", err);
      }
    }

    const currentDownloads = { ...get().downloads };
    delete currentDownloads[lessonId];

    try {
      await FileSystem.writeAsStringAsync(INDEX_FILE, JSON.stringify(currentDownloads));
    } catch (err) {
      console.error("Failed to update index file after deletion:", err);
    }

    set({ downloads: currentDownloads });
  },
}));

// Convenience hook that auto-initializes and provides selector access
export function useOfflineDownloads() {
  const downloads = useOfflineStore((s) => s.downloads);
  const progressMap = useOfflineStore((s) => s.progressMap);
  const initialized = useOfflineStore((s) => s.initialized);
  const init = useOfflineStore((s) => s.init);
  const downloadLesson = useOfflineStore((s) => s.downloadLesson);
  const deleteDownload = useOfflineStore((s) => s.deleteDownload);

  // Auto initialize on first consumption
  if (!initialized) {
    init().catch(() => {});
  }

  const isDownloaded = (lessonId: string) => Boolean(downloads[lessonId]?.localUri);
  const getOfflineUri = (lessonId: string) => downloads[lessonId]?.localUri || null;
  const isDownloading = (lessonId: string) => progressMap[lessonId] !== undefined;

  return {
    downloads,
    downloadedList: Object.values(downloads),
    isDownloaded,
    getOfflineUri,
    downloadLesson,
    deleteDownload,
    progressMap,
    isDownloading,
  };
}
