/**
 * @file src/routes/upload.js
 * @description File upload endpoints for avatars, chat media, and status media.
 *
 * All routes require a valid Bearer JWT.
 * Files are stored in Supabase Storage and the public URL is returned to the caller.
 *
 * Endpoint summary:
 *   POST /upload/avatar  — profile photo (images only, 5 MB limit)
 *   POST /upload/media   — chat attachment (image/video/audio/doc, 50 MB limit)
 *   POST /upload/status  — status story media (image/video, 30 MB limit)
 */

import { Router } from "express";
import multer from "multer";
import { supabase } from "../config/supabase.js";
import { getUserFromToken } from "../middleware/auth.js";
import { getAdminFromRequest } from "../middleware/adminAuth.js";

const router = Router();

// ─── Auth guard ───────────────────────────────────────────────────────────────

/**
 * Express middleware that validates the Bearer token for either a regular user
 * or an admin, and attaches the resolved identity to `req.user`.
 * Responds with 401 if neither resolves.
 */
async function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  const [user, admin] = await Promise.all([
    getUserFromToken(token),
    getAdminFromRequest(req),
  ]);

  const identity = user || admin;
  if (!identity) return res.status(401).json({ error: "Unauthorized" });
  req.user = identity;
  next();
}

// ─── Multer factories ─────────────────────────────────────────────────────────

/**
 * Build a multer instance with memory storage, a file-size cap, and an
 * optional MIME-type allowlist.
 *
 * @param {number}    maxBytes
 * @param {string[]}  allowedPrefixes - e.g. ['image/', 'video/']
 * @returns {multer.Multer}
 */
function buildUploader(maxBytes, allowedPrefixes) {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxBytes },
    fileFilter: (_req, file, cb) => {
      const allowed = allowedPrefixes.some((p) => file.mimetype.startsWith(p));
      allowed
        ? cb(null, true)
        : cb(new Error("File type not permitted"), false);
    },
  });
}

const avatarUpload = buildUploader(5 * 1024 * 1024, ["image/"]);
const mediaUpload = buildUploader(50 * 1024 * 1024, [
  "image/",
  "video/",
  "audio/",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument",
  "text/",
]);
const statusUpload = buildUploader(30 * 1024 * 1024, ["image/", "video/"]);

// ─── Storage helpers ──────────────────────────────────────────────────────────

/**
 * Ensure a Supabase Storage bucket exists, creating it (public) if it does not.
 * @param {string} bucketName
 */
async function ensureBucket(bucketName) {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === bucketName);
  if (!exists) {
    const { error } = await supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 52_428_800,
    });
    if (error && !error.message?.includes("already exists")) {
      throw new Error(`Cannot create bucket "${bucketName}": ${error.message}`);
    }
  }
}

/**
 * Upload a buffer to Supabase Storage and return the public URL.
 *
 * @param {string} bucket
 * @param {string} path
 * @param {Buffer} buffer
 * @param {string} contentType
 * @param {boolean} upsert
 * @returns {Promise<string>} Public URL
 */
async function uploadToStorage(
  bucket,
  path,
  buffer,
  contentType,
  upsert = true,
) {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, { contentType, upsert });
  if (error) throw error;

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
  if (!urlData?.publicUrl) throw new Error("Could not retrieve public URL.");
  return urlData.publicUrl;
}

/**
 * Resolve the best available media bucket, falling back to 'avatars'.
 * @returns {Promise<string>}
 */
async function resolveMediaBucket() {
  try {
    await ensureBucket("media");
    return "media";
  } catch {
    return "avatars";
  }
}

/** Derive a simple media type label from a MIME type string. */
function labelFromMime(mime) {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return "document";
}

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * POST /upload/avatar
 * Field name: "avatar"
 * Returns: { url: string }
 */
router.post(
  "/avatar",
  requireAuth,
  avatarUpload.single("avatar"),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ error: "No file provided." });

      const { id: userId } = req.user;
      const ext = (
        req.file.originalname.split(".").pop() ?? "jpg"
      ).toLowerCase();
      // Deterministic path — re-uploads automatically replace the previous avatar
      const path = `${userId}/avatar.${ext}`;

      await ensureBucket("avatars");
      const url = await uploadToStorage(
        "avatars",
        path,
        req.file.buffer,
        req.file.mimetype,
        true,
      );

      // Keep the users table in sync
      await supabase.from("users").update({ avatar_url: url }).eq("id", userId);

      return res.json({ url });
    } catch (err) {
      console.error("[upload/avatar]", err.message);
      return res.status(500).json({ error: err.message ?? "Upload failed." });
    }
  },
);

/**
 * POST /upload/media
 * Field name: "media"
 * Returns: { url, name, size, mimeType, type }
 */
router.post(
  "/media",
  requireAuth,
  mediaUpload.single("media"),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ error: "No file provided." });

      const { id: userId } = req.user;
      // Sanitise filename to prevent path-traversal or special-char issues
      const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${userId}/${Date.now()}_${safeName}`;
      const bucket = await resolveMediaBucket();
      const url = await uploadToStorage(
        bucket,
        path,
        req.file.buffer,
        req.file.mimetype,
        true,
      );

      return res.json({
        url,
        name: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
        type: labelFromMime(req.file.mimetype),
      });
    } catch (err) {
      console.error("[upload/media]", err.message);
      return res.status(500).json({ error: err.message ?? "Upload failed." });
    }
  },
);

/**
 * POST /upload/status
 * Field name: "status"
 * Returns: { url, type }
 */
router.post(
  "/status",
  requireAuth,
  statusUpload.single("status"),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ error: "No file provided." });

      const { id: userId } = req.user;
      const ext = (
        req.file.originalname.split(".").pop() ?? "jpg"
      ).toLowerCase();
      const path = `${userId}/status_${Date.now()}.${ext}`;
      const bucket = await resolveMediaBucket();
      const url = await uploadToStorage(
        bucket,
        path,
        req.file.buffer,
        req.file.mimetype,
        false,
      );

      return res.json({ url, type: labelFromMime(req.file.mimetype) });
    } catch (err) {
      console.error("[upload/status]", err.message);
      return res.status(500).json({ error: err.message ?? "Upload failed." });
    }
  },
);

export { router as uploadRouter };
