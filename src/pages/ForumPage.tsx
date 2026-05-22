import { Link, useParams } from "react-router-dom";
import { useForum } from "@/features/forums/useForum";
import { ForumHeader } from "@/features/forums/ForumHeader";
import { useForumPosts } from "@/features/posts/useForumPosts";
import { PostListItem } from "@/features/posts/PostListItem";
import { Button } from "@/components/ui/button";
import { RightRail } from "@/layout/RightRail";
import { ForumRightRail } from "@/features/forums/ForumRightRail";
import NotFoundPage from "./NotFoundPage";

export default function ForumPage() {
  const { forumName } = useParams<{ forumName: string }>();
  const forum = useForum(forumName ?? "");
  const posts = useForumPosts(forumName ?? "");

  if (!forumName) return <NotFoundPage />;
  if (forum.isLoading) return <p className="p-6 text-slate-500">Loading forum…</p>;
  if (forum.isError || !forum.data) return <NotFoundPage />;

  return (
    <div className="flex">
      <div className="flex-1 min-w-0">
        <ForumHeader forum={forum.data} />
        <div className="max-w-3xl mx-auto p-6">
          <div className="flex justify-end mb-3">
            <Button asChild><Link to={`/submit?forum=${forumName}`}>+ New post</Link></Button>
          </div>
          {posts.isLoading && <p className="text-slate-500">Loading posts…</p>}
          {posts.isError && <p className="text-slate-600">Couldn't load posts.</p>}
          {posts.data && posts.data.length === 0 && <p className="text-slate-500">No posts in r/{forumName} yet.</p>}
          {posts.data && posts.data.length > 0 && (
            <div className="bg-white rounded border border-slate-200 divide-y">
              {posts.data.map((post) => <PostListItem key={post.id} post={post} />)}
            </div>
          )}
        </div>
      </div>
      <RightRail><ForumRightRail forum={forum.data} /></RightRail>
    </div>
  );
}
