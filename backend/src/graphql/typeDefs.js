/**
 * @file src/graphql/typeDefs.js
 * @description GraphQL schema — types, queries, and mutations.
 *
 * Naming conventions:
 *   - Query/Mutation args use camelCase (GraphQL standard)
 *   - DB columns use snake_case; translation happens in resolvers/services
 *   - Every type that can be privately filtered has nullable sensitive fields
 */

export const typeDefs = /* GraphQL */ `
  scalar JSON

  # ─── USER ───────────────────────────────────────────────────────────────────

  type User {
    id: ID!
    username: String!
    full_name: String!
    email: String
    phone: String
    avatar_url: String
    about: String
    status: String
    last_seen: String
    created_at: String
    two_step_enabled: Boolean
  }

  # ─── AUTH ────────────────────────────────────────────────────────────────────

  type AuthPayload {
    user: User!
    token: String!
  }

  type OtpSendResult {
    sent: Boolean!
    devOtp: String
  }

  type PhoneCheckResult {
    exists: Boolean!
    user: User
    token: String
  }

  # ─── MESSAGES ────────────────────────────────────────────────────────────────

  type MessageSender {
    id: ID!
    username: String!
    full_name: String!
    avatar_url: String
  }

  type ReplyTo {
    id: ID!
    content: String
    type: String
    sender: MessageSender
  }

  type Reaction {
    id: ID!
    emoji: String!
    user_id: ID!
  }

  type Message {
    id: ID!
    content: String
    type: String
    media_url: String
    media_thumbnail: String
    media_size: Int
    media_duration: Int
    is_deleted: Boolean
    is_forwarded: Boolean
    edited_at: String
    created_at: String!
    status: String
    delivered_at: String
    read_at: String
    sender: MessageSender
    reply_to: ReplyTo
    reactions: [Reaction]
    starred_at: String
    sender_name: String
  }

  # ─── CONVERSATIONS ───────────────────────────────────────────────────────────

  type ConversationParticipant {
    user: User
    role: String
    last_read_at: String
  }

  type Conversation {
    id: ID!
    type: String!
    name: String
    description: String
    avatar_url: String
    is_archived: Boolean
    is_muted: Boolean
    last_message_at: String
    last_message_id: ID
    last_read_at: String
    created_at: String
    updated_at: String
    last_message: Message
    unread_count: Int
    participants: [ConversationParticipant]
  }

  # ─── CONTACTS ────────────────────────────────────────────────────────────────

  type Contact {
    id: ID!
    nickname: String
    is_blocked: Boolean
    created_at: String
    contact: User
  }

  type BlockedContact {
    id: ID!
    is_blocked: Boolean!
    blocked_at: String
    block_reason: String
    created_at: String
    contact: User
  }

  # ─── BROADCAST ───────────────────────────────────────────────────────────────

  type BroadcastList {
    id: ID!
    name: String!
    created_at: String
    updated_at: String
    recipient_count: Int
    recipients: [User]
  }

  type BroadcastResult {
    recipientId: ID!
    conversationId: ID
    messageId: ID
    success: Boolean!
    error: String
  }

  type SendBroadcastPayload {
    sent: Int!
    failed: Int!
    total: Int!
    results: [BroadcastResult]
  }

  # ─── STATUS (Stories) ────────────────────────────────────────────────────────

  type UserStatus {
    id: ID!
    type: String!
    content: String
    media_url: String
    bg_color: String
    expires_at: String!
    created_at: String!
    user: User!
    view_count: Int
  }

  type StatusViewer {
    viewer_id: ID!
    viewed_at: String!
    viewer: User!
  }

  type StatusGroup {
    user: User!
    statuses: [UserStatus!]!
    has_unseen: Boolean!
  }

  # ─── PREFERENCES ─────────────────────────────────────────────────────────────

  type UserPreferences {
    user_id: ID!
    theme: String!
    wallpaper: String!
    chat_color: String!
    font_size: String!
    enter_is_send: Boolean!
    archive_keep: Boolean!
    backup_freq: String!
    last_backup_at: String
    ai_wallpaper_url: String
    media_auto_download: Boolean!
    show_read_receipts: Boolean!
    notifications_enabled: Boolean!
    updated_at: String
  }

  input UserPreferencesInput {
    theme: String
    wallpaper: String
    chatColor: String
    fontSize: String
    enterIsSend: Boolean
    archiveKeep: Boolean
    backupFreq: String
    aiWallpaperUrl: String
    mediaAutoDownload: Boolean
    showReadReceipts: Boolean
    notificationsEnabled: Boolean
  }

  # ─── PRIVACY ─────────────────────────────────────────────────────────────────

  type PrivacySettings {
    user_id: ID!
    last_seen: String!
    profile_photo: String!
    about: String!
    status: String!
    read_receipts: Boolean!
    disappearing_messages: String!
    groups: String!
    silence_unknown_callers: Boolean!
    updated_at: String
  }

  input PrivacySettingsInput {
    lastSeen: String
    profilePhoto: String
    about: String
    status: String
    readReceipts: Boolean
    disappearingMessages: String
    groups: String
    silenceUnknownCallers: Boolean
  }

  # ─── DEVICES ─────────────────────────────────────────────────────────────────

  type Device {
    id: ID!
    device_name: String
    device_info: JSON
    is_active: Boolean
    created_at: String
  }

  type QRResponse {
    token: String
  }

  # ═══════════════════════════════════════════════════════════════════════════
  # ADMIN MODULE TYPES
  # ═══════════════════════════════════════════════════════════════════════════

  # ─── ADMIN AUTH ──────────────────────────────────────────────────────────────

  type Admin {
    id: ID!
    username: String!
    email: String!
    full_name: String
    phone: String
    avatar_url: String
    about: String
    facebook: String
    instagram: String
    linkedin: String
    twitter: String
    created_at: String
  }

  type AdminAuthPayload {
    admin: Admin!
    token: String!
  }

  # ─── ADMIN USER MANAGEMENT ───────────────────────────────────────────────────

  type AdminUserListPayload {
    users: [User!]!
    total: Int!
  }

  # ─── EMOJI CATEGORY ──────────────────────────────────────────────────────────

  type EmojiCategory {
    id: ID!
    category_name: String!
    status: Int!
    created_at: String
    updated_at: String
  }

  input EmojiCategoryInput {
    categoryName: String!
    status: Int
  }

  input EmojiCategoryUpdateInput {
    categoryName: String
    status: Int
  }

  # ─── EMOJI ───────────────────────────────────────────────────────────────────

  type EmojiCategoryRef {
    id: ID!
    category_name: String!
  }

  type Emoji {
    id: ID!
    emoji: String!
    status: Int!
    created_at: String
    updated_at: String
    category: EmojiCategoryRef
  }

  input EmojiInput {
    emoji: String!
    categoryId: ID!
    status: Int
  }

  input EmojiUpdateInput {
    emoji: String
    categoryId: ID
    status: Int
  }

  # ─── CHAT THEME COLOR CATEGORIES ─────────────────────────────────────────────

  type ThemeColorCategory {
    id: ID!
    category_name: String!
    status: Int!
    created_at: String
    updated_at: String
  }

  input ThemeColorCategoryInput {
    categoryName: String!
    status: Int
  }

  input ThemeColorCategoryUpdateInput {
    categoryName: String
    status: Int
  }

  # ─── CHAT THEME COLORS ───────────────────────────────────────────────────────

  type ThemeColorCategoryRef {
    id: ID!
    category_name: String!
  }

  type ThemeColor {
    id: ID!
    color_name: String!
    color_code: String!
    status: Int!
    created_at: String
    updated_at: String
    category: ThemeColorCategoryRef
  }

  input ThemeColorInput {
    colorName: String!
    colorCode: String!
    categoryId: ID!
    status: Int
  }

  input ThemeColorUpdateInput {
    colorName: String
    colorCode: String
    categoryId: ID
    status: Int
  }

  # ─── CHAT WALLPAPER CATEGORIES ────────────────────────────────────────────────

  type WallpaperCategory {
    id: ID!
    category_name: String!
    status: Int!
    created_at: String
    updated_at: String
  }

  input WallpaperCategoryInput {
    categoryName: String!
    status: Int
  }

  input WallpaperCategoryUpdateInput {
    categoryName: String
    status: Int
  }

  # ─── CHAT WALLPAPERS ──────────────────────────────────────────────────────────

  type WallpaperCategoryRef {
    id: ID!
    category_name: String!
  }

  type ChatWallpaper {
    id: ID!
    title: String!
    image_url: String!
    status: Int!
    created_at: String
    updated_at: String
    category: WallpaperCategoryRef
  }

  input ChatWallpaperInput {
    title: String!
    imageUrl: String!
    categoryId: ID!
    status: Int
  }

  input ChatWallpaperUpdateInput {
    title: String
    imageUrl: String
    categoryId: ID
    status: Int
  }

  # ─── FEEDBACK ────────────────────────────────────────────────────────────────

  type FeedbackUser {
    id: ID!
    username: String!
    full_name: String!
    email: String
    avatar_url: String
  }

  type Feedback {
    id: ID!
    rating: Int
    message: String
    created_at: String
    user: FeedbackUser
  }

  type FeedbackListPayload {
    items: [Feedback!]!
    total: Int!
  }

  # ─── CONTACT US ──────────────────────────────────────────────────────────────

  type ContactUs {
    id: ID!
    name: String!
    email: String!
    phone: String
    subject: String
    message: String!
    is_read: Boolean!
    created_at: String
    updated_at: String
  }

  type ContactUsListPayload {
    items: [ContactUs!]!
    total: Int!
  }

  # ─── CMS PAGES ───────────────────────────────────────────────────────────────

  type CmsPage {
    id: ID!
    slug: String!
    title: String!
    content: String!
    updated_at: String
  }

  # ─── FAQ ─────────────────────────────────────────────────────────────────────

  type Faq {
    id: ID!
    question: String!
    answer: String!
    sort_order: Int!
    status: Int!
    created_at: String
    updated_at: String
  }

  input FaqInput {
    question: String!
    answer: String!
    sortOrder: Int
    status: Int
  }

  input FaqUpdateInput {
    question: String
    answer: String
    sortOrder: Int
    status: Int
  }

  # ─── QUERIES ─────────────────────────────────────────────────────────────────

  type Query {
    # Auth
    me: User

    # Users
    user(id: ID!): User
    searchUsers(query: String!): [User!]!
    contacts: [Contact!]!

    # Conversations
    conversations: [Conversation!]!
    conversation(id: ID!): Conversation

    # Messages
    messages(conversationId: ID!, limit: Int, before: String): [Message!]!
    starredMessages: [Message!]!

    # Broadcast
    broadcastLists: [BroadcastList!]!
    broadcastList(id: ID!): BroadcastList

    # Privacy
    privacySettings: PrivacySettings!
    blockedContacts: [BlockedContact!]!

    # Preferences
    userPreferences: UserPreferences!

    # Devices
    getDevices: [Device]
    generateQR: QRResponse

    # Status
    myStatuses: [UserStatus!]!
    statusFeed: [StatusGroup!]!
    statusViewers(statusId: ID!): [StatusViewer!]!

    # ── Admin Queries (require admin JWT) ──────────────────────────────────────

    adminMe: Admin!

    adminUsers(limit: Int, offset: Int, search: String): AdminUserListPayload!

    adminEmojiCategories: [EmojiCategory!]!
    adminEmojis(categoryId: ID): [Emoji!]!

    adminThemeColorCategories: [ThemeColorCategory!]!
    adminThemeColors(categoryId: ID): [ThemeColor!]!

    adminWallpaperCategories: [WallpaperCategory!]!
    adminWallpapers(categoryId: ID): [ChatWallpaper!]!

    adminFeedback(limit: Int, offset: Int): FeedbackListPayload!
    adminContactUs(limit: Int, offset: Int): ContactUsListPayload!

    adminPrivacyPolicy: CmsPage
    adminTermsConditions: CmsPage

    adminFaqs(includeInactive: Boolean): [Faq!]!
    adminFaq(id: ID!): Faq!

    # ── User Queries (require user JWT) ───────────────────────────────────────

    userEmojiCategories: [EmojiCategory!]!
    userEmojis(categoryId: ID): [Emoji!]!

    userThemeColorCategories: [ThemeColorCategory!]!
    userThemeColors(categoryId: ID): [ThemeColor!]!

    userWallpaperCategories: [WallpaperCategory!]!
    userWallpapers(categoryId: ID): [ChatWallpaper!]!

    userPrivacyPolicy: CmsPage
    userTermsConditions: CmsPage

    userFaqs: [Faq!]!
  }

  # ─── MUTATIONS ───────────────────────────────────────────────────────────────

  type Mutation {
    # Phone OTP auth
    sendOtp(phone: String!): OtpSendResult!
    phoneCheck(phone: String!, otp: String!): PhoneCheckResult!
    phoneRegister(
      phone: String!
      fullName: String!
      username: String
      avatarUrl: String
    ): AuthPayload!

    # Classic auth
    register(
      username: String!
      fullName: String!
      email: String!
      password: String!
      phone: String
    ): AuthPayload!
    login(identifier: String!, password: String!): AuthPayload!
    logout: Boolean!

    # Profile
    updateProfile(
      fullName: String
      about: String
      avatarUrl: String
      phone: String
    ): User!
    changePassword(currentPassword: String!, newPassword: String!): Boolean!
    enableTwoStep(pin: String!): Boolean!
    disableTwoStep(pin: String!): Boolean!
    changeTwoStepPin(currentPin: String!, newPin: String!): Boolean!
    deleteAccount(password: String!): Boolean!
    addContact(contactId: ID!, nickname: String): Contact!

    # Conversations
    findOrCreateDirectConversation(targetUserId: ID!): Conversation!
    createGroupConversation(
      name: String!
      participantIds: [ID!]!
      description: String
    ): Conversation!
    markConversationRead(conversationId: ID!): Boolean!

    # Messages
    sendMessage(
      conversationId: ID!
      content: String!
      type: String
      mediaUrl: String
      mediaThumbnail: String
      mediaSize: Int
      mediaDuration: Int
      replyToId: ID
      isForwarded: Boolean
    ): Message!
    editMessage(messageId: ID!, content: String!): Message!
    deleteMessage(messageId: ID!): Message!
    starMessage(messageId: ID!): Boolean!
    unstarMessage(messageId: ID!): Boolean!
    addReaction(messageId: ID!, emoji: String!): Boolean!
    removeReaction(messageId: ID!, emoji: String!): Boolean!

    # Broadcast
    createBroadcastList(name: String!, recipientIds: [ID!]!): BroadcastList!
    updateBroadcastList(id: ID!, name: String!): BroadcastList!
    deleteBroadcastList(id: ID!): Boolean!
    addBroadcastRecipients(id: ID!, recipientIds: [ID!]!): BroadcastList!
    removeBroadcastRecipient(id: ID!, recipientId: ID!): Boolean!
    sendBroadcast(
      id: ID!
      content: String!
      type: String
    ): SendBroadcastPayload!

    # Privacy
    updatePrivacySettings(settings: PrivacySettingsInput!): PrivacySettings!
    blockContact(contactId: ID!, reason: String): BlockedContact!
    unblockContact(contactId: ID!): Boolean!

    # Preferences
    updateUserPreferences(prefs: UserPreferencesInput!): UserPreferences!

    # Status
    createStatus(
      type: String!
      content: String
      mediaUrl: String
      bgColor: String
    ): UserStatus!
    deleteStatus(statusId: ID!): Boolean!
    viewStatus(statusId: ID!): Boolean!

    # Devices
    linkDevice(token: String!, deviceInfo: JSON!): Boolean
    removeDevice(deviceId: ID!): Boolean

    # ── Admin Auth ─────────────────────────────────────────────────────────────

    adminRegister(
      username: String!
      email: String!
      password: String!
    ): AdminAuthPayload!
    adminLogin(identifier: String!, password: String!): AdminAuthPayload!

    adminUpdateProfile(
      fullName: String
      phone: String
      about: String
      avatarUrl: String
      facebook: String
      instagram: String
      linkedin: String
      twitter: String
    ): Admin!

    adminChangePassword(oldPassword: String!, newPassword: String!): Boolean!

    # ── Admin: User Management ────────────────────────────────────────────────

    adminSetUserStatus(userId: ID!, status: Int!): User!

    # ── Admin: Emoji Categories ───────────────────────────────────────────────

    adminCreateEmojiCategory(input: EmojiCategoryInput!): EmojiCategory!
    adminUpdateEmojiCategory(
      id: ID!
      input: EmojiCategoryUpdateInput!
    ): EmojiCategory!
    adminDeleteEmojiCategory(id: ID!): Boolean!

    # ── Admin: Emojis ─────────────────────────────────────────────────────────

    adminCreateEmoji(input: EmojiInput!): Emoji!
    adminUpdateEmoji(id: ID!, input: EmojiUpdateInput!): Emoji!
    adminDeleteEmoji(id: ID!): Boolean!

    # ── Admin: Theme Color Categories ─────────────────────────────────────────

    adminCreateThemeColorCategory(
      input: ThemeColorCategoryInput!
    ): ThemeColorCategory!
    adminUpdateThemeColorCategory(
      id: ID!
      input: ThemeColorCategoryUpdateInput!
    ): ThemeColorCategory!
    adminDeleteThemeColorCategory(id: ID!): Boolean!

    # ── Admin: Theme Colors ───────────────────────────────────────────────────

    adminCreateThemeColor(input: ThemeColorInput!): ThemeColor!
    adminUpdateThemeColor(id: ID!, input: ThemeColorUpdateInput!): ThemeColor!
    adminDeleteThemeColor(id: ID!): Boolean!

    # ── Admin: Wallpaper Categories ───────────────────────────────────────────

    adminCreateWallpaperCategory(
      input: WallpaperCategoryInput!
    ): WallpaperCategory!
    adminUpdateWallpaperCategory(
      id: ID!
      input: WallpaperCategoryUpdateInput!
    ): WallpaperCategory!
    adminDeleteWallpaperCategory(id: ID!): Boolean!

    # ── Admin: Wallpapers ─────────────────────────────────────────────────────

    adminCreateWallpaper(input: ChatWallpaperInput!): ChatWallpaper!
    adminUpdateWallpaper(
      id: ID!
      input: ChatWallpaperUpdateInput!
    ): ChatWallpaper!
    adminDeleteWallpaper(id: ID!): Boolean!

    # ── Admin: Contact Us ─────────────────────────────────────────────────────

    adminMarkContactUsRead(id: ID!): ContactUs!

    # ── Admin: CMS Pages ──────────────────────────────────────────────────────

    adminUpsertPrivacyPolicy(title: String!, content: String!): CmsPage!
    adminUpsertTermsConditions(title: String!, content: String!): CmsPage!

    # ── Admin: FAQ ────────────────────────────────────────────────────────────

    adminCreateFaq(input: FaqInput!): Faq!
    adminUpdateFaq(id: ID!, input: FaqUpdateInput!): Faq!
    adminDeleteFaq(id: ID!): Boolean!
  }
`;
