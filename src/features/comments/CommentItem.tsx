import { useState } from "react";
import { useUser } from "@/features/auth/useUser";
import { useUpdateComment } from "./useUpdateComment";
import { useDeleteComment } from "./useDeleteComment";
import { useVoteComment } from "./useVoteComment";
import { CommentForm } from "./CommentForm";
import { relativeTime } from "@/lib/relativeTime";
import type { components } from "@/lib/api/schema";

type Comment = components["schemas"]["CommentResponse"];
type VoteType = components["schemas"]["VoteType"];

function toLocal(v: VoteType | null | undefined): "up" | "down" | null {
  if (v === "UPVOTE") return "up";
  if (v === "DOWNVOTE") return "down";
  return null;
}

export function CommentItem({ comment, postId }: { comment: Comment; postId: string }) {
  const { userId } = useUser();
  const isMine = userId !== null && userId === comment.userId;
  const update = useUpdateComment(postId);
  const del = useDeleteComment(postId);
  const vote = useVoteComment(userId, postId);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const score = (comment.upvoteCount ?? 0) - (comment.downvoteCount ?? 0);
  const myVote = toLocal(comment.userVote);

  function doVote(direction: "up" | "down") {
    if (!userId) return;
    vote.mutate({ commentId: comment.id!, direction });
  }

  return (
    <article className="border-b border-slate-200 py-3 px-2 flex">
      <div className="w-8 flex flex-col items-center text-xs select-none">
        <button aria-label="Upvote comment" onClick={() => doVote("up")}
          className={myVote === "up" ? "text-orange-500" : "text-slate-400 hover:text-orange-500"}>▲</button>
        <span className="font-bold text-slate-800 my-0.5">{score}</span>
        <button aria-label="Downvote comment" onClick={() => doVote("down")}
          className={myVote === "down" ? "text-blue-500" : "text-slate-400 hover:text-blue-500"}>▼</button>
      </div>
      <div className="flex-1 pl-2 min-w-0">
        <p className="text-xs text-slate-500">u/{comment.userId}{comment.createdAt && ` · ${relativeTime(comment.createdAt)}`}</p>
        {editing ? (
          <div className="mt-2">
            <CommentForm initialValue={comment.content ?? ""} submitLabel="Save"
              isPending={update.isPending} errorMessage={update.isError ? "Couldn't save the edit." : null}
              onCancel={() => setEditing(false)}
              onSubmit={(content) => update.mutate({ commentId: comment.id!, content }, { onSuccess: () => setEditing(false) })} />
          </div>
        ) : (
          <p className="mt-1 whitespace-pre-wrap text-slate-800 text-sm">{comment.content}</p>
        )}
        {isMine && !editing && (
          <div className="mt-2 flex gap-2 text-xs">
            <button onClick={() => setEditing(true)} className="text-slate-500 hover:underline">Edit</button>
            {confirmDelete ? (
              <>
                <span className="text-slate-500">Delete?</span>
                <button onClick={() => del.mutate(comment.id!, { onSettled: () => setConfirmDelete(false) })}
                  className="text-red-600 hover:underline" disabled={del.isPending}>Yes</button>
                <button onClick={() => setConfirmDelete(false)} className="text-slate-500 hover:underline">No</button>
              </>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="text-slate-500 hover:underline">Delete</button>
            )}
          </div>
        )}
        {del.isError && <p className="text-xs text-red-600 mt-1">You no longer have permission to delete this comment.</p>}
      </div>
    </article>
  );
}
