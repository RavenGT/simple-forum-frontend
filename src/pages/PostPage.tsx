import { useParams } from "react-router-dom";
import { usePost } from "@/features/posts/usePost";
import { useForum } from "@/features/forums/useForum";
import { ForumHeader } from "@/features/forums/ForumHeader";
import { VoteButtons } from "@/features/posts/VoteButtons";
import { relativeTime } from "@/lib/relativeTime";
import { RightRail } from "@/layout/RightRail";
import NotFoundPage from "./NotFoundPage";

export default function PostPage() {
  const { forumName, postId } = useParams<{ forumName: string; postId: string }>();
  const post = usePost(postId ?? "");
  const forum = useForum(forumName ?? "");

  if (!postId || !forumName) return <NotFoundPage />;
  if (post.isLoading) return <p className="p-6 text-slate-500">Loading post…</p>;
  if (post.isError || !post.data) return <NotFoundPage />;

  const score = (post.data.upvoteCount ?? 0) - (post.data.downvoteCount ?? 0);

  return (
    <div className="flex">
      <div className="flex-1 min-w-0 max-w-3xl mx-auto p-6">
        <article className="bg-white border rounded p-4">
          <div className="flex">
            <VoteButtons postId={postId} forumName={forumName} score={score} />
            <div className="pl-3 flex-1 min-w-0">
              <p className="text-xs text-slate-500">
                r/{post.data.forumName} · posted by u/{post.data.userId}
                {post.data.createdAt && ` · ${relativeTime(post.data.createdAt)}`}
              </p>
              <h1 className="text-2xl font-semibold mt-1">{post.data.title}</h1>
              <p className="mt-3 whitespace-pre-wrap text-slate-800">{post.data.content}</p>
            </div>
          </div>
        </article>
        <section id="comments" className="mt-6">
          <p className="text-slate-500">{post.data.commentCount ?? 0} comments — coming in Task 48.</p>
        </section>
      </div>
      <RightRail>{forum.data && <ForumHeader forum={forum.data} />}</RightRail>
    </div>
  );
}
