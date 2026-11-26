import { NextResponse, type NextRequest } from "next/server";
import { addDays, menuDays, todayISO } from "@/lib/dates";
import { getHall } from "@/lib/halls";
import { getDishDetails } from "@/lib/menus";

// GET /dining/<hall>/details?date=YYYY-MM-DD&food=<Nutrislice food id>
// One dish's label details (ingredients), which the menu leaves out to
// keep each day small. Read from the same cached week as the menu.
export async function GET(request: NextRequest, { params }: RouteContext<"/dining/[slug]/details">) {
  const hall = getHall((await params).slug);
  const { searchParams } = request.nextUrl;
  const date = searchParams.get("date") ?? "";
  const foodId = Number(searchParams.get("food"));
  // Only days a menu page can show (plus yesterday, for a page left open past
  // midnight), so nobody can make the server fetch arbitrary weeks.
  const today = todayISO();
  const days = [addDays(today, -1), ...menuDays(today)];
  if (!hall || !days.includes(date) || !Number.isInteger(foodId)) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  let details;
  try {
    details = await getDishDetails(hall, date, foodId);
  } catch {
    return NextResponse.json({ error: "Couldn't reach the menu" }, { status: 502 });
  }
  if (!details) return NextResponse.json({ error: "Not on that day's menu" }, { status: 404 });
  // The browser keeps it, so opening the same label again is instant.
  return NextResponse.json(details, { headers: { "Cache-Control": "private, max-age=3600" } });
}
