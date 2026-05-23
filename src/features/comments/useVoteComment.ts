import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";

type Comment = components["schemas"]["CommentResponse"];
type VoteType = components["schemas"]["VoteType"];
type Variables = { commentId: string; direction: "up" | "down" };
type Snapshot = { list: Comment[] | undefined };

function toLocal(v: VoteType | null | undefined): "up" | "down" | null {
  if (v === "UPVOTE") return "up";
  if (v === "DOWNVOTE") return "down";
  return null;
}

function applyDelta(c: Comment, prev: "up" | "down" | null, next: "up" | "down"): Comment {
  let up = c.upvoteCount ?? 0;
  let down = c.downvoteCount ?? 0;
  if (prev === "up") up -= 1;
  if (prev === "down") down -= 1;
  let userVote: VoteType | null;
  if (prev === next) {
    userVote = null;
  } else {
    if (next === "up") up += 1;
    if (next === "down") down += 1;
    userVote = next === "up" ? "UPVOTE" : "DOWNVOTE";
  }
  return { ...c, upvoteCount: up, downvoteCount: down, userVote };
}

export function useVoteComment(userId: string | null, postId: string) {
  const qc = useQueryClient();
  const key = ["comments", { postId }] as const;

  return useMutation<components["schemas"]["VoteResponse"], Error, Variables, Snapshot>({
    async mutationFn(vars) {
      const path = vars.direction === "up" ? "/api/comments/{id}/upvote" : "/api/comments/{id}/downvote";
      const { data, error } = await (api.POST as any)(path, { params: { path: { id: vars.commentId } } });
      if (error) throw new Error("Vote failed");
      return data!;
    },
    async onMutate(vars) {
      if (!userId) throw new Error("Must be logged in to vote");
      await qc.cancelQueries({ queryKey: key });
      const list = qc.getQueryData<Comment[]>(key);
      const prev = toLocal(list?.find((c) => c.id === vars.commentId)?.userVote);
      if (list) qc.setQueryData(key, list.map((c) => c.id === vars.commentId ? applyDelta(c, prev, vars.direction) : c));
      return { list };
    },
    onSuccess() {
      qc.invalidateQueries({ queryKey: key });
    },
    onError(_err, _vars, snap) {
      if (snap?.list !== undefined) qc.setQueryData(key, snap.list);
    },
  });
}
