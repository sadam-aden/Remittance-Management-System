"use server";

import { randomUUID } from "node:crypto";
import { requireSession } from "@/lib/auth-helpers";
import { isR2Configured, createPresignedUploadUrl } from "@/lib/r2";

const ALLOWED_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic"]);

export async function createReceiptUploadUrlAction(fileName: string, contentType: string) {
  await requireSession();

  if (!isR2Configured()) {
    return { success: false as const, error: "File storage isn't configured yet — ask your admin to set up R2." };
  }
  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    return { success: false as const, error: "Only JPEG, PNG, WEBP, or HEIC images are supported." };
  }

  const ext = fileName.split(".").pop()?.toLowerCase() || "jpg";
  const key = `receipts/sent/${randomUUID()}.${ext}`;

  try {
    const { uploadUrl, publicUrl } = await createPresignedUploadUrl(key, contentType);
    return { success: true as const, uploadUrl, publicUrl };
  } catch (error) {
    console.error("createReceiptUploadUrlAction failed:", error);
    return { success: false as const, error: "Failed to prepare the upload." };
  }
}

export async function createLogoUploadUrlAction(fileName: string, contentType: string) {
  await requireSession();

  if (!isR2Configured()) {
    return { success: false as const, error: "File storage isn't configured yet — ask your admin to set up R2." };
  }
  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    return { success: false as const, error: "Only JPEG, PNG, WEBP, or HEIC images are supported." };
  }

  const ext = fileName.split(".").pop()?.toLowerCase() || "png";
  // Fixed key (not a random UUID) — re-uploading replaces the one logo
  // instead of accumulating orphaned files in the bucket.
  const key = `settings/logo.${ext}`;

  try {
    const { uploadUrl, publicUrl } = await createPresignedUploadUrl(key, contentType);
    return { success: true as const, uploadUrl, publicUrl: `${publicUrl}?v=${Date.now()}` };
  } catch (error) {
    console.error("createLogoUploadUrlAction failed:", error);
    return { success: false as const, error: "Failed to prepare the upload." };
  }
}
