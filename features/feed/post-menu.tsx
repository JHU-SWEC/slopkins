"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { deletePostAction } from "./actions";
import { EditPostDialog } from "./edit-post-dialog";
import type { FeedPost } from "./queries";

// "⋯" menu on your own feed posts: Edit post (a popup for the notes and
// photo) and Delete post (with a confirm step). Big tap targets for phones.
export function PostMenu({ post, now }: { post: FeedPost; now: number }) {
  const mealId = post.id;
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [working, startWorking] = useTransition();
  const root = useRef<HTMLDivElement>(null);

  // Close on a tap outside or Escape.
  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) close();
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function close() {
    setOpen(false);
    setConfirming(false);
    setError(null);
  }

  function deletePost() {
    setError(null);
    startWorking(async () => {
      const result = await deletePostAction(mealId);
      if (result.error) setError(result.error);
      else close();
    });
  }

  const item = "block w-full px-4 py-3 text-left text-sm font-medium transition hover:bg-gray-50 disabled:opacity-40";

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Post options"
        className="grid size-11 place-items-center rounded-full text-xl leading-none text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
      >
        ⋯
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-11 z-20 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
        >
          {confirming ? (
            <div className="p-4">
              <p className="text-sm font-semibold text-gray-900">Delete this post?</p>
              <p className="mt-1 text-xs text-gray-500">It won&apos;t show on the feed anymore.</p>
              {error && (
                <p role="alert" className="mt-2 text-xs text-red-600">
                  {error}
                </p>
              )}
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  disabled={working}
                  className="flex-1 rounded-md border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={deletePost}
                  disabled={working}
                  className="flex-1 rounded-md bg-red-600 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {working ? "Deleting…" : "Delete post"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  close();
                  setEditing(true);
                }}
                className={`${item} text-gray-700`}
              >
                Edit post
              </button>
              <button type="button" role="menuitem" onClick={() => setConfirming(true)} className={`${item} text-red-600`}>
                Delete post
              </button>
            </>
          )}
        </div>
      )}

      {editing && (
        <EditPostDialog post={post} now={now} onClose={() => setEditing(false)} />
      )}
    </div>
  );
}
