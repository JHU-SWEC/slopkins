"use client";

import Link from "next/link";
import { startTransition, useActionState, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateProfile, type EditProfileState } from "./actions";
import { Avatar } from "./avatar";
import {
  BIO_LIMIT,
  DISPLAY_NAME_LIMIT,
  GRADES,
  MAJOR_LIMIT,
  avatarSrc,
  type DiningHall,
  type Profile,
} from "./shared";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB, same limit as the storage bucket
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const inputClass =
  "mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-heritage-blue placeholder:text-slate-400 focus:border-heritage-blue focus:outline-none focus:ring-2 focus:ring-spirit-blue/40";
const labelClass = "block text-sm font-semibold";

export function EditProfileForm({
  profile,
  halls,
  visitedIds,
  wantToGoIds,
}: {
  profile: Profile;
  halls: DiningHall[];
  visitedIds: number[];
  wantToGoIds: number[];
}) {
  const [state, formAction, saving] = useActionState<EditProfileState, FormData>(
    updateProfile,
    {},
  );
  const [avatarPath, setAvatarPath] = useState(profile.avatar_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [username, setUsername] = useState(profile.username);
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const fileInput = useRef<HTMLInputElement>(null);

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
      setPhotoError("Upload failed. Please try again.");
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

  const previewName = displayName.trim() || username || "?";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-heritage-blue">
      {/* ---------- Photo ---------- */}
      <Card title="Profile picture">
        <div className="flex items-center gap-5">
          <Avatar src={avatarSrc(avatarPath || null)} name={previewName} size={80} />
          <div className="flex flex-col items-start gap-2">
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
          </div>
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
        {photoError && <p className="mt-3 text-sm text-red-700">{photoError}</p>}
      </Card>

      {/* ---------- About you ---------- */}
      <Card title="About you">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="display_name" className={labelClass}>
                Name
              </label>
              <input
                id="display_name"
                name="display_name"
                maxLength={DISPLAY_NAME_LIMIT}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Johns Hopkins"
                className={inputClass}
              />
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
                  minLength={3}
                  maxLength={20}
                  pattern="[a-z0-9_]{3,20}"
                  title="3–20 characters: lowercase letters, numbers, and _"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
                  className={`${inputClass} pl-7`}
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">Lowercase letters, numbers, and _ only.</p>
            </div>
          </div>

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

      {/* ---------- Dining halls ---------- */}
      <Card title="Dining halls">
        <p className="mb-3 text-sm text-slate-500">
          Check where you&apos;ve been and where you want to go. These show on your profile.
        </p>
        {halls.length === 0 ? (
          <p className="text-sm text-slate-500">No dining halls have been added to Slopkins yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-slate-500">
                <th className="py-2 font-semibold">Hall</th>
                <th className="w-24 py-2 text-center font-semibold">Been to</th>
                <th className="w-24 py-2 text-center font-semibold">Want to go</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {halls.map((hall) => (
                <tr key={hall.id}>
                  <td className="py-3 font-medium">{hall.name}</td>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      name="visited"
                      value={hall.id}
                      defaultChecked={visitedIds.includes(hall.id)}
                      aria-label={`Been to ${hall.name}`}
                      className="size-5 accent-heritage-blue"
                    />
                  </td>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      name="want_to_go"
                      value={hall.id}
                      defaultChecked={wantToGoIds.includes(hall.id)}
                      aria-label={`Want to go to ${hall.name}`}
                      className="size-5 accent-heritage-blue"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* ---------- Save / cancel ---------- */}
      <div aria-live="polite">
        {state.error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
        )}
      </div>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href="/profile"
          className="rounded-xl px-5 py-3 text-center font-semibold text-heritage-blue transition hover:bg-slate-100"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={saving || uploading}
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
