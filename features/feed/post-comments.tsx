"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { timeAgo } from "@/features/auth-social/activity/shared";
import { shownName } from "@/features/auth-social/profile/shared";
import { addComment, deleteComment } from "./actions";
import type { FeedComment } from "./queries";

const SHOWN = 2;
const MAX_COMMENT = 500;

type Viewer = FeedComment["person"];
type Shown = FeedComment & { pending?: boolean };

// The action row under a feed post (like, comment, save) and its comments:
// the latest two and "View all". The comment box stays hidden until you tap
// the comment icon. A new comment shows right away; the server catches up.
export function PostComments({
  mealId,
  comments,
  viewer,
  postOwnerId,
  now,
  like,
  save,
}: {
  mealId: number;
  comments: FeedComment[];
  viewer: Viewer;
  postOwnerId: string;
  now: number;
  /** The like button, shown first in the row. */
  like: React.ReactNode;
  /** After the comment icon: the save button on other people's posts, the save count on yours. */
  save?: React.ReactNode;
}) {
  const [list, addPending] = useOptimistic<Shown[], Shown>(comments, (current, added) => [...current, added]);
  const [expanded, setExpanded] = useState(false);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, startSending] = useTransition();

  const visible = expanded ? list : list.slice(-SHOWN);
  const hidden = list.length - visible.length;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setError(null);
    setText("");
    setOpen(false);
    startSending(async () => {
      addPending({ id: -Date.now(), at: new Date().toISOString(), body, person: viewer, pending: true });
      const result = await addComment(mealId, body);
      if (result.error) {
        setError(result.error);
        setText(body); // give it back so nothing is lost
        setOpen(true);
      }
    });
  }

  const formId = `comment-form-${mealId}`;

  return (
    <div className="mt-2">
      <div className="flex items-center gap-1">
        {like}
        <button
          type="button"
          onClick={() => setOpen((was) => !was)}
          aria-expanded={open}
          aria-controls={formId}
          aria-label={open ? "Close comment box" : "Add a comment"}
          className={`grid size-11 place-items-center rounded-full transition hover:bg-gray-100 ${
            open ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          {/* Speech bubble. */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="size-6"
          >
            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
          </svg>
        </button>
        {save}
      </div>

      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="py-1 text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          View all {list.length} comments
        </button>
      )}

      {visible.length > 0 && (
        <ul className="space-y-1.5">
          {visible.map((comment) => (
            <CommentRow
              key={comment.id}
              comment={comment}
              now={now}
              canDelete={!comment.pending && (comment.person.id === viewer.id || postOwnerId === viewer.id)}
            />
          ))}
        </ul>
      )}

      {open && (
        <form id={formId} onSubmit={submit} className="mt-2 flex items-center gap-2">
          <label htmlFor={`comment-${mealId}`} className="sr-only">
            Add a comment
          </label>
          {/* text-base keeps iOS from zooming in when the box is tapped. */}
          <input
            id={`comment-${mealId}`}
            value={text}
            onChange={(event) => setText(event.target.value)}
            maxLength={MAX_COMMENT}
            enterKeyHint="send"
            autoComplete="off"
            // Opened on purpose by tapping the icon, so go straight to typing.
            autoFocus
            onKeyDown={(event) => event.key === "Escape" && setOpen(false)}
            placeholder="Add a comment…"
            className="min-w-0 flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:border-blue-600 focus:bg-white focus:outline-none sm:text-sm"
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="shrink-0 px-2 py-2 text-sm font-semibold text-blue-600 disabled:opacity-40"
          >
            Post
          </button>
        </form>
      )}
      {error && (
        <p role="alert" className="mt-1 text-xs text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}

function CommentRow({ comment, now, canDelete }: { comment: Shown; now: number; canDelete: boolean }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, startDeleting] = useTransition();

  function remove() {
    setError(null);
    startDeleting(async () => {
      const result = await deleteComment(comment.id);
      if (result.error) setError(result.error);
    });
  }

  return (
    <li className={`text-sm leading-snug ${comment.pending || deleting ? "opacity-60" : ""}`}>
      <Link href={`/u/${comment.person.username}`} className="font-semibold text-gray-900 hover:underline">
        {shownName(comment.person)}
      </Link>{" "}
      <span className="whitespace-pre-line break-words text-gray-700">{comment.body}</span>{" "}
      <span className="whitespace-nowrap text-xs text-gray-400">
        {comment.pending ? "Posting…" : <time dateTime={comment.at}>{timeAgo(comment.at, now)}</time>}
        {canDelete &&
          (confirming ? (
            <>
              {" · "}
              <button type="button" onClick={remove} disabled={deleting} className="font-semibold text-rose-600">
                Delete?
              </button>
              {" · "}
              <button type="button" onClick={() => setConfirming(false)} className="font-semibold">
                Cancel
              </button>
            </>
          ) : (
            <>
              {" · "}
              <button type="button" onClick={() => setConfirming(true)} className="font-semibold hover:text-gray-600">
                Delete
              </button>
            </>
          ))}
      </span>
      {error && (
        <span role="alert" className="ml-2 text-xs text-rose-600">
          {error}
        </span>
      )}
    </li>
  );
}
