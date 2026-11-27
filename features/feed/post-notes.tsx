"use client";

import { createContext, useContext, useState, useTransition } from "react";
import { editNotesAction } from "./actions";

const MAX_NOTES = 500;

// Lets the ⋯ menu (in the icon row) open the notes editor (under the photo).
const EditingNotes = createContext<{ editing: boolean; setEditing: (editing: boolean) => void }>({
  editing: false,
  setEditing: () => {},
});

/** Wraps one post so its ⋯ menu can open the notes editor. */
export function PostEditProvider({ children }: { children: React.ReactNode }) {
  const [editing, setEditing] = useState(false);
  return <EditingNotes.Provider value={{ editing, setEditing }}>{children}</EditingNotes.Provider>;
}

/** For the ⋯ menu's "Edit notes". */
export function useEditNotes() {
  return useContext(EditingNotes).setEditing;
}

/**
 * "Notes: …" under the photo. On your own post, "Edit notes" in the ⋯ menu
 * swaps it for a text box. Saving shows the new notes right away.
 */
export function PostNotes({ mealId, notes }: { mealId: number; notes: string | null }) {
  const { editing, setEditing } = useContext(EditingNotes);
  // What's shown: the saved notes, or your edit once it's saved.
  const [shown, setShown] = useState(notes ?? "");
  const [draft, setDraft] = useState(shown);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  function cancel() {
    setDraft(shown);
    setError(null);
    setEditing(false);
  }

  function save() {
    const next = draft.trim();
    setError(null);
    startSaving(async () => {
      const result = await editNotesAction(mealId, next);
      if (result.error) {
        setError(result.error);
        return;
      }
      setShown(next);
      setDraft(next);
      setEditing(false);
    });
  }

  if (editing) {
    return (
      <div className="mt-3">
        <label htmlFor={`notes-${mealId}`} className="text-sm font-semibold text-gray-900">
          Notes
        </label>
        <textarea
          id={`notes-${mealId}`}
          autoFocus
          rows={3}
          maxLength={MAX_NOTES}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") cancel();
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save();
          }}
          placeholder="What did you think?"
          className="mt-1 block w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 sm:text-sm"
        />
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-gray-400 tabular-nums">
            {draft.length}/{MAX_NOTES}
          </span>
          {error && (
            <span role="alert" className="text-xs text-red-600">
              {error}
            </span>
          )}
          <button
            type="button"
            onClick={cancel}
            disabled={saving}
            className="ml-auto rounded-lg px-3 py-1.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving || draft.trim() === shown}
            className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-on-brand transition hover:bg-brand/90 disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    );
  }

  if (!shown) return null;
  return (
    <p className="mt-3 whitespace-pre-line text-sm text-gray-800">
      <span className="font-semibold text-gray-900">Notes:</span> {shown}
    </p>
  );
}
