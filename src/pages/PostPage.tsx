import { useState, type FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePost } from "@/features/posts/usePost";
import { useUpdatePost } from "@/features/posts/useUpdatePost";
import { useDeletePost } from "@/features/posts/useDeletePost";
import { useForum } from "@/features/forums/useForum";
import { ForumRightRail } from "@/features/forums/ForumRightRail";
import { VoteButtons } from "@/features/posts/VoteButtons";
import { relativeTime } from "@/lib/relativeTime";
import { RightRail } from "@/layout/RightRail";
import { CommentList } from "@/features/comments/CommentList";
import { useUser } from "@/features/auth/useUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import NotFoundPage from "./NotFoundPage";

export default function PostPage() {
  const { forumName, postId } = useParams<{ forumName: string; postId: string }>();
  const navigate = useNavigate();
  const { userId } = useUser();
  const post = usePost(postId ?? "");
  const forum = useForum(forumName ?? "");
  const update = useUpdatePost();
  const del = useDeletePost();

  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!postId || !forumName) return <NotFoundPage />;
  if (post.isLoading) return <p className="p-6 text-slate-500">Loading post…</p>;
  if (post.isError || !post.data) return <NotFoundPage />;

  const isMine = userId !== null && userId === post.data.userId;
  const score = (post.data.upvoteCount ?? 0) - (post.data.downvoteCount ?? 0);

  function startEditing() {
    setEditTitle(post.data!.title ?? "");
    setEditContent(post.data!.content ?? "");
    setValidationError(null);
    setEditing(true);
  }

  function handleEditSubmit(e: FormEvent) {
    e.preventDefault();
    setValidationError(null);
    if (editTitle.trim().length < 3 || editTitle.length > 300)
      return setValidationError("Title must be 3–300 characters");
    if (!editContent.trim())
      return setValidationError("Content is required");
    update.mutate(
      { postId: postId!, body: { title: editTitle.trim(), content: editContent.trim(), forumName: forumName! } },
      { onSuccess: () => setEditing(false) },
    );
  }

  function handleDelete() {
    del.mutate(postId!, { onSuccess: () => navigate(`/r/${forumName}`) });
  }

  return (
    <div className="flex">
      <div className="flex-1 min-w-0 max-w-3xl mx-auto p-6">
        <article className="bg-white border rounded p-4">
          <div className="flex">
            <VoteButtons postId={postId} forumName={forumName} score={score} userVote={post.data.userVote} />
            <div className="pl-3 flex-1 min-w-0">
              <p className="text-xs text-slate-500">
                r/{post.data.forumName} · posted by u/{post.data.userId}
                {post.data.createdAt && ` · ${relativeTime(post.data.createdAt)}`}
              </p>
              {editing ? (
                <form onSubmit={handleEditSubmit} className="mt-2 space-y-3">
                  <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Title" />
                  <Textarea rows={6} value={editContent} onChange={(e) => setEditContent(e.target.value)} placeholder="Content" />
                  {(validationError || update.isError) && (
                    <Alert variant="destructive">
                      <AlertDescription>{validationError ?? "Couldn't save the edit."}</AlertDescription>
                    </Alert>
                  )}
                  <div className="flex gap-2">
                    <Button type="submit" disabled={update.isPending}>{update.isPending ? "Saving…" : "Save"}</Button>
                    <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                  </div>
                </form>
              ) : (
                <>
                  <h1 className="text-2xl font-semibold mt-1">{post.data.title}</h1>
                  <p className="mt-3 whitespace-pre-wrap text-slate-800">{post.data.content}</p>
                </>
              )}
              {isMine && !editing && (
                <div className="mt-3 flex gap-2 text-xs">
                  <button onClick={startEditing} className="text-slate-500 hover:underline">Edit</button>
                  {confirmDelete ? (
                    <>
                      <span className="text-slate-500">Delete this post?</span>
                      <button onClick={handleDelete} disabled={del.isPending}
                        className="text-red-600 hover:underline">Yes</button>
                      <button onClick={() => setConfirmDelete(false)} className="text-slate-500 hover:underline">No</button>
                    </>
                  ) : (
                    <button onClick={() => setConfirmDelete(true)} className="text-slate-500 hover:underline">Delete</button>
                  )}
                  {del.isError && <span className="text-red-600">Couldn't delete the post.</span>}
                </div>
              )}
            </div>
          </div>
        </article>
        <section id="comments" className="mt-6">
          <CommentList postId={postId} />
        </section>
      </div>
      <RightRail>{forum.data && <ForumRightRail forum={forum.data} />}</RightRail>
    </div>
  );
}
