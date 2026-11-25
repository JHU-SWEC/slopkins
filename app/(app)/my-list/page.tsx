import { redirect } from "next/navigation";

// Your ranked list moved to the "Ranked dishes" section of your profile.
// Kept so old links still land somewhere.
export default function MyListPage() {
  redirect("/profile#ranked");
}
