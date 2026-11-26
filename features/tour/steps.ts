import { halls } from "@/lib/halls";

// One stop on the guided tour. The tour goes to `route` (if set), then
// highlights the element with data-tour={target}. Without a target, or if the
// target never shows up (slow menu, empty list), the card sits in the middle.
export type TourStep = {
  route?: string;
  target?: string;
  title: string;
  body: string;
};

// Kept short on purpose: a long tour gets skipped.
const COMMON_STEPS: TourStep[] = [
  {
    route: "/feed",
    target: "tabs",
    title: "Welcome to Slopkins",
    body: "Rank the food at JHU's dining halls and see what your friends are eating. The house is your Feed, the fork and knife is Dining, the magnifying glass finds people, and the person is you. The bell shows your notifications.",
  },
  {
    // Ranking happens here, right after logging, so it's explained here too.
    route: `/dining/${halls[0].slug}`,
    target: "menu-list",
    title: "Log and rank what you ate",
    body: "Pick your hall on Dining and check off your dishes. Tap Review meal, then Log & rank: say if you liked your plate and answer a few “which plate was better?” questions.",
  },
];

// The laptop sidebar and the phone's top corner both have the ? button.
const REPLAY = "Tap ? to see this tour again.";

// /profile sends signed-out people to /login, outside the app, so they get a
// pointer to the Profile tab instead of a visit.
const SIGNED_IN_STEPS: TourStep[] = [
  {
    route: "/profile",
    target: "profile-tabs",
    title: "Your lists",
    body: "Your profile keeps everything you rank. Activity shows every meal you've logged, Ranked Plates lists your meals best first, and Want to Try holds dishes and plates you've bookmarked.",
  },
  {
    route: "/profile",
    target: "profile-actions",
    title: "Make it yours",
    body: `The pencil edits your photo, name, and bio. The share icon sends a link to your profile. ${REPLAY}`,
  },
];

const SIGNED_OUT_STEPS: TourStep[] = [
  {
    target: "tab-profile",
    title: "Your profile",
    body: `Log in to save your meals. Then tap the person icon to see your ranked list and edit your profile. ${REPLAY}`,
  },
];

export function tourSteps(signedIn: boolean): TourStep[] {
  return [...COMMON_STEPS, ...(signedIn ? SIGNED_IN_STEPS : SIGNED_OUT_STEPS)];
}
