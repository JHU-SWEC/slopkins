import { getHall } from "@/lib/halls";
import { mockFeedPosts } from "@/lib/mock-data";

// Feed skeleton with mock posts. Real data: meals from followed users,
// newest first.
export default function Feed() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Feed</h1>

      {mockFeedPosts.length === 0 ? (
        <p className="mt-10 text-center text-gray-500">
          Follow friends to see what they ate.
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {mockFeedPosts.map((post) => (
            <li key={post.id} className="rounded-2xl border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-200" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{post.displayName}</p>
                  <p className="text-sm text-gray-500">
                    {getHall(post.hallSlug)?.name}
                    {post.meal && <span className="capitalize"> · {post.meal}</span>}
                  </p>
                </div>
                <span className="text-xs text-gray-400">{post.postedAgo}</span>
              </div>
              <ul className="mt-3 flex flex-wrap gap-2">
                {post.dishes.map((dish) => (
                  <li
                    key={dish}
                    className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
                  >
                    {dish}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
