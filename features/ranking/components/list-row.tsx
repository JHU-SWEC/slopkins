import Image from "next/image";
import Link from "next/link";
import { mealPhotoSrc } from "../photo";

// Building blocks shared by the profile's list tabs (Rankings, Want to Try), so
// both look the same: one bordered box, rows split by thin lines.

/** The box around a list's rows. */
export const LIST_BOX = "divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200";

/** One row: something on the left, two lines of text, something on the right. */
export const LIST_ROW = "flex items-center gap-3 px-4 py-3.5 transition hover:bg-gray-50";

/** The quiet count above a list, e.g. "12 plates". */
export function ListCount({ count, one, many }: { count: number; one: string; many: string }) {
  return <p className="text-sm text-gray-500">{count === 1 ? `1 ${one}` : `${count} ${many}`}</p>;
}

/** A row's title and one muted line under it, both cut off with … if long. */
export function RowText({ title, detail }: { title: string; detail: string }) {
  return (
    <span className="min-w-0 flex-1">
      <span className="block truncate font-semibold">{title}</span>
      {detail && <span className="block truncate text-sm text-gray-500">{detail}</span>}
    </span>
  );
}

/** A small square photo of a plate, or a fork and knife when there's none. */
export function PlateThumb({ photoPath }: { photoPath: string | null }) {
  return (
    <span className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-gray-100 text-gray-400">
      {photoPath ? (
        <Image src={mealPhotoSrc(photoPath)} alt="" fill sizes="56px" className="object-cover" />
      ) : (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="size-6"
        >
          <path d="M4 3v5a3 3 0 0 0 6 0V3" />
          <path d="M7 3v18" />
          <path d="M17 21V3a4 4 0 0 0-3 4v6a1 1 0 0 0 1 1h2" />
        </svg>
      )}
    </span>
  );
}

/**
 * What a profile tab shows when it's empty: one quiet dashed box. On your own
 * profile it adds a link to get started; on anyone else's it's just the text.
 */
export function EmptyTab({ message, action }: { message: string; action?: { label: string; href: string } }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-gray-200 px-6 py-8 text-center">
      <p className="text-sm text-gray-500">{message}</p>
      {action && (
        <Link href={action.href} className="mt-2 inline-block text-sm font-semibold text-brand hover:text-brand/80">
          {action.label} ›
        </Link>
      )}
    </div>
  );
}
