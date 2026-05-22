import { usePosts } from "@/features/posts/usePosts";
import { PostListItem } from "@/features/posts/PostListItem";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const { data, isLoading, isError, refetch } = usePosts();
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="sr-only">Home</h1>
      {isLoading && <p className="text-slate-500">Loading posts…</p>}
      {isError && (
        <div className="text-slate-600 space-y-2">
          <p>Couldn't load posts.</p>
          <Button variant="outline" onClick={() => refetch()}>Retry</Button>
        </div>
      )}
      {data && data.length === 0 && <p className="text-slate-500">No posts yet — visit a forum and create one.</p>}
      {data && data.length > 0 && (
        <div className="bg-white rounded border border-slate-200 divide-y">
          {data.map((post) => <PostListItem key={post.id} post={post} />)}
        </div>
      )}
    </div>
  );
}
