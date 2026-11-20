
"use client";

import { useRef, useState, type DragEvent, type ChangeEvent } from "react";
import { supabase } from "@/lib/supabase-client";

type NomineeImageUploadProps = {
  userId: string;
  projectId: string | number;
  imageUrl: string | null;
  onUploaded: (file: File, url: string) => void;
  onRemove: () => void;
};

export default function NomineeImageUpload({
  userId,
  projectId,
  imageUrl,
  onUploaded,
  onRemove,
}: NomineeImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  const uploadImage = async (file: File) => {
    setError("");

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must not exceed 5MB.");
      return;
    }

    setUploading(true);
    setSelectedFile(file);

    try {
      const safeFileName = file.name.replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
      );

      const filePath = `${userId}/${projectId}/${Date.now()}-${safeFileName}`;

      const { error: uploadError } = await supabase.storage
        .from("nominee_images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("nominee_images")
        .getPublicUrl(filePath);

      onUploaded(file, data.publicUrl);
    } catch (err: unknown) {
      setSelectedFile(null);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to upload this image."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      void uploadImage(file);
    }

    // Allows selecting the same file again.
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);

    const file = event.dataTransfer.files?.[0];

    if (file) {
      void uploadImage(file);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setError("");
    onRemove();

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {imageUrl ? (
        /* Uploaded image preview */
        <div className="group relative overflow-hidden rounded-2xl border border-emerald-400/20 bg-black/20 p-3">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="relative h-36 w-36 shrink-0 overflow-hidden rounded-xl border border-emerald-400/20 bg-black/30">
              <img
                src={imageUrl}
                alt="Uploaded nominee"
                className="h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-emerald-500/0 transition group-hover:bg-emerald-500/10" />
            </div>

            <div className="min-w-0 flex-1 text-center sm:text-left">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                  Upload complete
                </span>
              </div>

              <h3 className="text-sm font-semibold text-white">
                Image uploaded successfully
              </h3>

              <p className="mt-1 break-all text-xs leading-5 text-white/40">
                {selectedFile?.name || "Nominee image"}
              </p>

              <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="rounded-lg border border-emerald-400/20 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/10"
                >
                  Change image
                </button>

                <button
                  type="button"
                  onClick={handleRemove}
                  className="rounded-lg border border-red-400/20 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/10"
                >
                  Remove image
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Upload area */
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setDragging(false);
          }}
          onDrop={handleDrop}
          onClick={() => {
            if (!uploading) inputRef.current?.click();
          }}
          className={`group relative flex min-h-48 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed px-5 py-8 text-center transition duration-200 ${
            dragging
              ? "border-emerald-300 bg-emerald-400/10"
              : "border-emerald-400/25 bg-black/20 hover:border-emerald-400/60 hover:bg-emerald-400/[0.05]"
          } ${uploading ? "cursor-wait" : ""}`}
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300 transition group-hover:scale-105 group-hover:bg-emerald-400/15">
            {uploading ? (
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-300/20 border-t-emerald-300" />
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-7 w-7"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 16V4m0 0L7 9m5-5 5 5" />
                <path d="M20 16.5v2A1.5 1.5 0 0 1 18.5 20h-13A1.5 1.5 0 0 1 4 18.5v-2" />
              </svg>
            )}
          </div>

          <h3 className="text-sm font-semibold text-white">
            {uploading
              ? "Uploading your image..."
              : dragging
                ? "Drop your image here"
                : "Upload nominee image"}
          </h3>

          <p className="mt-2 max-w-xs text-xs leading-5 text-white/40">
            {uploading
              ? "Please wait while your image is being uploaded."
              : "Drag and drop an image here, or click to browse your device."}
          </p>



          <p className="mt-3 text-[10px] text-white/25">
            Maximum size: 5MB
          </p>
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-300"
        >
          {error}
        </p>
      )}
    </div>
  );
}
