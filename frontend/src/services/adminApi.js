/**
 * @file src/services/adminApi.js
 * @description Admin GraphQL API client — mirrors the BE admin schema 1:1.
 *
 * ALL listing APIs use server-side limit/offset pagination.
 * Default page size: ADMIN_PAGE_SIZE (10). Callers can override.
 */

const GQL_ENDPOINT =
  process.env.REACT_APP_GQL_URL || "http://localhost:4000/graphql";

export const TOKEN_KEY = "admin_token";
export const USER_KEY = "admin_user";

/** Default rows-per-page used by every admin list query. */
export const ADMIN_PAGE_SIZE = 10;

// ─── Core transport ──────────────────────────────────────────────────────────

async function gql(query, variables = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(GQL_ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();

  if (json.errors?.length) {
    const err = json.errors[0];
    if (err.extensions?.code === "UNAUTHENTICATED" || res.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.location.href = "/admin/login";
    }
    throw new Error(err.message || "GraphQL error");
  }

  return json.data;
}

// ─── GQL fragment constants ───────────────────────────────────────────────────

const ADMIN_FIELDS = `id username full_name email phone avatar_url about created_at`;

const USER_FIELDS = `
  id username full_name email phone avatar_url about status last_seen created_at
`;

const EMOJI_CAT_FIELDS = `id category_name status created_at updated_at`;
const EMOJI_FIELDS = `
  id emoji status created_at updated_at
  category { id category_name }
`;

const THEME_CAT_FIELDS = `id category_name status created_at updated_at`;
const THEME_COLOR_FIELDS = `
  id color_name color_code status created_at updated_at
  category { id category_name }
`;

const WALLPAPER_CAT_FIELDS = `id category_name status created_at updated_at`;
const WALLPAPER_FIELDS = `
  id title image_url status created_at updated_at
  category { id category_name }
`;

const FEEDBACK_FIELDS = `
  id rating message created_at
  user { id username full_name email avatar_url }
`;

const CONTACT_US_FIELDS = `
  id name email phone subject message is_read created_at updated_at
`;

const CMS_FIELDS = `id slug title content updated_at`;

const FAQ_FIELDS = `id question answer sort_order status created_at updated_at`;

const ADMIN_FULL_FIELDS = `
  id username email full_name phone avatar_url about
  facebook instagram linkedin twitter created_at
`;

// ─── Admin Auth ───────────────────────────────────────────────────────────────

export const adminAuthApi = {
  login: (identifier, password) =>
    gql(
      `mutation AdminLogin($identifier: String!, $password: String!) {
        adminLogin(identifier: $identifier, password: $password) {
          token
          admin { ${ADMIN_FIELDS} }
        }
      }`,
      { identifier, password },
    ).then((d) => d.adminLogin),

  register: (username, email, password) =>
    gql(
      `mutation AdminRegister($username: String!, $email: String!, $password: String!) {
        adminRegister(username: $username, email: $email, password: $password) {
          token
          admin { ${ADMIN_FIELDS} }
        }
      }`,
      { username, email, password },
    ).then((d) => d.adminRegister),
};

// ─── Users (server-paginated) ─────────────────────────────────────────────────

export const adminUsersApi = {
  /**
   * @param {number} limit   rows per page
   * @param {number} offset  row offset = page * limit
   * @param {string} search  optional search string (server-side)
   * @returns {Promise<{ users: object[], total: number }>}
   */
  getAll: (limit = ADMIN_PAGE_SIZE, offset = 0, search = "") =>
    gql(
      `query AdminUsers($limit: Int, $offset: Int, $search: String) {
        adminUsers(limit: $limit, offset: $offset, search: $search) {
          total
          users { ${USER_FIELDS} }
        }
      }`,
      { limit, offset, search: search || undefined },
    ).then((d) => d.adminUsers),

  setStatus: (userId, status) =>
    gql(
      `mutation AdminSetUserStatus($userId: ID!, $status: Int!) {
        adminSetUserStatus(userId: $userId, status: $status) { ${USER_FIELDS} }
      }`,
      { userId, status },
    ).then((d) => d.adminSetUserStatus),
};

// ─── Emoji Categories (non-paginated — categories are small look-up sets) ─────

export const adminEmojiCatApi = {
  getAll: () =>
    gql(`query { adminEmojiCategories { ${EMOJI_CAT_FIELDS} } }`).then(
      (d) => d.adminEmojiCategories,
    ),

  create: (input) =>
    gql(
      `mutation AdminCreateEmojiCategory($input: EmojiCategoryInput!) {
        adminCreateEmojiCategory(input: $input) { ${EMOJI_CAT_FIELDS} }
      }`,
      { input },
    ).then((d) => d.adminCreateEmojiCategory),

  update: (id, input) =>
    gql(
      `mutation AdminUpdateEmojiCategory($id: ID!, $input: EmojiCategoryUpdateInput!) {
        adminUpdateEmojiCategory(id: $id, input: $input) { ${EMOJI_CAT_FIELDS} }
      }`,
      { id, input },
    ).then((d) => d.adminUpdateEmojiCategory),

  delete: (id) =>
    gql(
      `mutation AdminDeleteEmojiCategory($id: ID!) { adminDeleteEmojiCategory(id: $id) }`,
      { id },
    ).then((d) => d.adminDeleteEmojiCategory),
};

// ─── Emojis (server-paginated) ────────────────────────────────────────────────

export const adminEmojiApi = {
  /**
   * @param {{ categoryId?, limit?, offset?, search? }} params
   * @returns {Promise<{ items: object[], total: number }>}
   */
  getAll: ({ categoryId, limit = ADMIN_PAGE_SIZE, offset = 0, search } = {}) =>
    gql(
      `query AdminEmojis($categoryId: ID, $limit: Int, $offset: Int, $search: String) {
        adminEmojis(categoryId: $categoryId, limit: $limit, offset: $offset, search: $search) {
          total
          totalActive
          totalInactive
          items { ${EMOJI_FIELDS} }
        }
      }`,
      {
        categoryId: categoryId || undefined,
        limit,
        offset,
        search: search || undefined,
      },
    ).then((d) => d.adminEmojis),

  create: (input) =>
    gql(
      `mutation AdminCreateEmoji($input: EmojiInput!) {
        adminCreateEmoji(input: $input) { ${EMOJI_FIELDS} }
      }`,
      { input },
    ).then((d) => d.adminCreateEmoji),

  update: (id, input) =>
    gql(
      `mutation AdminUpdateEmoji($id: ID!, $input: EmojiUpdateInput!) {
        adminUpdateEmoji(id: $id, input: $input) { ${EMOJI_FIELDS} }
      }`,
      { id, input },
    ).then((d) => d.adminUpdateEmoji),

  delete: (id) =>
    gql(`mutation AdminDeleteEmoji($id: ID!) { adminDeleteEmoji(id: $id) }`, {
      id,
    }).then((d) => d.adminDeleteEmoji),
};

// ─── Theme Color Categories (non-paginated) ───────────────────────────────────

export const adminThemeCatApi = {
  getAll: () =>
    gql(`query { adminThemeColorCategories { ${THEME_CAT_FIELDS} } }`).then(
      (d) => d.adminThemeColorCategories,
    ),

  create: (input) =>
    gql(
      `mutation AdminCreateThemeColorCategory($input: ThemeColorCategoryInput!) {
        adminCreateThemeColorCategory(input: $input) { ${THEME_CAT_FIELDS} }
      }`,
      { input },
    ).then((d) => d.adminCreateThemeColorCategory),

  update: (id, input) =>
    gql(
      `mutation AdminUpdateThemeColorCategory($id: ID!, $input: ThemeColorCategoryUpdateInput!) {
        adminUpdateThemeColorCategory(id: $id, input: $input) { ${THEME_CAT_FIELDS} }
      }`,
      { id, input },
    ).then((d) => d.adminUpdateThemeColorCategory),

  delete: (id) =>
    gql(
      `mutation AdminDeleteThemeColorCategory($id: ID!) { adminDeleteThemeColorCategory(id: $id) }`,
      { id },
    ).then((d) => d.adminDeleteThemeColorCategory),
};

// ─── Theme Colors (server-paginated) ─────────────────────────────────────────

export const adminThemeColorApi = {
  /**
   * @param {{ categoryId?, limit?, offset?, search? }} params
   * @returns {Promise<{ items: object[], total: number }>}
   */
  getAll: ({ categoryId, limit = ADMIN_PAGE_SIZE, offset = 0, search } = {}) =>
    gql(
      `query AdminThemeColors($categoryId: ID, $limit: Int, $offset: Int, $search: String) {
        adminThemeColors(categoryId: $categoryId, limit: $limit, offset: $offset, search: $search) {
          total
          totalActive
          totalInactive
          items { ${THEME_COLOR_FIELDS} }
        }
      }`,
      {
        categoryId: categoryId || undefined,
        limit,
        offset,
        search: search || undefined,
      },
    ).then((d) => d.adminThemeColors),

  create: (input) =>
    gql(
      `mutation AdminCreateThemeColor($input: ThemeColorInput!) {
        adminCreateThemeColor(input: $input) { ${THEME_COLOR_FIELDS} }
      }`,
      { input },
    ).then((d) => d.adminCreateThemeColor),

  update: (id, input) =>
    gql(
      `mutation AdminUpdateThemeColor($id: ID!, $input: ThemeColorUpdateInput!) {
        adminUpdateThemeColor(id: $id, input: $input) { ${THEME_COLOR_FIELDS} }
      }`,
      { id, input },
    ).then((d) => d.adminUpdateThemeColor),

  delete: (id) =>
    gql(
      `mutation AdminDeleteThemeColor($id: ID!) { adminDeleteThemeColor(id: $id) }`,
      { id },
    ).then((d) => d.adminDeleteThemeColor),
};

// ─── Wallpaper Categories (non-paginated) ─────────────────────────────────────

export const adminWallpaperCatApi = {
  getAll: () =>
    gql(`query { adminWallpaperCategories { ${WALLPAPER_CAT_FIELDS} } }`).then(
      (d) => d.adminWallpaperCategories,
    ),

  create: (input) =>
    gql(
      `mutation AdminCreateWallpaperCategory($input: WallpaperCategoryInput!) {
        adminCreateWallpaperCategory(input: $input) { ${WALLPAPER_CAT_FIELDS} }
      }`,
      { input },
    ).then((d) => d.adminCreateWallpaperCategory),

  update: (id, input) =>
    gql(
      `mutation AdminUpdateWallpaperCategory($id: ID!, $input: WallpaperCategoryUpdateInput!) {
        adminUpdateWallpaperCategory(id: $id, input: $input) { ${WALLPAPER_CAT_FIELDS} }
      }`,
      { id, input },
    ).then((d) => d.adminUpdateWallpaperCategory),

  delete: (id) =>
    gql(
      `mutation AdminDeleteWallpaperCategory($id: ID!) { adminDeleteWallpaperCategory(id: $id) }`,
      { id },
    ).then((d) => d.adminDeleteWallpaperCategory),
};

// ─── Wallpapers (server-paginated) ────────────────────────────────────────────

export const adminWallpaperApi = {
  /**
   * @param {{ categoryId?, limit?, offset?, search? }} params
   * @returns {Promise<{ items: object[], total: number }>}
   */
  getAll: ({ categoryId, limit = ADMIN_PAGE_SIZE, offset = 0, search } = {}) =>
    gql(
      `query AdminWallpapers($categoryId: ID, $limit: Int, $offset: Int, $search: String) {
        adminWallpapers(categoryId: $categoryId, limit: $limit, offset: $offset, search: $search) {
          total
          totalActive
          totalInactive
          items { ${WALLPAPER_FIELDS} }
        }
      }`,
      {
        categoryId: categoryId || undefined,
        limit,
        offset,
        search: search || undefined,
      },
    ).then((d) => d.adminWallpapers),

  create: (input) =>
    gql(
      `mutation AdminCreateWallpaper($input: ChatWallpaperInput!) {
        adminCreateWallpaper(input: $input) { ${WALLPAPER_FIELDS} }
      }`,
      { input },
    ).then((d) => d.adminCreateWallpaper),

  update: (id, input) =>
    gql(
      `mutation AdminUpdateWallpaper($id: ID!, $input: ChatWallpaperUpdateInput!) {
        adminUpdateWallpaper(id: $id, input: $input) { ${WALLPAPER_FIELDS} }
      }`,
      { id, input },
    ).then((d) => d.adminUpdateWallpaper),

  delete: (id) =>
    gql(
      `mutation AdminDeleteWallpaper($id: ID!) { adminDeleteWallpaper(id: $id) }`,
      { id },
    ).then((d) => d.adminDeleteWallpaper),
};

// ─── Feedback (server-paginated) ──────────────────────────────────────────────

export const adminFeedbackApi = {
  getAll: (limit = ADMIN_PAGE_SIZE, offset = 0) =>
    gql(
      `query AdminFeedback($limit: Int, $offset: Int) {
        adminFeedback(limit: $limit, offset: $offset) {
          total
          items { ${FEEDBACK_FIELDS} }
        }
      }`,
      { limit, offset },
    ).then((d) => d.adminFeedback),
};

// ─── Contact Us (server-paginated) ────────────────────────────────────────────

export const adminContactUsApi = {
  getAll: (limit = ADMIN_PAGE_SIZE, offset = 0) =>
    gql(
      `query AdminContactUs($limit: Int, $offset: Int) {
        adminContactUs(limit: $limit, offset: $offset) {
          total
          items { ${CONTACT_US_FIELDS} }
        }
      }`,
      { limit, offset },
    ).then((d) => d.adminContactUs),

  markRead: (id) =>
    gql(
      `mutation AdminMarkContactUsRead($id: ID!) {
        adminMarkContactUsRead(id: $id) { ${CONTACT_US_FIELDS} }
      }`,
      { id },
    ).then((d) => d.adminMarkContactUsRead),
};

// ─── CMS Pages ────────────────────────────────────────────────────────────────

export const adminCmsApi = {
  getPrivacyPolicy: () =>
    gql(`query { adminPrivacyPolicy { ${CMS_FIELDS} } }`).then(
      (d) => d.adminPrivacyPolicy,
    ),

  getTermsConditions: () =>
    gql(`query { adminTermsConditions { ${CMS_FIELDS} } }`).then(
      (d) => d.adminTermsConditions,
    ),

  upsertPrivacyPolicy: (title, content) =>
    gql(
      `mutation AdminUpsertPrivacyPolicy($title: String!, $content: String!) {
        adminUpsertPrivacyPolicy(title: $title, content: $content) { ${CMS_FIELDS} }
      }`,
      { title, content },
    ).then((d) => d.adminUpsertPrivacyPolicy),

  upsertTermsConditions: (title, content) =>
    gql(
      `mutation AdminUpsertTermsConditions($title: String!, $content: String!) {
        adminUpsertTermsConditions(title: $title, content: $content) { ${CMS_FIELDS} }
      }`,
      { title, content },
    ).then((d) => d.adminUpsertTermsConditions),
};

// ─── FAQs ─────────────────────────────────────────────────────────────────────

export const adminFaqApi = {
  getAll: (includeInactive = true) =>
    gql(
      `query AdminFaqs($includeInactive: Boolean) {
        adminFaqs(includeInactive: $includeInactive) { ${FAQ_FIELDS} }
      }`,
      { includeInactive },
    ).then((d) => d.adminFaqs),

  getOne: (id) =>
    gql(`query AdminFaq($id: ID!) { adminFaq(id: $id) { ${FAQ_FIELDS} } }`, {
      id,
    }).then((d) => d.adminFaq),

  create: (input) =>
    gql(
      `mutation AdminCreateFaq($input: FaqInput!) {
        adminCreateFaq(input: $input) { ${FAQ_FIELDS} }
      }`,
      { input },
    ).then((d) => d.adminCreateFaq),

  update: (id, input) =>
    gql(
      `mutation AdminUpdateFaq($id: ID!, $input: FaqUpdateInput!) {
        adminUpdateFaq(id: $id, input: $input) { ${FAQ_FIELDS} }
      }`,
      { id, input },
    ).then((d) => d.adminUpdateFaq),

  delete: (id) =>
    gql(`mutation AdminDeleteFaq($id: ID!) { adminDeleteFaq(id: $id) }`, {
      id,
    }).then((d) => d.adminDeleteFaq),
};

// ─── Admin Profile ────────────────────────────────────────────────────────────

export const adminProfileApi = {
  getMe: () =>
    gql(`query { adminMe { ${ADMIN_FULL_FIELDS} } }`).then((d) => d.adminMe),

  updateProfile: (fields) =>
    gql(
      `mutation AdminUpdateProfile(
        $fullName: String $phone: String $about: String $avatarUrl: String
        $facebook: String $instagram: String $linkedin: String $twitter: String
      ) {
        adminUpdateProfile(
          fullName: $fullName phone: $phone about: $about avatarUrl: $avatarUrl
          facebook: $facebook instagram: $instagram linkedin: $linkedin twitter: $twitter
        ) { ${ADMIN_FULL_FIELDS} }
      }`,
      {
        fullName: fields.fullName ?? undefined,
        phone: fields.phone ?? undefined,
        about: fields.about ?? undefined,
        avatarUrl: fields.avatarUrl ?? undefined,
        facebook: fields.facebook ?? undefined,
        instagram: fields.instagram ?? undefined,
        linkedin: fields.linkedin ?? undefined,
        twitter: fields.twitter ?? undefined,
      },
    ).then((d) => d.adminUpdateProfile),

  changePassword: (oldPassword, newPassword) =>
    gql(
      `mutation AdminChangePassword($oldPassword: String!, $newPassword: String!) {
        adminChangePassword(oldPassword: $oldPassword, newPassword: $newPassword)
      }`,
      { oldPassword, newPassword },
    ).then((d) => d.adminChangePassword),
};

export default gql;
