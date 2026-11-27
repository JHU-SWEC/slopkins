"use client";

import { useSyncExternalStore } from "react";

export type ProfileTab = {
  /** Also the URL hash, so /profile#ranked opens that tab. */
  id: string;
  label: string;
  panel: React.ReactNode;
};

// The open tab lives in the URL hash. replaceState doesn't fire hashchange,
// so tab clicks send their own event.
const TAB_EVENT = "profile-tab";

function subscribe(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  window.addEventListener(TAB_EVENT, onChange);
  return () => {
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener(TAB_EVENT, onChange);
  };
}
const readHash = () => window.location.hash.slice(1);
// The server can't see the hash, so it renders the first tab.
const serverHash = () => "";

/**
 * Tabs under the profile stats: one panel at a time, the first one by default.
 * Panels are rendered on the server and passed in, so switching is instant.
 */
export function ProfileTabs({ tabs }: { tabs: ProfileTab[] }) {
  const hash = useSyncExternalStore(subscribe, readHash, serverHash);
  const active = tabs.find((tab) => tab.id === hash) ?? tabs[0];

  function open(id: string) {
    // Updates the URL without jumping the page to an element with that id.
    history.replaceState(null, "", id === tabs[0].id ? window.location.pathname : `#${id}`);
    window.dispatchEvent(new Event(TAB_EVENT));
  }

  return (
    <>
      <div data-tour="profile-tabs" className="sticky top-0 z-10 -mx-4 mt-6 border-b border-gray-200 bg-white/90 px-4 backdrop-blur dark:bg-background/90">
        <div role="tablist" aria-label="Profile" className="flex text-sm font-semibold">
          {tabs.map((tab) => {
            const selected = tab.id === active.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={selected}
                aria-controls={`panel-${tab.id}`}
                onClick={() => open(tab.id)}
                // Underline tabs that share the width, like most social apps.
                className={`-mb-px flex-1 cursor-pointer whitespace-nowrap border-b-2 px-2 py-3 transition ${
                  selected
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div role="tabpanel" id={`panel-${active.id}`} aria-labelledby={`tab-${active.id}`} className="mt-4">
        {active.panel}
      </div>
    </>
  );
}
