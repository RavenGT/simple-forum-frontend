import { Link } from "react-router-dom";
import { relativeTime } from "@/lib/relativeTime";
import type { components } from "@/lib/api/schema";
import { VoteScore } from "./VoteScore";

type Post = components["schemas"]["PostResponse"];

export function PostListItem({ post }: { post: Post }) {
  const score = (post.upvoteCount ?? 0) - (post.downvoteCount ?? 0);
  return (
    <article className="flex border-b border-slate-200 bg-white px-2 py-2 hover:bg-slate-50">
      <VoteScore score={score} />
      <div className="flex-1 pl-2 min-w-0">
        <div className="text-xs text-slate-500">
          <Link to={`/r/${post.forumName}`} className="hover:underline">r/{post.forumName}</Link>
          {" · posted by "}
          <span>u/{post.userId}</span>
          {post.createdAt && ` · ${relativeTime(post.createdAt)}`}
        </div>
        <Link to={`/r/${post.forumName}/p/${post.id}`}
          className="block font-medium text-slate-900 hover:underline truncate">
          {post.title}
        </Link>
        {post.content && <p className="text-sm text-slate-600 mt-0.5 line-clamp-2">{post.content}</p>}
        <div className="mt-1 text-xs text-slate-500">
          <Link to={`/r/${post.forumName}/p/${post.id}#comments`} className="hover:underline">
            💬 {post.commentCount ?? 0} comments
          </Link>
        </div>
      </div>
    </article>
  );
}
