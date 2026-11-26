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
    route: `/dining/${halls[0].slug}`,
    target: "menu-list",
    title: "Log what you ate",
    body: "Pick your hall on Dining, then check off your dishes. Tap Review meal, then Log & rank to save it and rank the mains.",
  },
];

const RANK_BODY =
  "Say if you liked each dish, then answer a few “which was better?” questions.";

// /profile sends signed-out people to /login, outside the app, so they get a
// pointer to the Profile tab instead of a visit.
const SIGNED_IN_STEPS: TourStep[] = [
  {
    route: "/profile",
    target: "profile-tabs",
    title: "Rank your dishes",
    body: `${RANK_BODY} Activity shows every meal you've logged, Ranked Plates lists your meals best first, and Want to Try holds dishes you've bookmarked on menus.`,
  },
  {
    route: "/profile",
    target: "profile-actions",
    title: "Make it yours",
    body: "The pencil edits your photo, name, and bio. The share icon sends a link to your profile. Tap ? in the corner to see this tour again.",
  },
];

const SIGNED_OUT_STEPS: TourStep[] = [
  {
    target: "tab-profile",
    title: "Rank and set up your profile",
    body: `${RANK_BODY} Log in, then tap the person icon to see your ranked list and edit your profile. Tap ? in the corner to see this tour again.`,
  },
];

export function tourSteps(signedIn: boolean): TourStep[] {
  return [...COMMON_STEPS, ...(signedIn ? SIGNED_IN_STEPS : SIGNED_OUT_STEPS)];
}
