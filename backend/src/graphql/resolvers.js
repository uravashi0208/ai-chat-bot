/**
 * @file src/graphql/resolvers.js
 * @description GraphQL resolver map.
 *
 * Resolvers are intentionally thin — they:
 *   1. Enforce authentication via `requireAuth` or `requireAdmin`
 *   2. Translate camelCase GraphQL args → snake_case using `mapKeys`
 *   3. Delegate all business logic to the service layer
 *
 * No database queries, no business rules, no raw SQL live here.
 */

import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/adminAuth.js";
import { authService } from "../services/auth.js";
import { usersService } from "../services/users.js";
import { messagesService } from "../services/messages.js";
import { conversationsService } from "../services/conversations.js";
import { broadcastService } from "../services/broadcast.js";
import { userPrefsService } from "../services/userPrefs.js";
import { privacyService } from "../services/privacy.js";
import { statusService } from "../services/status.js";
import { adminService } from "../services/admin.js";
import { chatGateway } from "../chat/gateway.js";
import {
  createQRSession,
  getQRSession,
  deleteQRSession,
} from "../services/qr.js";
import { addDevice, getDevices, removeDevice } from "../services/device.js";
import { mapKeys } from "../utils/helpers.js";
import { contentService } from "../services/content.js";

// ─── camelCase → snake_case mappings ─────────────────────────────────────────

const PRIVACY_KEY_MAP = {
  lastSeen: "last_seen",
  profilePhoto: "profile_photo",
  about: "about",
  status: "status",
  readReceipts: "read_receipts",
  disappearingMessages: "disappearing_messages",
  groups: "groups",
  silenceUnknownCallers: "silence_unknown_callers",
};

const PREFS_KEY_MAP = {
  theme: "theme",
  wallpaper: "wallpaper",
  chatColor: "chat_color",
  fontSize: "font_size",
  enterIsSend: "enter_is_send",
  archiveKeep: "archive_keep",
  backupFreq: "backup_freq",
  aiWallpaperUrl: "ai_wallpaper_url",
  mediaAutoDownload: "media_auto_download",
  showReadReceipts: "show_read_receipts",
  notificationsEnabled: "notifications_enabled",
};

// ─── Resolvers ────────────────────────────────────────────────────────────────

export const resolvers = {
  Query: {
    // ── Auth ──────────────────────────────────────────────────────────────────
    me: (_, __, { user }) => {
      requireAuth(user);
      return usersService.findById(user.id);
    },

    // ── Users ─────────────────────────────────────────────────────────────────
    user: async (_, { id }, { user }) => {
      requireAuth(user);
      const target = await usersService.findById(id);
      return privacyService.applyPrivacyFilter(target, user.id);
    },

    searchUsers: async (_, { query }, { user }) => {
      requireAuth(user);
      const results = await usersService.searchUsers(query, user.id);
      return Promise.all(
        results.map((u) => privacyService.applyPrivacyFilter(u, user.id)),
      );
    },

    contacts: (_, __, { user }) => {
      requireAuth(user);
      return usersService.getContacts(user.id);
    },

    // ── Conversations ─────────────────────────────────────────────────────────
    conversations: (_, __, { user }) => {
      requireAuth(user);
      return conversationsService.getUserConversations(user.id);
    },

    conversation: (_, { id }, { user }) => {
      requireAuth(user);
      return conversationsService.getConversationById(id, user.id);
    },

    // ── Messages ──────────────────────────────────────────────────────────────
    messages: (_, { conversationId, limit, before }, { user }) => {
      requireAuth(user);
      return messagesService.getMessages(
        conversationId,
        user.id,
        limit ?? 50,
        before,
      );
    },

    starredMessages: (_, __, { user }) => {
      requireAuth(user);
      return messagesService.getStarredMessages(user.id);
    },

    // ── Broadcast ─────────────────────────────────────────────────────────────
    broadcastLists: (_, __, { user }) => {
      requireAuth(user);
      return broadcastService.getLists(user.id);
    },

    broadcastList: (_, { id }, { user }) => {
      requireAuth(user);
      return broadcastService.getList(id, user.id);
    },

    // ── Privacy ───────────────────────────────────────────────────────────────
    privacySettings: (_, __, { user }) => {
      requireAuth(user);
      return privacyService.getPrivacySettings(user.id);
    },

    blockedContacts: (_, __, { user }) => {
      requireAuth(user);
      return privacyService.getBlockedContacts(user.id);
    },

    // ── Preferences ───────────────────────────────────────────────────────────
    userPreferences: (_, __, { user }) => {
      requireAuth(user);
      return userPrefsService.getPreferences(user.id);
    },

    // ── Devices ───────────────────────────────────────────────────────────────
    generateQR: (_, __, { user }) => {
      requireAuth(user);
      return { token: createQRSession(user.id) };
    },

    getDevices: (_, __, { user }) => {
      requireAuth(user);
      return getDevices(user.id);
    },

    // ── Status ────────────────────────────────────────────────────────────────
    myStatuses: (_, __, { user }) => {
      requireAuth(user);
      return statusService.getMyStatuses(user.id);
    },

    statusFeed: async (_, __, { user }) => {
      requireAuth(user);

      const all = await statusService.getStatusFeed(user.id);

      const grouped = new Map();
      all.forEach((s) => {
        const uid = s.user.id;
        if (!grouped.has(uid)) grouped.set(uid, { user: s.user, statuses: [] });
        grouped.get(uid).statuses.push(s);
      });

      const allIds = all.map((s) => s.id);
      const viewedIds = await statusService.getViewedStatusIds(user.id, allIds);
      const viewedSet = new Set(viewedIds);

      const groups = [];
      grouped.forEach(({ user: u, statuses }) => {
        const has_unseen = statuses.some(
          (s) => !viewedSet.has(s.id) && s.user.id !== user.id,
        );
        groups.push({ user: u, statuses, has_unseen });
      });

      return groups.sort((a, b) => {
        if (a.user.id === user.id) return -1;
        if (b.user.id === user.id) return 1;
        return Number(b.has_unseen) - Number(a.has_unseen);
      });
    },

    statusViewers: (_, { statusId }, { user }) => {
      requireAuth(user);
      return statusService.getStatusViewers(statusId, user.id);
    },

    // ══════════════════════════════════════════════════════════════════════════
    // ADMIN QUERIES
    // ══════════════════════════════════════════════════════════════════════════

    // ── User Management ───────────────────────────────────────────────────────
    adminMe: (_, __, { admin }) => {
      requireAdmin(admin);
      return adminService.getMe(admin.id);
    },

    adminUsers: (_, { limit, offset, search }, { admin }) => {
      requireAdmin(admin);
      return adminService.listUsers({ limit, offset, search });
    },

    // ── Emoji Categories ──────────────────────────────────────────────────────
    adminEmojiCategories: (_, __, { admin }) => {
      requireAdmin(admin);
      return adminService.listEmojiCategories();
    },

    adminEmojis: (_, { categoryId }, { admin }) => {
      requireAdmin(admin);
      return adminService.listEmojis(categoryId);
    },

    // ── Theme Color Categories ────────────────────────────────────────────────
    adminThemeColorCategories: (_, __, { admin }) => {
      requireAdmin(admin);
      return adminService.listThemeColorCategories();
    },

    adminThemeColors: (_, { categoryId }, { admin }) => {
      requireAdmin(admin);
      return adminService.listThemeColors(categoryId);
    },

    // ── Wallpaper Categories ──────────────────────────────────────────────────
    adminWallpaperCategories: (_, __, { admin }) => {
      requireAdmin(admin);
      return adminService.listWallpaperCategories();
    },

    adminWallpapers: (_, { categoryId }, { admin }) => {
      requireAdmin(admin);
      return adminService.listWallpapers(categoryId);
    },

    // ── Feedback ──────────────────────────────────────────────────────────────
    adminFeedback: (_, { limit, offset }, { admin }) => {
      requireAdmin(admin);
      return adminService.listFeedback({ limit, offset });
    },

    // ── Contact Us ────────────────────────────────────────────────────────────
    adminContactUs: (_, { limit, offset }, { admin }) => {
      requireAdmin(admin);
      return adminService.listContactUs({ limit, offset });
    },

    // ── CMS Pages ─────────────────────────────────────────────────────────────
    adminPrivacyPolicy: (_, __, { admin }) => {
      requireAdmin(admin);
      return adminService.getPage("privacy-policy");
    },

    adminTermsConditions: (_, __, { admin }) => {
      requireAdmin(admin);
      return adminService.getPage("terms-conditions");
    },

    // ── FAQ ───────────────────────────────────────────────────────────────────
    adminFaqs: (_, { includeInactive }, { admin }) => {
      requireAdmin(admin);
      return adminService.listFaqs(includeInactive ?? true);
    },

    adminFaq: (_, { id }, { admin }) => {
      requireAdmin(admin);
      return adminService.getFaq(id);
    },

    // ── User Queries (require user JWT) ───────────────────────────────────────

    userEmojiCategories: (_, __, { user }) => {
      requireAuth(user);
      return contentService.listEmojiCategories();
    },

    userEmojis: (_, { categoryId }, { user }) => {
      requireAuth(user);
      return contentService.listEmojis(categoryId);
    },

    userThemeColorCategories: (_, __, { user }) => {
      requireAuth(user);
      return contentService.listThemeColorCategories();
    },

    userThemeColors: (_, { categoryId }, { user }) => {
      requireAuth(user);
      return contentService.listThemeColors(categoryId);
    },

    userWallpaperCategories: (_, __, { user }) => {
      requireAuth(user);
      return contentService.listWallpaperCategories();
    },

    userWallpapers: (_, { categoryId }, { user }) => {
      requireAuth(user);
      return contentService.listWallpapers(categoryId);
    },

    userPrivacyPolicy: (_, __, { user }) => {
      requireAuth(user);
      return contentService.getPage("privacy-policy");
    },

    userTermsConditions: (_, __, { user }) => {
      requireAuth(user);
      return contentService.getPage("terms-conditions");
    },

    userFaqs: (_, __, { user }) => {
      requireAuth(user);
      return contentService.listFaqs();
    },
  },

  // ──────────────────────────────────────────────────────────────────────────

  Mutation: {
    // ── Phone OTP auth ────────────────────────────────────────────────────────
    sendOtp: (_, { phone }) => authService.sendOtp(phone),
    phoneCheck: (_, { phone, otp }) => authService.phoneCheck(phone, otp),
    phoneRegister: (_, { phone, fullName, username, avatarUrl }) =>
      authService.phoneRegister(phone, fullName, username, avatarUrl),

    // ── Classic auth ──────────────────────────────────────────────────────────
    register: (_, { username, fullName, email, password, phone }) =>
      authService.register(username, fullName, email, password, phone),
    login: (_, { identifier, password }) =>
      authService.login(identifier, password),
    logout: (_, __, { user }) => {
      requireAuth(user);
      return authService.logout(user.id);
    },

    // ── Profile ───────────────────────────────────────────────────────────────
    updateProfile: (_, { fullName, about, avatarUrl, phone }, { user }) => {
      requireAuth(user);
      return usersService.updateProfile(user.id, {
        full_name: fullName,
        about,
        avatar_url: avatarUrl,
        phone,
      });
    },

    changePassword: (_, { currentPassword, newPassword }, { user }) => {
      requireAuth(user);
      return usersService.changePassword(user.id, currentPassword, newPassword);
    },

    enableTwoStep: (_, { pin }, { user }) => {
      requireAuth(user);
      return usersService.enableTwoStep(user.id, pin);
    },
    disableTwoStep: (_, { pin }, { user }) => {
      requireAuth(user);
      return usersService.disableTwoStep(user.id, pin);
    },
    changeTwoStepPin: (_, { currentPin, newPin }, { user }) => {
      requireAuth(user);
      return usersService.changeTwoStepPin(user.id, currentPin, newPin);
    },
    deleteAccount: (_, { password }, { user }) => {
      requireAuth(user);
      return usersService.deleteAccount(user.id, password);
    },
    addContact: (_, { contactId, nickname }, { user }) => {
      requireAuth(user);
      return usersService.addContact(user.id, contactId, nickname);
    },

    // ── Conversations ─────────────────────────────────────────────────────────
    findOrCreateDirectConversation: (_, { targetUserId }, { user }) => {
      requireAuth(user);
      return conversationsService.findOrCreateDirectConversation(
        user.id,
        targetUserId,
      );
    },

    createGroupConversation: (
      _,
      { name, participantIds, description },
      { user },
    ) => {
      requireAuth(user);
      return conversationsService.createGroupConversation(
        user.id,
        name,
        participantIds,
        description,
      );
    },

    markConversationRead: (_, { conversationId }, { user }) => {
      requireAuth(user);
      return conversationsService.markAsRead(conversationId, user.id);
    },

    // ── Messages ──────────────────────────────────────────────────────────────
    sendMessage: (
      _,
      { conversationId, content, type, ...options },
      { user },
    ) => {
      requireAuth(user);
      return messagesService.sendMessage(
        conversationId,
        user.id,
        content,
        type ?? "text",
        {
          mediaUrl: options.mediaUrl,
          mediaThumbnail: options.mediaThumbnail,
          mediaSize: options.mediaSize,
          mediaDuration: options.mediaDuration,
          replyToId: options.replyToId,
          isForwarded: options.isForwarded,
        },
      );
    },

    editMessage: (_, { messageId, content }, { user }) => {
      requireAuth(user);
      return messagesService.editMessage(messageId, user.id, content);
    },
    deleteMessage: (_, { messageId }, { user }) => {
      requireAuth(user);
      return messagesService.deleteMessage(messageId, user.id);
    },
    starMessage: (_, { messageId }, { user }) => {
      requireAuth(user);
      return messagesService.starMessage(messageId, user.id).then(() => true);
    },
    unstarMessage: (_, { messageId }, { user }) => {
      requireAuth(user);
      return messagesService.unstarMessage(messageId, user.id);
    },
    addReaction: (_, { messageId, emoji }, { user }) => {
      requireAuth(user);
      return messagesService
        .addReaction(messageId, user.id, emoji)
        .then(() => true);
    },
    removeReaction: (_, { messageId, emoji }, { user }) => {
      requireAuth(user);
      return messagesService.removeReaction(messageId, user.id, emoji);
    },

    // ── Broadcast ─────────────────────────────────────────────────────────────
    createBroadcastList: (_, { name, recipientIds }, { user }) => {
      requireAuth(user);
      return broadcastService.createList(user.id, name, recipientIds);
    },
    updateBroadcastList: (_, { id, name }, { user }) => {
      requireAuth(user);
      return broadcastService.updateList(id, user.id, name);
    },
    deleteBroadcastList: (_, { id }, { user }) => {
      requireAuth(user);
      return broadcastService.deleteList(id, user.id);
    },
    addBroadcastRecipients: (_, { id, recipientIds }, { user }) => {
      requireAuth(user);
      return broadcastService.addRecipients(id, user.id, recipientIds);
    },
    removeBroadcastRecipient: (_, { id, recipientId }, { user }) => {
      requireAuth(user);
      return broadcastService.removeRecipient(id, user.id, recipientId);
    },
    sendBroadcast: (_, { id, content, type }, { user }) => {
      requireAuth(user);
      return broadcastService.sendBroadcast(id, user.id, content, type);
    },

    // ── Privacy ───────────────────────────────────────────────────────────────
    updatePrivacySettings: (_, { settings }, { user }) => {
      requireAuth(user);
      return privacyService.updatePrivacySettings(
        user.id,
        mapKeys(settings, PRIVACY_KEY_MAP),
      );
    },

    blockContact: (_, { contactId, reason }, { user }) => {
      requireAuth(user);
      return privacyService.blockContact(user.id, contactId, reason);
    },
    unblockContact: (_, { contactId }, { user }) => {
      requireAuth(user);
      return privacyService.unblockContact(user.id, contactId);
    },

    // ── Preferences ───────────────────────────────────────────────────────────
    updateUserPreferences: (_, { prefs }, { user }) => {
      requireAuth(user);
      return userPrefsService.updatePreferences(
        user.id,
        mapKeys(prefs, PREFS_KEY_MAP),
      );
    },

    // ── Status ────────────────────────────────────────────────────────────────
    createStatus: (_, { type, content, mediaUrl, bgColor }, { user }) => {
      requireAuth(user);
      return statusService.createStatus(user.id, {
        type,
        content,
        mediaUrl,
        bgColor,
      });
    },
    deleteStatus: (_, { statusId }, { user }) => {
      requireAuth(user);
      return statusService.deleteStatus(statusId, user.id);
    },
    viewStatus: (_, { statusId }, { user }) => {
      requireAuth(user);
      return statusService.markViewed(statusId, user.id);
    },

    // ── Devices ───────────────────────────────────────────────────────────────
    linkDevice: async (_, { token, deviceInfo }) => {
      const session = getQRSession(token);
      if (!session) throw new Error("Invalid or expired QR code.");
      deleteQRSession(token);
      await addDevice(session.userId, deviceInfo);
      return true;
    },

    removeDevice: async (_, { deviceId }, { user }) => {
      requireAuth(user);
      const device = await removeDevice(deviceId);
      if (device?.socket_id) {
        chatGateway.io?.to(device.socket_id).emit("force-logout");
      }
      return true;
    },

    // ══════════════════════════════════════════════════════════════════════════
    // ADMIN MUTATIONS
    // ══════════════════════════════════════════════════════════════════════════

    // ── Admin Auth ─────────────────────────────────────────────────────────────
    adminRegister: (_, { username, email, password }) =>
      adminService.register(username, email, password),

    adminLogin: (_, { identifier, password }) =>
      adminService.login(identifier, password),

    adminUpdateProfile: (_, args, { admin }) => {
      requireAdmin(admin);
      return adminService.updateProfile(admin.id, args);
    },

    adminChangePassword: (_, { oldPassword, newPassword }, { admin }) => {
      requireAdmin(admin);
      return adminService.changePassword(admin.id, oldPassword, newPassword);
    },

    // ── User Management ───────────────────────────────────────────────────────
    adminSetUserStatus: (_, { userId, status }, { admin }) => {
      requireAdmin(admin);
      return adminService.setUserStatus(userId, status);
    },

    // ── Emoji Categories ──────────────────────────────────────────────────────
    adminCreateEmojiCategory: (_, { input }, { admin }) => {
      requireAdmin(admin);
      return adminService.createEmojiCategory(input.categoryName, input.status);
    },

    adminUpdateEmojiCategory: (_, { id, input }, { admin }) => {
      requireAdmin(admin);
      const fields = {};
      if (input.categoryName !== undefined)
        fields.category_name = input.categoryName;
      if (input.status !== undefined) fields.status = input.status;
      return adminService.updateEmojiCategory(id, fields);
    },

    adminDeleteEmojiCategory: (_, { id }, { admin }) => {
      requireAdmin(admin);
      return adminService.deleteEmojiCategory(id);
    },

    // ── Emojis ────────────────────────────────────────────────────────────────
    adminCreateEmoji: (_, { input }, { admin }) => {
      requireAdmin(admin);
      return adminService.createEmoji(
        input.emoji,
        input.categoryId,
        input.status,
      );
    },

    adminUpdateEmoji: (_, { id, input }, { admin }) => {
      requireAdmin(admin);
      const fields = {};
      if (input.emoji !== undefined) fields.emoji = input.emoji;
      if (input.categoryId !== undefined) fields.category_id = input.categoryId;
      if (input.status !== undefined) fields.status = input.status;
      return adminService.updateEmoji(id, fields);
    },

    adminDeleteEmoji: (_, { id }, { admin }) => {
      requireAdmin(admin);
      return adminService.deleteEmoji(id);
    },

    // ── Theme Color Categories ─────────────────────────────────────────────────
    adminCreateThemeColorCategory: (_, { input }, { admin }) => {
      requireAdmin(admin);
      return adminService.createThemeColorCategory(
        input.categoryName,
        input.status,
      );
    },

    adminUpdateThemeColorCategory: (_, { id, input }, { admin }) => {
      requireAdmin(admin);
      const fields = {};
      if (input.categoryName !== undefined)
        fields.category_name = input.categoryName;
      if (input.status !== undefined) fields.status = input.status;
      return adminService.updateThemeColorCategory(id, fields);
    },

    adminDeleteThemeColorCategory: (_, { id }, { admin }) => {
      requireAdmin(admin);
      return adminService.deleteThemeColorCategory(id);
    },

    // ── Theme Colors ──────────────────────────────────────────────────────────
    adminCreateThemeColor: (_, { input }, { admin }) => {
      requireAdmin(admin);
      return adminService.createThemeColor(
        input.colorName,
        input.colorCode,
        input.categoryId,
        input.status,
      );
    },

    adminUpdateThemeColor: (_, { id, input }, { admin }) => {
      requireAdmin(admin);
      const fields = {};
      if (input.colorName !== undefined) fields.color_name = input.colorName;
      if (input.colorCode !== undefined) fields.color_code = input.colorCode;
      if (input.categoryId !== undefined) fields.category_id = input.categoryId;
      if (input.status !== undefined) fields.status = input.status;
      return adminService.updateThemeColor(id, fields);
    },

    adminDeleteThemeColor: (_, { id }, { admin }) => {
      requireAdmin(admin);
      return adminService.deleteThemeColor(id);
    },

    // ── Wallpaper Categories ───────────────────────────────────────────────────
    adminCreateWallpaperCategory: (_, { input }, { admin }) => {
      requireAdmin(admin);
      return adminService.createWallpaperCategory(
        input.categoryName,
        input.status,
      );
    },

    adminUpdateWallpaperCategory: (_, { id, input }, { admin }) => {
      requireAdmin(admin);
      const fields = {};
      if (input.categoryName !== undefined)
        fields.category_name = input.categoryName;
      if (input.status !== undefined) fields.status = input.status;
      return adminService.updateWallpaperCategory(id, fields);
    },

    adminDeleteWallpaperCategory: (_, { id }, { admin }) => {
      requireAdmin(admin);
      return adminService.deleteWallpaperCategory(id);
    },

    // ── Wallpapers ────────────────────────────────────────────────────────────
    adminCreateWallpaper: (_, { input }, { admin }) => {
      requireAdmin(admin);
      return adminService.createWallpaper(
        input.title,
        input.imageUrl,
        input.categoryId,
        input.status,
      );
    },

    adminUpdateWallpaper: (_, { id, input }, { admin }) => {
      requireAdmin(admin);
      const fields = {};
      if (input.title !== undefined) fields.title = input.title;
      if (input.imageUrl !== undefined) fields.image_url = input.imageUrl;
      if (input.categoryId !== undefined) fields.category_id = input.categoryId;
      if (input.status !== undefined) fields.status = input.status;
      return adminService.updateWallpaper(id, fields);
    },

    adminDeleteWallpaper: (_, { id }, { admin }) => {
      requireAdmin(admin);
      return adminService.deleteWallpaper(id);
    },

    // ── Contact Us ────────────────────────────────────────────────────────────
    adminMarkContactUsRead: (_, { id }, { admin }) => {
      requireAdmin(admin);
      return adminService.markContactUsRead(id);
    },

    // ── CMS Pages ─────────────────────────────────────────────────────────────
    adminUpsertPrivacyPolicy: (_, { title, content }, { admin }) => {
      requireAdmin(admin);
      return adminService.upsertPage("privacy-policy", title, content);
    },

    adminUpsertTermsConditions: (_, { title, content }, { admin }) => {
      requireAdmin(admin);
      return adminService.upsertPage("terms-conditions", title, content);
    },

    // ── FAQ ───────────────────────────────────────────────────────────────────
    adminCreateFaq: (_, { input }, { admin }) => {
      requireAdmin(admin);
      return adminService.createFaq(
        input.question,
        input.answer,
        input.sortOrder,
        input.status,
      );
    },

    adminUpdateFaq: (_, { id, input }, { admin }) => {
      requireAdmin(admin);
      const fields = {};
      if (input.question !== undefined) fields.question = input.question;
      if (input.answer !== undefined) fields.answer = input.answer;
      if (input.sortOrder !== undefined) fields.sort_order = input.sortOrder;
      if (input.status !== undefined) fields.status = input.status;
      return adminService.updateFaq(id, fields);
    },

    adminDeleteFaq: (_, { id }, { admin }) => {
      requireAdmin(admin);
      return adminService.deleteFaq(id);
    },
  },
};
