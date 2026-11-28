import { Post } from "@/features/feed/post";
import type { PostList } from "@/features/feed/queries";
import { EmptyTab } from "@/features/ranking/components/list-row";

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
      <EmptyTab message="Meals you log will show up here." action={{ label: "Log a meal", href: "/dining" }} />
    ) : (
      <EmptyTab message="No meals logged yet." />
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
