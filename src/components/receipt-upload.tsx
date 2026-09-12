"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { Paperclip, X, Loader2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createReceiptUploadUrlAction } from "@/lib/actions/upload-actions";

export function ReceiptUpload({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    setIsUploading(true);
    try {
      const prep = await createReceiptUploadUrlAction(file.name, file.type, file.size);
      if (!prep.success) {
        toast.error(prep.error);
        return;
      }

      const formData = new FormData();
      for (const [key, value] of Object.entries(prep.fields)) {
        formData.append(key, value);
      }
      formData.append("file", file);
      const postResult = await fetch(prep.uploadUrl, { method: "POST", body: formData });
      if (!postResult.ok) {
        toast.error("Upload failed — please try again.");
        return;
      }

      onChange(prep.publicUrl);
      toast.success("Receipt image attached");
    } catch {
      toast.error("Upload failed — please try again.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        className="hidden"
        onChange={handleFileChange}
      />
      {value ? (
        <div className="flex items-center gap-2 rounded-md border border-hairline bg-void px-2.5 py-1.5 text-xs text-text-muted">
          <ImageIcon size={14} className="text-income" />
          <span>Receipt image attached</span>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-text-muted hover:text-sent"
            aria-label="Remove receipt image"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Uploading...
            </>
          ) : (
            <>
              <Paperclip size={14} /> Attach Receipt Image
            </>
          )}
        </Button>
      )}
    </div>
  );
}
