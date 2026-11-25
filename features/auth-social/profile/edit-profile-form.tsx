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

const inputClass =
  "mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-heritage-blue dark:text-white placeholder:text-slate-400 focus:border-heritage-blue focus:outline-none focus:ring-2 focus:ring-spirit-blue/40";
const labelClass = "block text-sm font-semibold";

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
    <form onSubmit={handleSubmit} className="space-y-6 text-heritage-blue dark:text-white">
      {usedSuggestions && (
        <p className="rounded-2xl bg-spirit-blue/20 px-4 py-3 text-sm">
          We filled in some fields from your Google account. Change anything you like, then press{" "}
          <strong>Save changes</strong>.
        </p>
      )}

      {/* ---------- Photo, name, username ---------- */}
      <Card title="Photo, name & username">
        {/* Live preview of how the top of your profile will look. */}
        <div className="flex items-center gap-4 rounded-2xl bg-linear-to-br from-heritage-blue to-[#1d5aa8] p-4 text-white">
          <div className="rounded-full ring-4 ring-white/30">
            <Avatar src={avatarSrc(avatarPath || null)} name={previewName} size={72} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xl font-bold">{previewName}</p>
            {displayName.trim() && <p className="truncate text-white/70">@{username}</p>}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
            className="rounded-xl bg-heritage-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-heritage-blue/90 disabled:opacity-60"
          >
            {uploading ? "Uploading…" : avatarPath ? "Change photo" : "Upload photo"}
          </button>
          {avatarPath && (
            <button
              type="button"
              onClick={() => setAvatarPath("")}
              className="text-sm text-slate-500 underline"
            >
              Remove photo
            </button>
          )}
          <span className="text-xs text-slate-500">JPG, PNG, WebP, or GIF, up to 5 MB.</span>
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
        {photoError && <p className="mt-3 text-sm text-red-700 dark:text-red-300">{photoError}</p>}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="display_name" className={labelClass}>
              Display name
            </label>
            <input
              id="display_name"
              name="display_name"
              maxLength={DISPLAY_NAME_LIMIT}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Johns Hopkins"
              aria-invalid={Boolean(displayNameProblem)}
              aria-describedby="display-name-hint"
              className={inputClass}
            />
            <p
              id="display-name-hint"
              className={`mt-1 text-xs ${displayNameProblem ? "text-red-700 dark:text-red-300" : "text-slate-500"}`}
            >
              {displayNameProblem ?? "Shown big on your profile. Optional."}
            </p>
          </div>
          <div>
            <label htmlFor="username" className={labelClass}>
              Username
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3 mt-0.5 -translate-y-1/2 text-slate-400">
                @
              </span>
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
            <p
              id="username-hint"
              className={`mt-1 text-xs ${usernameOk ? "text-slate-500" : "text-red-700 dark:text-red-300"}`}
            >
              {usernameProblem ??
                `3–20 characters: lowercase letters, numbers, and _. Your link: /u/${username || "…"}`}
            </p>
          </div>
        </div>
      </Card>

      {/* ---------- Everything that needs the database update ---------- */}
      <input type="hidden" name="details_ready" value={detailsReady ? "1" : "0"} />
      {detailsReady ? (
        <>
          <Card title="About you">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="grade" className={labelClass}>
                    Grade
                  </label>
                  <select id="grade" name="grade" defaultValue={profile.grade ?? ""} className={inputClass}>
                    <option value="">Prefer not to say</option>
                    {GRADES.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="major" className={labelClass}>
                    Major
                  </label>
                  <input
                    id="major"
                    name="major"
                    maxLength={MAJOR_LIMIT}
                    defaultValue={profile.major ?? ""}
                    placeholder="e.g. Computer Science"
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="bio" className={labelClass}>
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  maxLength={BIO_LIMIT}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Favorite dining hall? Hottest food take?"
                  className={inputClass}
                />
                <p className="mt-1 text-right text-xs text-slate-500">
                  {bio.length}/{BIO_LIMIT}
                </p>
              </div>
            </div>
          </Card>
        </>
      ) : (
        <p className="rounded-2xl border-2 border-dashed border-slate-200 p-4 text-center text-sm text-slate-500">
          Grade, major, and bio are coming soon.
        </p>
      )}

      {/* ---------- Save / cancel ---------- */}
      <div aria-live="polite">
        {state.error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">{state.error}</p>
        )}
      </div>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href="/profile"
          className="rounded-xl px-5 py-3 text-center font-semibold text-heritage-blue transition hover:bg-slate-100 dark:text-white"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={saving || uploading || !usernameOk || Boolean(displayNameProblem)}
          className="rounded-xl bg-heritage-blue px-6 py-3 font-semibold text-white transition hover:bg-heritage-blue/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}
