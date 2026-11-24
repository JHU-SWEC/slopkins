/** Cookie holding when you last opened the Activity page. */
export const ACTIVITY_SEEN_COOKIE = "activity_seen_at";

/** "now", "5m", "3h", "2d", "1w", then a date like "Oct 3". */
export function timeAgo(iso: string, now: number): string {
  const seconds = Math.max(0, (now - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 7 * 86400) return `${Math.floor(seconds / 86400)}d`;
  if (seconds < 28 * 86400) return `${Math.floor(seconds / (7 * 86400))}w`;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "America/New_York",
  }).format(new Date(iso));
}
