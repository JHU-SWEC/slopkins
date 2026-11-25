import { useSyncExternalStore } from "react";

// Whether the dining pages show calories and macros. Off is for people who
// just want to log what they ate. Saved per browser; on by default.
const KEY = "showMacros";
const EVENT = "showmacroschange";

function read() {
  try {
    return localStorage.getItem(KEY) !== "false";
  } catch {
    return true;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange); // other tabs
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function setShowMacros(show: boolean) {
  try {
    localStorage.setItem(KEY, String(show));
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

/** The server render assumes macros are on; the saved choice applies on hydration. */
export function useShowMacros() {
  return useSyncExternalStore(subscribe, read, () => true);
}
