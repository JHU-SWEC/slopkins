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

const COMMON_STEPS: TourStep[] = [
  {
    route: "/feed",
    title: "Welcome to Slopkins",
    body: "Rank the food at JHU's dining halls and see what your friends are eating. Here's a quick tour.",
  },
  {
    route: "/feed",
    target: "tabs",
    title: "Your tabs",
    body: "The house is your Feed: what your friends ate. The fork and knife is Dining, where you log a meal. The magnifying glass finds people to follow. The bell shows new followers and what friends rated. The person is your profile.",
  },
  {
    route: "/feed",
    target: "feed-list",
    title: "Your feed",
    body: "Meals from people you follow, newest first.",
  },
  {
    route: "/dining",
    target: "hall-list",
    title: "Pick your hall",
    body: "Tap where you ate. If you leave a ranking halfway, a “dishes to rank” banner shows up here so you can finish.",
  },
  {
    route: `/dining/${halls[0].slug}`,
    target: "menu-list",
    title: "Check off what you ate",
    body: "Pick the meal and the day at the top, then check off your dishes. Tap Nutrition on any dish for its facts.",
  },
  {
    route: `/dining/${halls[0].slug}`,
    target: "review-meal",
    title: "Log your meal",
    body: "Review meal shows your totals. Log & rank saves it and starts ranking; Log only just saves it. Only mains get ranked.",
  },
];

const RANK_BODY =
  "For each dish, say if you liked it, it was fine, or you didn't like it, then answer a few “which was better?” questions. Add a comment if you like, or skip.";

// /profile sends signed-out people to /login, outside the app, so they get a
// pointer to the Profile tab instead of a visit.
const SIGNED_IN_STEPS: TourStep[] = [
  {
    route: "/profile",
    target: "my-list",
    title: "Rank your dishes",
    body: `${RANK_BODY} Your ranked list and scores live under Ranked dishes on your profile.`,
  },
  {
    route: "/profile",
    target: "profile-actions",
    title: "Your profile",
    body: "Edit profile adds a photo, name, username, grade, major, bio, and the halls you've been to or want to try. Share profile copies a link to your page.",
  },
  {
    route: "/profile",
    target: "profile-stats",
    title: "Followers and following",
    body: "Your dishes ranked, your rank on Slopkins, and who follows you. Tap Followers or Following to see the people. Tap ? in the corner to see this tour again.",
  },
];

const SIGNED_OUT_STEPS: TourStep[] = [
  {
    title: "Rank your dishes",
    body: `${RANK_BODY} Once you log in, your ranked list lives on your profile.`,
  },
  {
    target: "tab-profile",
    title: "Set up your profile",
    body: "Log in, then tap the person icon and Edit profile to add a photo, name, username, grade, major, bio, and the halls you've been to or want to try. Tap ? in the corner to see this tour again.",
  },
];

export function tourSteps(signedIn: boolean): TourStep[] {
  return [...COMMON_STEPS, ...(signedIn ? SIGNED_IN_STEPS : SIGNED_OUT_STEPS)];
}
