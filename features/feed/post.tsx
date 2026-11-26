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
import type { FeedComment, FeedPost } from "./queries";
import { OwnSaveCount, SavePlateButton } from "./save-plate-button";

/**
 * One logged meal as a card: who, where, photo, dishes with scores, then
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
  const profileHref = `/u/${post.person.username}`;
  const comments = post.dishes.filter((dish) => dish.ranking?.comment);

  return (
    <li className="rounded-2xl border border-gray-200 p-4">
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
          </p>
        </div>
        <time dateTime={post.at} className="text-xs text-gray-400">
          {timeAgo(post.at, now)}
        </time>
        {mine && <PostMenu mealId={post.id} hasPhoto={post.photoPath !== null} />}
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

      <ul className="mt-3 flex flex-wrap gap-2">
        {post.dishes.map((dish) => (
          <li
            key={dish.id}
            className="flex items-center gap-2 rounded-full bg-gray-100 py-1 pl-3 pr-1 text-sm text-gray-700"
          >
            {dish.name}
            {dish.ranking ? (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
                  SENTIMENT_STYLES[dish.ranking.sentiment].score
                }`}
              >
                {formatScore(dish.ranking.score)}
              </span>
            ) : (
              <span className="pr-2" />
            )}
          </li>
        ))}
      </ul>

      {comments.map((dish) => (
        <p
          key={dish.id}
          className="mt-3 border-l-2 border-gray-200 pl-3 text-sm italic text-gray-600"
        >
          <span className="not-italic font-medium text-gray-700">{dish.name}:</span> {dish.ranking?.comment}
        </p>
      ))}

      {/* Like, comment, and (on other people's posts) save the plate, side by side. */}
      {!signedIn ? null : viewer ? (
        <PostComments
          mealId={post.id}
          comments={post.comments}
          viewer={viewer}
          postOwnerId={post.person.id}
          now={now}
          like={<LikeButton mealId={post.id} liked={post.likedByMe} likes={post.likes} />}
          save={
            mine ? (
              <OwnSaveCount saves={post.saves} />
            ) : (
              <SavePlateButton mealId={post.id} saved={post.savedByMe} saves={post.saves} />
            )
          }
        />
      ) : (
        <div className="mt-2 flex items-center gap-1">
          <LikeButton mealId={post.id} liked={post.likedByMe} likes={post.likes} />
          {mine ? (
            <OwnSaveCount saves={post.saves} />
          ) : (
            <SavePlateButton mealId={post.id} saved={post.savedByMe} saves={post.saves} />
          )}
        </div>
      )}
    </li>
  );
}
