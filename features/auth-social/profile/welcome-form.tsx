"use client";

import { startTransition, useActionState, useState } from "react";
import { chooseUsername, type EditProfileState } from "./actions";
import { nameProblem } from "./name-rules";
import { DISPLAY_NAME_LIMIT, USERNAME_PATTERN } from "./shared";

const inputClass =
  "mt-1 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-heritage-blue placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30";
const labelClass = "block text-sm font-semibold";

/** First sign-in: pick a username (required) and a display name (optional). */
export function WelcomeForm({ suggested }: { suggested: { username: string; displayName: string } }) {
  const [state, formAction, saving] = useActionState<EditProfileState, FormData>(chooseUsername, {});
  const [username, setUsername] = useState(suggested.username);
  const [displayName, setDisplayName] = useState(suggested.displayName);

  // Checked as you type, so you find out before pressing Continue.
  const usernameProblem = nameProblem(username, "username");
  const displayNameProblem = nameProblem(displayName, "display name");
  const usernameOk = USERNAME_PATTERN.test(username) && !usernameProblem;

  // Submit without React's automatic form reset, so a taken username
  // doesn't wipe out what you typed.
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-left text-heritage-blue">
      <div>
        <label htmlFor="username" className={labelClass}>
          Username
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute top-1/2 left-3 mt-0.5 -translate-y-1/2 text-gray-400">
            @
          </span>
          <input
            id="username"
            name="username"
            required
            autoFocus
            maxLength={20}
            autoComplete="username"
            aria-invalid={!usernameOk}
            aria-describedby="username-hint"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
            className={`${inputClass} pl-7`}
          />
        </div>
        <p
          id="username-hint"
          className={`mt-1 text-xs ${usernameOk || !username ? "text-gray-500" : "text-red-700"}`}
        >
          {(username && usernameProblem) ||
            "3–20 characters: lowercase letters, numbers, and _."}
        </p>
      </div>

      <div>
        <label htmlFor="display_name" className={labelClass}>
          Display Name
        </label>
        <input
          id="display_name"
          name="display_name"
          required
          maxLength={DISPLAY_NAME_LIMIT}
          autoComplete="name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="e.g. Johns Hopkins"
          aria-invalid={Boolean(displayNameProblem)}
          aria-describedby={displayNameProblem ? "display-name-hint" : undefined}
          className={inputClass}
        />
        {displayNameProblem && (
          <p id="display-name-hint" className="mt-1 text-xs text-red-700">
            {displayNameProblem}
          </p>
        )}
      </div>

      <div aria-live="polite">
        {state.error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      </div>

      <button
        type="submit"
        disabled={saving || !usernameOk || !displayName.trim() || Boolean(displayNameProblem)}
        className="w-full rounded-xl bg-brand py-3 font-semibold text-on-brand shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? "Saving…" : "Continue"}
      </button>
    </form>
  );
}
