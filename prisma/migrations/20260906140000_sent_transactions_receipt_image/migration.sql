-- A photo/scan attached to the transaction at creation time (physical
-- receipt, ID, proof of payment), uploaded to Cloudflare R2. Optional —
-- R2 may not be configured, in which case this simply stays NULL.
ALTER TABLE "sent_transactions" ADD COLUMN "receipt_image_url" TEXT;
