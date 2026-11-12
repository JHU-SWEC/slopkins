import Image from "next/image";

// Round profile picture. Shows the first letter of the name if there's no photo.
export function Avatar({
  src,
  name,
  size,
}: {
  /** Full image URL (see avatarSrc in shared.ts), or null for no photo. */
  src: string | null;
  name: string;
  size: number;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt={`${name}'s profile picture`}
        width={size}
        height={size}
        className="rounded-full bg-white object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  const initial = name.replace(/^@/, "").charAt(0) || "?";
  return (
    <div
      role="img"
      aria-label={`${name} has no profile picture`}
      className="flex items-center justify-center rounded-full bg-spirit-blue font-bold uppercase text-heritage-blue"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initial}
    </div>
  );
}
