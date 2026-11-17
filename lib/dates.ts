// Menu days as YYYY-MM-DD strings in Baltimore time, whatever the server's
// or browser's timezone.

/** How many days ahead you can look at menus, today included. */
export const MENU_DAYS = 7;

/** Today's date as YYYY-MM-DD in Baltimore. */
export function todayISO() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());
}

/** The date `days` after a YYYY-MM-DD date. */
export function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Today and the following days you can browse menus for. */
export function menuDays(today = todayISO()) {
  return Array.from({ length: MENU_DAYS }, (_, i) => addDays(today, i));
}

/** The requested date if it's one of the browsable days, otherwise today. */
export function pickMenuDate(requested: unknown, today = todayISO()) {
  return typeof requested === "string" && menuDays(today).includes(requested) ? requested : today;
}

/** e.g. "Thu, Nov 13". */
export function formatDay(date: string, options: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
    ...options,
  }).format(new Date(`${date}T00:00:00Z`));
}
