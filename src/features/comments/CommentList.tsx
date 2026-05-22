import { useUser } from "@/features/auth/useUser";
import { useComments } from "./useComments";
import { useCreateComment } from "./useCreateComment";
import { CommentForm } from "./CommentForm";
import { CommentItem } from "./CommentItem";
import { Link, useLocation } from "react-router-dom";

export function CommentList({ postId }: { postId: string }) {
  const { userId } = useUser();
  const location = useLocation();
  const comments = useComments(postId);
  const create = useCreateComment(postId);

  return (
    <section className="bg-white border rounded">
      <div className="p-3 border-b">
        <h2 className="text-sm font-semibold mb-2">{comments.data?.length ?? 0} comments</h2>
        {userId ? (
          <CommentForm isPending={create.isPending}
            errorMessage={create.isError ? "Couldn't post the comment." : null}
            onSubmit={(content) => create.mutate({ content })} />
        ) : (
          <Link to={`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`}
            className="text-sm text-blue-600 hover:underline">Log in to comment</Link>
        )}
      </div>
      <div>
        {comments.isLoading && <p className="p-3 text-slate-500 text-sm">Loading comments…</p>}
        {comments.isError && <p className="p-3 text-slate-600 text-sm">Couldn't load comments.</p>}
        {comments.data && comments.data.length === 0 && <p className="p-3 text-slate-500 text-sm">No comments yet.</p>}
        {comments.data && comments.data.map((c) => <CommentItem key={c.id} comment={c} postId={postId} />)}
      </div>
    </section>
  );
}
