"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createLogoUploadUrlAction } from "@/lib/actions/upload-actions";

export function LogoUpload({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setIsUploading(true);
    try {
      const prep = await createLogoUploadUrlAction(file.name, file.type);
      if (!prep.success) {
        toast.error(prep.error);
        return;
      }

      const putResult = await fetch(prep.uploadUrl, {
        method: "PUT",
        headers: { "content-type": file.type },
        body: file,
      });
      if (!putResult.ok) {
        toast.error("Upload failed — please try again.");
        return;
      }

      onChange(prep.publicUrl);
      toast.success("Logo uploaded");
    } catch {
      toast.error("Upload failed — please try again.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-hairline bg-void">
        {value ? (
          <Image src={value} alt="Company logo" width={64} height={64} className="h-full w-full object-contain" unoptimized />
        ) : (
          <span className="text-xs text-text-muted">No logo</span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        className="hidden"
        onChange={handleFileChange}
      />
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
            <Upload size={14} /> {value ? "Change Logo" : "Upload Logo"}
          </>
        )}
      </Button>
    </div>
  );
}
