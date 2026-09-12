import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";

// Presigned PUT URLs can't enforce a max size — only a policy-based presigned
// POST can (via a content-length-range condition), so uploads use POST even
// though a plain PUT would otherwise be simpler.
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB

interface R2Config {
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  endpoint: string;
  publicUrl: string;
}

function getR2Config(): R2Config | null {
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;
  const endpoint = process.env.R2_ENDPOINT;
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!accessKeyId || !secretAccessKey || !bucket || !endpoint || !publicUrl) {
    return null;
  }
  return { accessKeyId, secretAccessKey, bucket, endpoint, publicUrl };
}

/** Whether R2 credentials are present — callers should degrade gracefully (no upload option) when false, never throw. */
export function isR2Configured(): boolean {
  return getR2Config() !== null;
}

let cachedClient: S3Client | null = null;
let cachedEndpoint: string | null = null;

function getClient(config: R2Config): S3Client {
  if (!cachedClient || cachedEndpoint !== config.endpoint) {
    cachedClient = new S3Client({
      region: "auto",
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
    cachedEndpoint = config.endpoint;
  }
  return cachedClient;
}

/**
 * A presigned POST policy the browser uploads directly to — the file bytes
 * never pass through our server. Enforces the exact content-type and a max
 * size (MAX_UPLOAD_BYTES) as signed policy conditions, so R2 itself rejects
 * an oversized or mismatched-type upload rather than trusting the client.
 * Returns the POST url + form fields to submit, and the permanent public URL
 * to store once the upload succeeds.
 */
export async function createPresignedUploadUrl(key: string, contentType: string) {
  const config = getR2Config();
  if (!config) throw new Error("R2 is not configured");

  const client = getClient(config);
  const { url, fields } = await createPresignedPost(client, {
    Bucket: config.bucket,
    Key: key,
    Conditions: [
      ["content-length-range", 0, MAX_UPLOAD_BYTES],
      ["eq", "$Content-Type", contentType],
    ],
    Fields: { "Content-Type": contentType },
    Expires: 300,
  });
  const publicUrl = `${config.publicUrl.replace(/\/$/, "")}/${key}`;

  return { uploadUrl: url, fields, publicUrl };
}
