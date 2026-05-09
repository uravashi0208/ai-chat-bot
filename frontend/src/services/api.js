/**
 * GraphQL API Client
 *
 * Single source of truth for all server communication.
 * Replaces the old REST/axios layer with typed GraphQL mutations & queries
 * that map 1-to-1 to the Apollo server's schema.
 *
 * Usage:
 *   import { authApi, usersApi, conversationsApi, messagesApi, broadcastApi } from './api';
 */

// ─── GQL Transport ─────────────────────────────────────────────────────────

const GQL_ENDPOINT =
  process.env.REACT_APP_GQL_URL || "http://localhost:4000/graphql";

/**
 * Core fetch wrapper for GraphQL.
 * Reads the JWT from localStorage and attaches it as a Bearer token.
 * On UNAUTHENTICATED errors it clears local storage and redirects to /login.
 *
 * @param {string} query     - GraphQL query or mutation string
 * @param {object} variables - Variables map
 * @returns {Promise<*>}     - The `data` field of the GQL response
 * @throws {Error}           - Enriched with the first GQL error message
 */
async function gql(query, variables = {}) {
  const token = localStorage.getItem("wa_token");

  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(GQL_ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();

  if (json.errors?.length) {
    const firstError = json.errors[0];
    const code = firstError.extensions?.code;

    if (code === "UNAUTHENTICATED" || res.status === 401) {
      localStorage.removeItem("wa_token");
      localStorage.removeItem("wa_user");
      window.location.href = "/login";
    }

    throw new Error(firstError.message || "GraphQL error");
  }

  return json.data;
}

// ─── Shared Fragments (inline strings — avoids a full GQL client dep) ─────

const USER_FIELDS = `
  id username full_name email phone avatar_url about status last_seen created_at
`;

const PARTICIPANT_FIELDS = `
  role last_read_at
  user { ${USER_FIELDS} }
`;

const LAST_MSG_FIELDS = `
  id content type is_deleted created_at status
  sender { id username full_name avatar_url }
`;

const CONVERSATION_FIELDS = `
  id type name avatar_url description
  last_message_at created_at last_message_id
  last_read_at is_muted is_archived is_pinned is_favourite disappearing_messages unread_count
  last_message { ${LAST_MSG_FIELDS} }
  participants { ${PARTICIPANT_FIELDS} }
`;

const REACTION_FIELDS = `id emoji user_id`;

const REPLY_FIELDS = `
  id content type
  sender { id username full_name avatar_url }
`;

const MESSAGE_FIELDS = `
  id content type media_url media_thumbnail media_size media_duration
  is_deleted is_forwarded edited_at created_at status delivered_at read_at
  starred_at sender_name
  sender { id username full_name avatar_url }
  reply_to { ${REPLY_FIELDS} }
  reactions { ${REACTION_FIELDS} }
`;

const BROADCAST_LIST_FIELDS = `
  id name created_at updated_at recipient_count
  recipients { ${USER_FIELDS} }
`;

const CONTACT_FIELDS = `
  id nickname is_blocked created_at
  contact { ${USER_FIELDS} }
`;

// ─── Auth API ──────────────────────────────────────────────────────────────

export const authApi = {
  /** Step 1 of phone OTP flow — sends a 6-digit code via SMS. */
  sendOtp: (phone) =>
    gql(
      `mutation SendOtp($phone: String!) {
        sendOtp(phone: $phone) { sent devOtp }
      }`,
      { phone },
    ).then((d) => d.sendOtp),

  /** Step 2 — verifies the OTP code. Returns { exists, user, token }. */
  phoneCheck: (phone, otp) =>
    gql(
      `mutation PhoneCheck($phone: String!, $otp: String!) {
        phoneCheck(phone: $phone, otp: $otp) {
          exists token
          user { ${USER_FIELDS} }
        }
      }`,
      { phone, otp },
    ).then((d) => d.phoneCheck),

  /** Step 3 — registers a brand-new phone-only user. */
  phoneRegister: ({ phone, fullName, username, avatarUrl }) =>
    gql(
      `mutation PhoneRegister(
        $phone: String!, $fullName: String!, $username: String, $avatarUrl: String
      ) {
        phoneRegister(phone: $phone, fullName: $fullName, username: $username, avatarUrl: $avatarUrl) {
          token
          user { ${USER_FIELDS} }
        }
      }`,
      { phone, fullName, username, avatarUrl },
    ).then((d) => d.phoneRegister),

  /** Classic email/username + password login. */
  login: ({ identifier, password }) =>
    gql(
      `mutation Login($identifier: String!, $password: String!) {
        login(identifier: $identifier, password: $password) {
          token
          user { ${USER_FIELDS} }
        }
      }`,
      { identifier, password },
    ).then((d) => d.login),

  /** Classic username + email + password registration. */
  register: ({ username, fullName, email, password, phone }) =>
    gql(
      `mutation Register(
        $username: String!, $fullName: String!, $email: String!,
        $password: String!, $phone: String
      ) {
        register(
          username: $username, fullName: $fullName, email: $email,
          password: $password, phone: $phone
        ) {
          token
          user { ${USER_FIELDS} }
        }
      }`,
      { username, fullName, email, password, phone },
    ).then((d) => d.register),

  /** Sets user status offline and invalidates server session. */
  logout: () => gql(`mutation { logout }`).then((d) => d.logout),

  /** Fetches the currently authenticated user. */
  me: () =>
    gql(
      `query {
        me { ${USER_FIELDS} two_step_enabled }
      }`,
    ).then((d) => d.me),
};

// ─── Users API ─────────────────────────────────────────────────────────────

export const usersApi = {
  /** Full-text user search, excludes self. */
  search: (query) =>
    gql(
      `query SearchUsers($query: String!) {
        searchUsers(query: $query) { ${USER_FIELDS} }
      }`,
      { query },
    ).then((d) => d.searchUsers),

  /** Returns the authenticated user's full contact list. */
  getContacts: () =>
    gql(`query { contacts { ${CONTACT_FIELDS} } }`).then((d) => d.contacts),

  /** Adds a user to contacts with an optional display nickname. */
  addContact: (contactId, nickname) =>
    gql(
      `mutation AddContact($contactId: ID!, $nickname: String) {
        addContact(contactId: $contactId, nickname: $nickname) { ${CONTACT_FIELDS} }
      }`,
      { contactId, nickname },
    ).then((d) => d.addContact),

  /** Updates the nickname for an existing contact. */
  updateNickname: (contactId, nickname) =>
    gql(
      `mutation UpdateNickname($contactId: ID!, $nickname: String) {
        updateNickname(contactId: $contactId, nickname: $nickname) { ${CONTACT_FIELDS} }
      }`,
      { contactId, nickname },
    ).then((d) => d.updateNickname),

  reportUser: (userId, reason) =>
    gql(
      `mutation ReportUser($userId: ID!, $reason: String!) {
        reportUser(userId: $userId, reason: $reason)
      }`,
      { userId, reason },
    ).then((d) => d.reportUser),

  /** Fetches a single user by their ID. */
  getById: (id) =>
    gql(
      `query GetUser($id: ID!) {
        user(id: $id) { ${USER_FIELDS} }
      }`,
      { id },
    ).then((d) => d.user),

  /** Updates the authenticated user's profile. */
  updateProfile: ({ fullName, about, avatarUrl, phone }) =>
    gql(
      `mutation UpdateProfile(
        $fullName: String, $about: String, $avatarUrl: String, $phone: String
      ) {
        updateProfile(fullName: $fullName, about: $about, avatarUrl: $avatarUrl, phone: $phone) {
          ${USER_FIELDS}
        }
      }`,
      { fullName, about, avatarUrl, phone },
    ).then((d) => d.updateProfile),

  changePassword: (currentPassword, newPassword) =>
    gql(
      `mutation ChangePassword($currentPassword: String!, $newPassword: String!) {
        changePassword(currentPassword: $currentPassword, newPassword: $newPassword)
      }`,
      { currentPassword, newPassword },
    ).then((d) => d.changePassword),

  enableTwoStep: (pin) =>
    gql(`mutation EnableTwoStep($pin: String!) { enableTwoStep(pin: $pin) }`, {
      pin,
    }).then((d) => d.enableTwoStep),

  disableTwoStep: (pin) =>
    gql(
      `mutation DisableTwoStep($pin: String!) { disableTwoStep(pin: $pin) }`,
      { pin },
    ).then((d) => d.disableTwoStep),

  changeTwoStepPin: (currentPin, newPin) =>
    gql(
      `mutation ChangeTwoStepPin($currentPin: String!, $newPin: String!) {
        changeTwoStepPin(currentPin: $currentPin, newPin: $newPin)
      }`,
      { currentPin, newPin },
    ).then((d) => d.changeTwoStepPin),

  deleteAccount: (password) =>
    gql(
      `mutation DeleteAccount($password: String!) { deleteAccount(password: $password) }`,
      { password },
    ).then((d) => d.deleteAccount),
};

// ─── Conversations API ─────────────────────────────────────────────────────

export const conversationsApi = {
  /** Loads all conversations the authenticated user participates in. */
  getAll: () =>
    gql(`query { conversations { ${CONVERSATION_FIELDS} } }`).then(
      (d) => d.conversations,
    ),

  /** Fetches a single conversation by ID. */
  getById: (id) =>
    gql(
      `query GetConversation($id: ID!) {
        conversation(id: $id) { ${CONVERSATION_FIELDS} }
      }`,
      { id },
    ).then((d) => d.conversation),

  /**
   * Finds or creates a 1-to-1 direct conversation with the target user.
   * This is idempotent — calling it twice returns the same conversation.
   */
  findOrCreateDirect: (targetUserId) =>
    gql(
      `mutation FindOrCreateDirect($targetUserId: ID!) {
        findOrCreateDirectConversation(targetUserId: $targetUserId) { ${CONVERSATION_FIELDS} }
      }`,
      { targetUserId },
    ).then((d) => d.findOrCreateDirectConversation),

  /** Creates a new group conversation. */
  createGroup: ({ name, participantIds, description }) =>
    gql(
      `mutation CreateGroup($name: String!, $participantIds: [ID!]!, $description: String) {
        createGroupConversation(
          name: $name, participantIds: $participantIds, description: $description
        ) { ${CONVERSATION_FIELDS} }
      }`,
      { name, participantIds, description },
    ).then((d) => d.createGroupConversation),

  /** Marks all messages in a conversation as read for the current user. */
  markAsRead: (conversationId) =>
    gql(
      `mutation MarkRead($conversationId: ID!) {
        markConversationRead(conversationId: $conversationId)
      }`,
      { conversationId },
    ).then((d) => d.markConversationRead),

  muteConversation: (conversationId, mute) =>
    gql(
      `mutation MuteConv($conversationId: ID!, $mute: Boolean!) {
        muteConversation(conversationId: $conversationId, mute: $mute)
      }`,
      { conversationId, mute },
    ).then((d) => d.muteConversation),

  pinConversation: (conversationId, pin) =>
    gql(
      `mutation PinConv($conversationId: ID!, $pin: Boolean!) {
        pinConversation(conversationId: $conversationId, pin: $pin)
      }`,
      { conversationId, pin },
    ).then((d) => d.pinConversation),

  favouriteConversation: (conversationId, favourite) =>
    gql(
      `mutation FavConv($conversationId: ID!, $favourite: Boolean!) {
        favouriteConversation(conversationId: $conversationId, favourite: $favourite)
      }`,
      { conversationId, favourite },
    ).then((d) => d.favouriteConversation),

  clearChat: (conversationId) =>
    gql(
      `mutation ClearChat($conversationId: ID!) {
        clearChat(conversationId: $conversationId)
      }`,
      { conversationId },
    ).then((d) => d.clearChat),

  deleteConversation: (conversationId) =>
    gql(
      `mutation DeleteConv($conversationId: ID!) {
        deleteConversation(conversationId: $conversationId)
      }`,
      { conversationId },
    ).then((d) => d.deleteConversation),

  setDisappearingMessages: (conversationId, duration) =>
    gql(
      `mutation SetDisappearing($conversationId: ID!, $duration: String!) {
        setDisappearingMessages(conversationId: $conversationId, duration: $duration)
      }`,
      { conversationId, duration },
    ).then((d) => d.setDisappearingMessages),

  searchMessages: (conversationId, query) =>
    gql(
      `query SearchMsgs($conversationId: ID!, $query: String!) {
        searchMessages(conversationId: $conversationId, query: $query) {
          id content type media_url created_at is_deleted
          sender { id username full_name avatar_url }
        }
      }`,
      { conversationId, query },
    ).then((d) => d.searchMessages),
};

// ─── Messages API ──────────────────────────────────────────────────────────

export const messagesApi = {
  /**
   * Paginated message loader.
   * Pass `before` (ISO timestamp) to fetch older messages for infinite scroll.
   */
  getMessages: (conversationId, limit = 50, before = undefined) =>
    gql(
      `query GetMessages($conversationId: ID!, $limit: Int, $before: String) {
        messages(conversationId: $conversationId, limit: $limit, before: $before) {
          ${MESSAGE_FIELDS}
        }
      }`,
      { conversationId, limit, before },
    ).then((d) => d.messages),

  /**
   * Direct message send via GraphQL mutation.
   * NOTE: For real-time delivery, prefer socketService.sendMessage().
   * This is used as a fallback or for REST-style parity.
   */
  send: (conversationId, { content, type, mediaUrl, replyToId, isForwarded }) =>
    gql(
      `mutation SendMessage(
        $conversationId: ID!, $content: String!, $type: String,
        $mediaUrl: String, $replyToId: ID, $isForwarded: Boolean
      ) {
        sendMessage(
          conversationId: $conversationId, content: $content, type: $type,
          mediaUrl: $mediaUrl, replyToId: $replyToId, isForwarded: $isForwarded
        ) { ${MESSAGE_FIELDS} }
      }`,
      { conversationId, content, type, mediaUrl, replyToId, isForwarded },
    ).then((d) => d.sendMessage),

  edit: (_conversationId, messageId, content) =>
    gql(
      `mutation EditMessage($messageId: ID!, $content: String!) {
        editMessage(messageId: $messageId, content: $content) { ${MESSAGE_FIELDS} }
      }`,
      { messageId, content },
    ).then((d) => d.editMessage),

  delete: (_conversationId, messageId) =>
    gql(
      `mutation DeleteMessage($messageId: ID!) {
        deleteMessage(messageId: $messageId) { id is_deleted }
      }`,
      { messageId },
    ).then((d) => d.deleteMessage),

  addReaction: (_conversationId, messageId, emoji) =>
    gql(
      `mutation AddReaction($messageId: ID!, $emoji: String!) {
        addReaction(messageId: $messageId, emoji: $emoji)
      }`,
      { messageId, emoji },
    ).then((d) => d.addReaction),

  removeReaction: (_conversationId, messageId, emoji) =>
    gql(
      `mutation RemoveReaction($messageId: ID!, $emoji: String!) {
        removeReaction(messageId: $messageId, emoji: $emoji)
      }`,
      { messageId, emoji },
    ).then((d) => d.removeReaction),

  star: (_conversationId, messageId) =>
    gql(
      `mutation StarMessage($messageId: ID!) { starMessage(messageId: $messageId) }`,
      { messageId },
    ).then((d) => d.starMessage),

  unstar: (_conversationId, messageId) =>
    gql(
      `mutation UnstarMessage($messageId: ID!) { unstarMessage(messageId: $messageId) }`,
      { messageId },
    ).then((d) => d.unstarMessage),

  /** Fetches all messages starred by the authenticated user. */
  getStarred: () =>
    gql(`query { starredMessages { ${MESSAGE_FIELDS} } }`).then(
      (d) => d.starredMessages,
    ),
};

// ─── Broadcast API ─────────────────────────────────────────────────────────

export const broadcastApi = {
  getLists: () =>
    gql(`query { broadcastLists { ${BROADCAST_LIST_FIELDS} } }`).then(
      (d) => d.broadcastLists,
    ),

  getList: (id) =>
    gql(
      `query GetBroadcastList($id: ID!) {
        broadcastList(id: $id) { ${BROADCAST_LIST_FIELDS} }
      }`,
      { id },
    ).then((d) => d.broadcastList),

  createList: (name, recipientIds) =>
    gql(
      `mutation CreateBroadcastList($name: String!, $recipientIds: [ID!]!) {
        createBroadcastList(name: $name, recipientIds: $recipientIds) { ${BROADCAST_LIST_FIELDS} }
      }`,
      { name, recipientIds },
    ).then((d) => d.createBroadcastList),

  updateList: (id, name) =>
    gql(
      `mutation UpdateBroadcastList($id: ID!, $name: String!) {
        updateBroadcastList(id: $id, name: $name) { ${BROADCAST_LIST_FIELDS} }
      }`,
      { id, name },
    ).then((d) => d.updateBroadcastList),

  deleteList: (id) =>
    gql(
      `mutation DeleteBroadcastList($id: ID!) { deleteBroadcastList(id: $id) }`,
      { id },
    ).then((d) => d.deleteBroadcastList),

  addRecipients: (id, recipientIds) =>
    gql(
      `mutation AddBroadcastRecipients($id: ID!, $recipientIds: [ID!]!) {
        addBroadcastRecipients(id: $id, recipientIds: $recipientIds) { ${BROADCAST_LIST_FIELDS} }
      }`,
      { id, recipientIds },
    ).then((d) => d.addBroadcastRecipients),

  removeRecipient: (id, recipientId) =>
    gql(
      `mutation RemoveBroadcastRecipient($id: ID!, $recipientId: ID!) {
        removeBroadcastRecipient(id: $id, recipientId: $recipientId)
      }`,
      { id, recipientId },
    ).then((d) => d.removeBroadcastRecipient),

  send: (id, content, type = "text") =>
    gql(
      `mutation SendBroadcast($id: ID!, $content: String!, $type: String) {
        sendBroadcast(id: $id, content: $content, type: $type) {
          sent failed total
          results { recipientId conversationId messageId success error }
        }
      }`,
      { id, content, type },
    ).then((d) => d.sendBroadcast),
};

// ─── Devices API (QR + Linked Devices) ─────────────────────────────────────

export const devicesApi = {
  /** Generate QR token for linking new device */
  generateQR: () =>
    gql(
      `query {
        generateQR { token }
      }`,
    ).then((d) => d.generateQR),

  /** Link device after scanning QR */
  linkDevice: (token, deviceInfo) =>
    gql(
      `mutation LinkDevice($token: String!, $deviceInfo: JSON!) {
        linkDevice(token: $token, deviceInfo: $deviceInfo)
      }`,
      { token, deviceInfo },
    ).then((d) => d.linkDevice),

  /** Get all linked devices */
  getDevices: () =>
    gql(
      `query {
        getDevices {
          id
          device_name
          device_info
          created_at
        }
      }`,
    ).then((d) => d.getDevices),

  /** Remove device (force logout) */
  removeDevice: (deviceId) =>
    gql(
      `mutation RemoveDevice($deviceId: ID!) {
        removeDevice(deviceId: $deviceId)
      }`,
      { deviceId },
    ).then((d) => d.removeDevice),
};

// ─── Status API ────────────────────────────────────────────────────────────

const STATUS_UPLOAD_URL = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/upload/status`
  : "http://localhost:4000/upload/status";

const STATUS_FIELDS = `id type content media_url bg_color expires_at created_at
  user { id username full_name avatar_url }`;

export const statusApi = {
  /** Get my own statuses */
  getMyStatuses: () =>
    gql(`query { myStatuses { ${STATUS_FIELDS} } }`).then((d) => d.myStatuses),

  /** Get feed grouped by user */
  getStatusFeed: () =>
    gql(`query {
      statusFeed {
        has_unseen
        user { id username full_name avatar_url }
        statuses { ${STATUS_FIELDS} }
      }
    }`).then((d) => d.statusFeed),

  /** Get viewers of a status (owner only) */
  getStatusViewers: (statusId) =>
    gql(
      `query GetStatusViewers($statusId: ID!) {
      statusViewers(statusId: $statusId) {
        viewer_id viewed_at
        viewer { id username full_name avatar_url }
      }
    }`,
      { statusId },
    ).then((d) => d.statusViewers),

  /** Post a new text status */
  createStatus: ({ type, content, mediaUrl, bgColor }) =>
    gql(
      `mutation CreateStatus($type: String!, $content: String, $mediaUrl: String, $bgColor: String) {
      createStatus(type: $type, content: $content, mediaUrl: $mediaUrl, bgColor: $bgColor) {
        ${STATUS_FIELDS}
      }
    }`,
      { type, content, mediaUrl, bgColor },
    ).then((d) => d.createStatus),

  /** Delete own status */
  deleteStatus: (statusId) =>
    gql(
      `mutation DeleteStatus($statusId: ID!) { deleteStatus(statusId: $statusId) }`,
      { statusId },
    ).then((d) => d.deleteStatus),

  /** Mark a status as viewed */
  viewStatus: (statusId) =>
    gql(
      `mutation ViewStatus($statusId: ID!) { viewStatus(statusId: $statusId) }`,
      { statusId },
    ).then((d) => d.viewStatus),

  /** Upload image/video for status */
  uploadStatusMedia: async (file) => {
    const token = localStorage.getItem("wa_token");
    const formData = new FormData();
    formData.append("status", file);
    const res = await fetch(STATUS_UPLOAD_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Upload failed");
    return json; // { url, type }
  },
};

// ─── Default export (raw gql helper for one-off queries) ───────────────────

export default gql;

// ─── Privacy API ────────────────────────────────────────────────────────────

const PRIVACY_FIELDS = `
  user_id last_seen profile_photo about status
  read_receipts disappearing_messages groups silence_unknown_callers updated_at
`;

const BLOCKED_CONTACT_FIELDS = `
  id is_blocked blocked_at block_reason created_at
  contact { id username full_name avatar_url about status last_seen }
`;

export const privacyApi = {
  getPrivacySettings: () =>
    gql(`query { privacySettings { ${PRIVACY_FIELDS} } }`).then(
      (d) => d.privacySettings,
    ),

  updatePrivacySettings: (settings) => {
    // The DB response uses snake_case keys and includes server-managed fields
    // (user_id, updated_at) that are NOT part of PrivacySettingsInput.
    // Map to the camelCase fields the GraphQL schema expects and strip extras.

    // Normalise visibility strings to the Title Case the DB check constraint requires.
    // The UI uses lowercase ('everyone', 'contacts', 'nobody'); the DB expects
    // 'Everyone' | 'My contacts' | 'Nobody'.
    const normaliseVisibility = (v) => {
      if (typeof v !== "string") return v;
      const map = {
        everyone: "Everyone",
        contacts: "My contacts",
        nobody: "Nobody",
        // pass-through already-correct values
        Everyone: "Everyone",
        "My contacts": "My contacts",
        Nobody: "Nobody",
      };
      return map[v] ?? v;
    };

    const input = {
      lastSeen: normaliseVisibility(settings.lastSeen ?? settings.last_seen),
      profilePhoto: normaliseVisibility(
        settings.profilePhoto ?? settings.profile_photo,
      ),
      about: normaliseVisibility(settings.about),
      status: normaliseVisibility(settings.status),
      readReceipts: settings.readReceipts ?? settings.read_receipts,
      disappearingMessages:
        settings.disappearingMessages ?? settings.disappearing_messages,
      groups: normaliseVisibility(settings.groups),
      silenceUnknownCallers:
        settings.silenceUnknownCallers ?? settings.silence_unknown_callers,
    };
    // Drop keys that are still undefined (not provided by caller).
    Object.keys(input).forEach(
      (k) => input[k] === undefined && delete input[k],
    );

    return gql(
      `mutation UpdatePrivacy($settings: PrivacySettingsInput!) {
        updatePrivacySettings(settings: $settings) { ${PRIVACY_FIELDS} }
      }`,
      { settings: input },
    ).then((d) => d.updatePrivacySettings);
  },

  getBlockedContacts: () =>
    gql(`query { blockedContacts { ${BLOCKED_CONTACT_FIELDS} } }`).then(
      (d) => d.blockedContacts,
    ),

  blockContact: (contactId, reason) =>
    gql(
      `mutation BlockContact($contactId: ID!, $reason: String) {
        blockContact(contactId: $contactId, reason: $reason) { ${BLOCKED_CONTACT_FIELDS} }
      }`,
      { contactId, reason },
    ).then((d) => d.blockContact),

  unblockContact: (contactId) =>
    gql(
      `mutation UnblockContact($contactId: ID!) {
        unblockContact(contactId: $contactId)
      }`,
      { contactId },
    ).then((d) => d.unblockContact),
};

const PREFS_FIELDS =
  "user_id theme wallpaper chat_color font_size enter_is_send archive_keep backup_freq last_backup_at ai_wallpaper_url media_auto_download show_read_receipts notifications_enabled updated_at";

export const userPrefsApi = {
  getPreferences: () =>
    gql(`query { userPreferences { ${PREFS_FIELDS} } }`).then(
      (d) => d.userPreferences,
    ),

  updatePreferences: (prefs) =>
    gql(
      `mutation UpdatePrefs($prefs: UserPreferencesInput!) {
        updateUserPreferences(prefs: $prefs) { ${PREFS_FIELDS} }
      }`,
      { prefs },
    ).then((d) => d.updateUserPreferences),
};

// ─── Media Upload ─────────────────────────────────────────────────────────────
const UPLOAD_ENDPOINT =
  process.env.REACT_APP_UPLOAD_URL || "http://localhost:4000/upload";

export const mediaApi = {
  uploadMedia: async (file, onProgress) => {
    const token = localStorage.getItem("wa_token");
    const formData = new FormData();
    formData.append("media", file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${UPLOAD_ENDPOINT}/media`);
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) resolve(data);
          else reject(new Error(data.error || "Upload failed"));
        } catch {
          reject(new Error("Upload failed"));
        }
      };
      xhr.onerror = () => reject(new Error("Network error"));
      xhr.send(formData);
    });
  },
};

// ─── API shim aliases used by new components ─────────────────────────────────

// broadcastApi aliases
broadcastApi.list = broadcastApi.getLists;
broadcastApi.create = ({ name }) => broadcastApi.createList(name, []);

// devicesApi aliases
devicesApi.list = devicesApi.getDevices;
devicesApi.remove = devicesApi.removeDevice;
devicesApi.generateQr = () => devicesApi.generateQR();

// privacyApi aliases
privacyApi.get = privacyApi.getPrivacySettings;
privacyApi.update = (s) => privacyApi.updatePrivacySettings(s);

// messagesApi aliases
messagesApi.unstarById = (id) =>
  gql(
    `mutation UnstarMessage($messageId: ID!) { unstarMessage(messageId: $messageId) }`,
    { messageId: id },
  ).then((d) => d.unstarMessage);

// statusApi aliases
statusApi.create = ({ content, mediaUrl, mediaType }) =>
  statusApi.createStatus({ type: mediaType || "text", content, mediaUrl });
statusApi.getOthersStatuses = () =>
  statusApi
    .getStatusFeed()
    .then((feed) =>
      (feed || []).map((f) => ({ user: f.user, statuses: f.statuses })),
    );
