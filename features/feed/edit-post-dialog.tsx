"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useTransition } from "react";
import { timeAgo } from "@/features/auth-social/activity/shared";
import { mealPhotoSrc } from "@/features/ranking/photo";
import { editPostAction } from "./actions";
import type { FeedPost } from "./queries";

const MAX_NOTES = 500;

/**
 * "Edit post" from your post's ⋯ menu, laid out like the post itself: where
 * and when, the photo, the notes, and what was on the plate. The notes and
 * photo can be changed; nothing is saved until Save, and Remove photo can be
 * undone until then. Render it only while editing: it opens when it mounts,
 * starting from what's saved.
 */
export function EditPostDialog({ post, now, onClose }: { post: FeedPost; now: number; onClose: () => void }) {
  const { id: mealId, caption: notes, photoPath, hall, meal, dishes } = post;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState(notes ?? "");
  const [removePhoto, setRemovePhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  // Open as a modal on mount. Close it on unmount too: Next keeps hidden
  // pages alive, and an open modal would block them.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  const notesChanged = draft.trim() !== (notes ?? "");
  const changed = notesChanged || removePhoto;

  function close() {
    if (!saving) onClose();
  }

  function save() {
    if (!changed) return onClose();
    setError(null);
    startSaving(async () => {
      const result = await editPostAction(mealId, {
        notes: notesChanged ? draft.trim() : undefined,
        removePhoto,
      });
      if (result.error) setError(result.error);
      else onClose();
    });
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={`edit-post-${mealId}`}
      onCancel={(event) => {
        event.preventDefault(); // Esc: close through our state instead
        close();
      }}
      onClick={(event) => event.target === dialogRef.current && close()}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-white p-0 text-gray-900 backdrop:bg-black/40"
    >
      <div className="flex max-h-[85vh] flex-col">
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-4">
          <h2 id={`edit-post-${mealId}`} className="text-lg font-bold">
            Edit post
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="-mr-1 rounded-full px-2 text-2xl leading-none text-gray-400 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-5 py-4">
          {/* Where and when, like the post's header. */}
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-gray-900">{hall ? hall.name : "A dining hall"}</span>
            {meal && <span className="capitalize"> · {meal}</span>}
            {" · "}
            <time dateTime={post.at}>{timeAgo(post.at, now)}</time>
          </p>

          {/* The photo, same 200×200 square as the post, with Remove / Undo under it. */}
          {photoPath && (
            <div>
              <div
                className={`relative size-[200px] overflow-hidden rounded-xl bg-gray-100 transition ${
                  removePhoto ? "opacity-30 grayscale" : ""
                }`}
              >
                <Image src={mealPhotoSrc(photoPath)} alt="Your meal photo" fill sizes="200px" className="object-cover" />
              </div>
              {removePhoto ? (
                <p className="mt-2 text-sm text-gray-500">
                  Photo will be removed when you save.{" "}
                  <button
                    type="button"
                    onClick={() => setRemovePhoto(false)}
                    className="font-semibold text-brand hover:underline"
                  >
                    Undo
                  </button>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => setRemovePhoto(true)}
                  className="-ml-3 mt-1 rounded-lg px-3 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  Remove photo
                </button>
              )}
            </div>
          )}

          <div>
            <label htmlFor={`edit-notes-${mealId}`} className="block text-sm font-semibold">
              Notes
            </label>
            <textarea
              id={`edit-notes-${mealId}`}
              rows={4}
              maxLength={MAX_NOTES}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save();
              }}
              placeholder="What did you think?"
              className="mt-1 block w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 sm:text-sm"
            />
            {/* Only near the limit; the box itself stops at MAX_NOTES. */}
            {draft.length >= MAX_NOTES - 50 && (
              <p className="mt-1 text-right text-xs text-gray-400 tabular-nums">
                {MAX_NOTES - draft.length} left
              </p>
            )}
          </div>

          {/* What was on the plate (not editable yet). */}
          {dishes.length > 0 && (
            <div>
              <p className="text-sm font-semibold">On the plate</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {dishes.map((dish) => (
                  <li key={dish.id} className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
                    {dish.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
          <button
            type="button"
            onClick={close}
            disabled={saving}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving || !changed}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-on-brand transition hover:bg-brand/90 disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </dialog>
  );
}
