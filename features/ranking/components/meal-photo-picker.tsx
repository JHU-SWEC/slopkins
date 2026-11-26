"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MAX_MEAL_PHOTO_BYTES, MEAL_PHOTO_BUCKET, shrinkPhoto } from "../photo";

export type MealPhoto = {
  /** Storage path once uploaded, for logMealAction. */
  path: string | null;
  /** Local preview of the picked photo. */
  preview: string | null;
  uploading: boolean;
  error: string | null;
  pick: (file: File) => void;
  remove: () => void;
};

/**
 * State for the optional meal photo. Uploads straight to Supabase Storage as
 * soon as a photo is picked (going through the server would hit Next.js's
 * 1 MB form limit), so it's usually done by the time you tap Log.
 */
export function useMealPhoto(): MealPhoto {
  const [path, setPath] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Only the latest pick counts, if someone changes the photo mid-upload.
  const latest = useRef(0);

  // Free the preview's memory when it's replaced or the page goes away.
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  async function pick(file: File) {
    const attempt = ++latest.current;
    setError(null);
    setPath(null);
    setPreview(URL.createObjectURL(file));
    setUploading(true);

    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user.id;
    if (!userId) {
      if (attempt === latest.current) {
        setUploading(false);
        setError("Log in to add a photo.");
      }
      return;
    }

    // Shrink on the device; fall back to the original if that fails.
    let body: Blob = file;
    let extension = file.type.split("/")[1] === "png" ? "png" : file.type.split("/")[1] === "webp" ? "webp" : "jpg";
    try {
      body = await shrinkPhoto(file);
      extension = "jpg";
    } catch {
      if (file.size > MAX_MEAL_PHOTO_BYTES || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        if (attempt === latest.current) {
          setUploading(false);
          setError("That photo couldn't be used. Try a JPG or PNG under 5 MB.");
        }
        return;
      }
    }

    const objectPath = `${userId}/${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from(MEAL_PHOTO_BUCKET)
      .upload(objectPath, body, { contentType: extension === "jpg" ? "image/jpeg" : `image/${extension}` });
    if (attempt !== latest.current) return;
    setUploading(false);
    if (uploadError) {
      setError(
        /bucket not found/i.test(uploadError.message)
          ? "Photo uploads aren't set up yet."
          : "Photo upload failed. Check your connection and try again.",
      );
      return;
    }
    setPath(objectPath);
  }

  function remove() {
    latest.current++;
    // Best effort: the photo isn't on any meal yet, so tidy it up.
    if (path) void createClient().storage.from(MEAL_PHOTO_BUCKET).remove([path]);
    setPath(null);
    setPreview(null);
    setUploading(false);
    setError(null);
  }

  return { path, preview, uploading, error, pick, remove };
}

// "Add a photo" for the Your meal dialog. No capture attribute, so phones offer
// both the camera and the photo library.
export function MealPhotoPicker({ photo, disabled = false }: { photo: MealPhoto; disabled?: boolean }) {
  const input = useRef<HTMLInputElement>(null);

  function choose() {
    input.current?.click();
  }

  return (
    <div className="mb-3">
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = ""; // lets you pick the same photo again
          if (file) photo.pick(file);
        }}
      />

      {photo.preview ? (
        <div className="flex items-center gap-3">
          {/* A local blob: URL, so a plain img rather than next/image. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.preview}
            alt="Your meal photo"
            className={`size-16 shrink-0 rounded-xl object-cover ${photo.uploading ? "opacity-60" : ""}`}
          />
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-medium text-gray-700">
              {photo.uploading ? "Uploading photo…" : photo.path ? "Photo added" : "Photo not added"}
            </p>
            <div className="mt-1 flex gap-4">
              <button
                type="button"
                onClick={choose}
                disabled={disabled}
                className="py-1 font-semibold text-blue-600 disabled:opacity-40"
              >
                Change
              </button>
              <button
                type="button"
                onClick={photo.remove}
                disabled={disabled}
                className="py-1 font-semibold text-gray-500 disabled:opacity-40"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={choose}
          disabled={disabled}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-40"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="size-5"
          >
            <path d="M4 8a2 2 0 0 1 2-2h2l1.5-2h5L16 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
            <circle cx="12" cy="13" r="3.5" />
          </svg>
          Add a photo <span className="font-normal text-gray-400">(optional)</span>
        </button>
      )}

      {photo.error && (
        <p role="alert" className="mt-2 text-sm text-rose-600">
          {photo.error}
        </p>
      )}
    </div>
  );
}
