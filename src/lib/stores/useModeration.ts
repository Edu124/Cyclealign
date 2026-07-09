import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Community self-protection tools (App Store guideline 1.2):
 *  - hidden users: their posts disappear from this device's feed immediately
 *  - reported posts: remembered so the UI can show a "Reported" state
 */
interface ModerationState {
  blockedUserIds: string[];
  reportedPostIds: string[];
  blockUser: (userId: string) => void;
  unblockUser: (userId: string) => void;
  markReported: (postId: string) => void;
}

export const useModeration = create<ModerationState>()(
  persist(
    (set) => ({
      blockedUserIds: [],
      reportedPostIds: [],
      blockUser: (userId) =>
        set((s) => ({
          blockedUserIds: s.blockedUserIds.includes(userId)
            ? s.blockedUserIds
            : [...s.blockedUserIds, userId],
        })),
      unblockUser: (userId) =>
        set((s) => ({
          blockedUserIds: s.blockedUserIds.filter((id) => id !== userId),
        })),
      markReported: (postId) =>
        set((s) => ({
          reportedPostIds: s.reportedPostIds.includes(postId)
            ? s.reportedPostIds
            : [...s.reportedPostIds, postId],
        })),
    }),
    {
      name: 'cyclealign-moderation',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
