// Meal photos live in Supabase Storage's public "meal-photos" bucket, at
// "<user id>/<timestamp>.jpg". meals.photo_path holds that path.

export const MEAL_PHOTO_BUCKET = "meal-photos";
export const MAX_MEAL_PHOTO_BYTES = 5 * 1024 * 1024; // same limit as the bucket

/** What logAndRankMealAction accepts as a photo path. */
export const MEAL_PHOTO_PATH = /^[0-9a-f-]{36}\/\d+\.(jpg|png|webp)$/;

// Phone photos are 3–12 MB; this keeps uploads around 200–400 KB.
const LONGEST_SIDE = 1600;
const QUALITY = 0.82;

/** Public URL for a stored meal photo. */
export function mealPhotoSrc(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${MEAL_PHOTO_BUCKET}/${path}`;
}

/**
 * Shrinks a photo on the device before upload: JPEG, longest side 1600px,
 * turned the right way up (phones store rotation as metadata). Browser only.
 */
export async function shrinkPhoto(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const scale = Math.min(1, LONGEST_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas isn't available");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Couldn't encode the photo"))),
        "image/jpeg",
        QUALITY,
      ),
    );
  } finally {
    bitmap.close();
  }
}
