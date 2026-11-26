import type { Metadata } from "next";

export const metadata: Metadata = { title: "Log in · Slopkins" };

// /login — where pages like /profile send you if you're not signed in. It's
// the same sign-in screen as the home page, so there's only one to keep up.
// Google sign-in also creates the account the first time, so there's no separate sign-up page.
export { default } from "../page";
