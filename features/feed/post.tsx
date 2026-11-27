import Image from "next/image";
import Link from "next/link";
import { Avatar } from "@/features/auth-social/profile/avatar";
import { avatarSrc, shownName } from "@/features/auth-social/profile/shared";
import { timeAgo } from "@/features/auth-social/activity/shared";
import { SENTIMENT_STYLES } from "@/features/ranking/components/styles";
import { mealPhotoSrc } from "@/features/ranking/photo";
import { formatScore } from "@/features/ranking/score";
import { LikeButton } from "./like-button";
import { PostComments } from "./post-comments";
import { PostMenu } from "./post-menu";
import { PostEditProvider, PostNotes } from "./post-notes";
import type { FeedComment, FeedPost } from "./queries";
import { SaveCount, SavePlateButton } from "./save-plate-button";

/**
 * One logged meal as a card: who, where, photo, dishes and the plate's score, then
 * likes, comments, and save. Used on the feed and on profiles.
 */
export function Post({
  post,
  now,
  mine,
  viewer,
  signedIn = true,
}: {
  post: FeedPost;
  now: number;
  mine: boolean;
  /** Null only if your profile row couldn't be read; then there's no comment box. */
  viewer: FeedComment["person"] | null;
  /** Signed-out visitors (on a shared profile link) can't like, comment, or save. */
  signedIn?: boolean;
}) {
  const name = shownName(post.person);
  // Right end of the icon row: the bookmark, or on your own post how many saved it.
  const rowEnd = mine ? (
    <SaveCount saves={post.saves} />
  ) : (
    <SavePlateButton mealId={post.id} saved={post.savedByMe} saves={post.saves} />
  );
  // Your own post's ⋯ menu sits after the comment icon (kept out of the
  // header so the score sits in the same spot on every post).
  const menu = mine ? <PostMenu mealId={post.id} hasPhoto={post.photoPath !== null} /> : null;
  const profileHref = `/u/${post.person.username}`;

  return (
    <li className="rounded-2xl border border-gray-200 p-4">
      <PostEditProvider>
        <div className="flex items-center gap-3">
          <Link href={profileHref} className="shrink-0">
            <Avatar src={avatarSrc(post.person.avatar_url)} name={name} size={40} />
          </Link>
          <div className="min-w-0 flex-1">
            <Link href={profileHref} className="font-semibold hover:underline">
              {name}
            </Link>
            <p className="text-sm text-gray-500">
              {post.hall ? (
                <Link href={`/dining/${post.hall.slug}`} className="hover:underline">
                  {post.hall.name}
                </Link>
              ) : (
                "A dining hall"
              )}
              {post.meal && <span className="capitalize"> · {post.meal}</span>}
              {" · "}
              <time dateTime={post.at}>{timeAgo(post.at, now)}</time>
            </p>
          </div>
          {/* The plate's score: a light gray circle with the number in its
              sentiment color, in the same spot on every post. Your own unranked plate gets a nudge to rank it instead. */}
          {post.ranking ? (
            <span
              role="img"
              aria-label={`Plate score ${formatScore(post.ranking.score)} out of 10`}
              title="Plate score"
              className={`grid size-11 shrink-0 place-items-center rounded-full border-[1.5px] border-gray-200 bg-white text-sm font-semibold tracking-tight tabular-nums ${
                SENTIMENT_STYLES[post.ranking.sentiment].number
              }`}
            >
              {formatScore(post.ranking.score)}
            </span>
          ) : (
            mine && (
              <Link
                href={`/rank?meal=${post.id}`}
                className="grid size-11 shrink-0 place-items-center rounded-full border-2 border-dashed border-brand/40 text-xs font-semibold text-brand transition hover:border-brand hover:bg-brand/5"
              >
                Rank
              </Link>
            )
          )}
        </div>

        {post.photoPath && (
          // Every photo shows as the same 200×200 square, cropped to fit.
          <div className="relative mt-3 size-[200px] overflow-hidden rounded-xl bg-gray-100">
            <Image
              src={mealPhotoSrc(post.photoPath)}
              alt={`${name}'s meal${post.hall ? ` at ${post.hall.name}` : ""}`}
              fill
              sizes="200px"
              className="object-cover"
            />
          </div>
        )}

        {/* What they thought, under the photo. Editable from your ⋯ menu. */}
        <PostNotes mealId={post.id} notes={post.caption} />

        {/* What was on the plate. */}
        {post.dishes.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {post.dishes.map((dish) => (
              <li key={dish.id} className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
                {dish.name}
              </li>
            ))}
          </ul>
        )}

        {/* Like, comment (and your ⋯ menu) on the left; the bookmark on the right. */}
        {!signedIn ? null : viewer ? (
          <PostComments
            mealId={post.id}
            comments={post.comments}
            viewer={viewer}
            postOwnerId={post.person.id}
            now={now}
            like={<LikeButton mealId={post.id} liked={post.likedByMe} likes={post.likes} />}
            menu={menu}
            save={rowEnd}
          />
        ) : (
          <div className="mt-2 flex items-center">
            <LikeButton mealId={post.id} liked={post.likedByMe} likes={post.likes} />
            {menu}
            {rowEnd}
          </div>
        )}
      </PostEditProvider>
    </li>
  );
}
