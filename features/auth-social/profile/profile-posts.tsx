import Link from "next/link";
import { Post } from "@/features/feed/post";
import type { PostList } from "@/features/feed/queries";
import { primaryButton } from "@/features/ranking/components/styles";

/**
 * The Posts tab: every meal this person logged, newest first, as the same
 * cards the feed uses. One card per meal, not per dish.
 */
export function ProfilePosts({
  list,
  isOwner,
  signedIn,
}: {
  list: PostList;
  isOwner: boolean;
  signedIn: boolean;
}) {
  const { posts, now, viewer } = list;

  if (posts.length === 0) {
    return isOwner ? (
      <div className="mt-6 text-center">
        <p className="text-gray-500">Rank a plate to start!</p>
        <Link href="/dining" className={`mt-4 ${primaryButton}`}>
          Browse menus
        </Link>
      </div>
    ) : (
      <p className="rounded-2xl border-2 border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
        Nothing yet.
      </p>
    );
  }

  return (
    // The profile header is blue text; posts use the feed's colors.
    <ul className="space-y-4 text-gray-900">
      {posts.map((post) => (
        <Post key={post.id} post={post} now={now} mine={isOwner} viewer={viewer} signedIn={signedIn} />
      ))}
    </ul>
  );
}
