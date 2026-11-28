"use client";

import Link from "next/link";
import { startTransition, useActionState, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateProfile, type EditProfileState } from "./actions";
import { Avatar } from "./avatar";
import { nameProblem } from "./name-rules";
import {
  BIO_LIMIT,
  DISPLAY_NAME_LIMIT,
  GRADES,
  MAJOR_LIMIT,
  USERNAME_PATTERN,
  avatarSrc,
  type Profile,
} from "./shared";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB, same limit as the storage bucket
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Quiet inputs: thin gray border that darkens on focus, no glow.
const inputClass =
  "mt-1.5 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-heritage-blue placeholder:text-gray-400 transition focus:border-gray-400 focus:outline-none dark:text-white";

export function EditProfileForm({
  profile,
  detailsReady,
  suggested,
}: {
  profile: Profile;
  /** False until the database has grade/major/bio. */
  detailsReady: boolean;
  /** Starting values from Google, for fields the user hasn't set yet. */
  suggested: { displayName: string | null; username: string | null };
}) {
  const [state, formAction, saving] = useActionState<EditProfileState, FormData>(
    updateProfile,
    {},
  );
  const [avatarPath, setAvatarPath] = useState(profile.avatar_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [username, setUsername] = useState(suggested.username ?? profile.username);
  const [displayName, setDisplayName] = useState(
    profile.display_name ?? suggested.displayName ?? "",
  );
  const [bio, setBio] = useState(profile.bio ?? "");
  const fileInput = useRef<HTMLInputElement>(null);

  const usedSuggestions = Boolean(suggested.username || suggested.displayName);
  // Checked as you type, so you find out before pressing Save.
  const usernameProblem = nameProblem(username, "username");
  const displayNameProblem = nameProblem(displayName, "display name");
  const usernameOk = USERNAME_PATTERN.test(username) && !usernameProblem;
  const previewName = displayName.trim() || `@${username || "username"}`;

  // Upload the chosen photo straight to Supabase Storage and show a preview.
  // (Going through the server would hit Next.js's 1 MB form size limit.)
  async function handlePhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // lets you pick the same file again later
    if (!file) return;
    setPhotoError("");
    if (!PHOTO_TYPES.includes(file.type)) {
      setPhotoError("Use a JPG, PNG, WebP, or GIF image.");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError("That photo is over 5 MB. Try a smaller one.");
      return;
    }

    setUploading(true);
    const path = `${profile.id}/${Date.now()}.${file.type.split("/")[1]}`;
    const { error } = await createClient().storage.from("avatars").upload(path, file);
    setUploading(false);
    if (error) {
      setPhotoError(
        /bucket not found/i.test(error.message)
          ? "Photo uploads aren't set up yet. They'll work once the profile database update is applied."
          : "Upload failed. Please try again.",
      );
      return;
    }
    setAvatarPath(path);
  }

  // Submit without React's automatic form reset, so a mistake (like a taken
  // username) doesn't wipe out everything you typed.
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  return (
    <form onSubmit={handleSubmit} className="text-heritage-blue dark:text-white">
      {/* ---------- Photo: centered, with text links, like Instagram ---------- */}
      <div className="flex flex-col items-center text-center">
        <Avatar src={avatarSrc(avatarPath || null)} name={previewName} size={88} />
        <div className="mt-3 flex items-center gap-3 text-sm font-semibold">
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
            className="text-brand transition hover:text-brand/80 disabled:opacity-60"
          >
            {uploading ? "Uploading…" : avatarPath ? "Change photo" : "Add photo"}
          </button>
          {avatarPath && !uploading && (
            <>
              <span aria-hidden="true" className="text-gray-300">
                ·
              </span>
              <button
                type="button"
                onClick={() => setAvatarPath("")}
                className="text-gray-500 transition hover:text-gray-700"
              >
                Remove
              </button>
            </>
          )}
        </div>
        {photoError && <p className="mt-2 text-sm text-red-700 dark:text-red-300">{photoError}</p>}
      </div>
      <input
        ref={fileInput}
        type="file"
        accept={PHOTO_TYPES.join(",")}
        onChange={handlePhoto}
        className="hidden"
        aria-label="Choose a profile picture"
      />
      <input type="hidden" name="avatar_path" value={avatarPath} />

      {usedSuggestions && (
        <p className="mt-6 text-center text-sm text-gray-500">
          Some fields were filled in from your Google account. Change anything you like, then save.
        </p>
      )}

      {/* ---------- Fields: plain labels and inputs, one after another ---------- */}
      <div className="mt-8 space-y-5">
        <Field label="Name" htmlFor="display_name" hint={displayNameProblem} hintId="display-name-hint" error>
          <input
            id="display_name"
            name="display_name"
            required
            maxLength={DISPLAY_NAME_LIMIT}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            aria-invalid={Boolean(displayNameProblem)}
            aria-describedby={displayNameProblem ? "display-name-hint" : undefined}
            className={inputClass}
          />
        </Field>

        <Field
          label="Username"
          htmlFor="username"
          // Only shown when something is wrong.
          hint={usernameProblem ?? (usernameOk ? null : "3–20 characters: lowercase letters, numbers, and _.")}
          hintId="username-hint"
          error={!usernameOk}
        >
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400">@</span>
            <input
              id="username"
              name="username"
              required
              maxLength={20}
              aria-invalid={!usernameOk}
              aria-describedby="username-hint"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
              className={`${inputClass} pl-7`}
            />
          </div>
        </Field>

        {/* Grade, major and bio need the profile details database update. */}
        <input type="hidden" name="details_ready" value={detailsReady ? "1" : "0"} />
        {detailsReady && (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Grade" htmlFor="grade">
                {/* Browser selects squeeze their arrow against the edge; draw our own with room around it. */}
                <div className="relative">
                  <select
                    id="grade"
                    name="grade"
                    defaultValue={profile.grade ?? ""}
                    className={`${inputClass} appearance-none pr-10`}
                  >
                    <option value="">Prefer not to say</option>
                    {GRADES.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                  <svg
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 right-3 mt-0.75 size-4 -translate-y-1/2 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.75}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m4 6 4 4 4-4" />
                  </svg>
                </div>
              </Field>
              <Field label="Major" htmlFor="major">
                <input
                  id="major"
                  name="major"
                  maxLength={MAJOR_LIMIT}
                  defaultValue={profile.major ?? ""}
                  placeholder="e.g. Computer Science"
                  className={inputClass}
                />
              </Field>
            </div>
            <Field label="Bio" htmlFor="bio">
              <textarea
                id="bio"
                name="bio"
                rows={3}
                maxLength={BIO_LIMIT}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Favorite dining hall? Hottest food take?"
                className={`${inputClass} resize-none`}
              />
            </Field>
          </>
        )}
      </div>

      {/* ---------- Save / cancel ---------- */}
      <div aria-live="polite">
        {state.error && <p className="mt-6 text-sm text-red-700 dark:text-red-300">{state.error}</p>}
      </div>
      <div className="mt-8 flex items-center justify-end gap-2">
        <Link
          href="/profile"
          className="rounded-lg px-4 py-2.5 text-sm font-semibold text-gray-500 transition hover:text-gray-800"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={saving || uploading || !usernameOk || !displayName.trim() || Boolean(displayNameProblem)}
          className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-on-brand transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}

/** A label, the input under it, and an optional small line of help or error under that. */
function Field({
  label,
  htmlFor,
  hint,
  hintId,
  error = false,
  hintAlign = "left",
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string | null;
  hintId?: string;
  error?: boolean;
  hintAlign?: "left" | "right";
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-500">
        {label}
      </label>
      {children}
      {hint && (
        <p
          id={hintId}
          className={`mt-1.5 text-xs ${error ? "text-red-700 dark:text-red-300" : "text-gray-400"} ${
            hintAlign === "right" ? "text-right" : ""
          }`}
        >
          {hint}
        </p>
      )}
    </div>
  );
}
