import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { getVote, setVote } from "@/lib/voteState";
import type { components } from "@/lib/api/schema";
import type { VoteValue } from "@/lib/voteState";

type Comment = components["schemas"]["CommentResponse"];
type Variables = { commentId: string; direction: VoteValue };
type Snapshot = { list: Comment[] | undefined; prevVote: VoteValue | null };

function applyDelta(c: Comment, prev: VoteValue | null, next: VoteValue): Comment {
  let up = c.upvoteCount ?? 0;
  let down = c.downvoteCount ?? 0;
  if (prev === "up") up -= 1;
  if (prev === "down") down -= 1;
  if (next === "up") up += 1;
  if (next === "down") down += 1;
  return { ...c, upvoteCount: up, downvoteCount: down };
}

export function useVoteComment(userId: string | null, postId: string) {
  const qc = useQueryClient();
  const key = ["comments", { postId }] as const;

  return useMutation<void, Error, Variables, Snapshot>({
    async mutationFn(vars) {
      const path = vars.direction === "up" ? "/api/comments/{id}/upvote" : "/api/comments/{id}/downvote";
      const { error } = await (api.POST as any)(path, { params: { path: { id: vars.commentId } } });
      if (error) throw new Error("Vote failed");
    },
    async onMutate(vars) {
      if (!userId) throw new Error("Must be logged in to vote");
      const prevVote = getVote(userId, "comment", vars.commentId);
      if (prevVote === vars.direction) throw new Error("__noop__");
      await qc.cancelQueries({ queryKey: key });
      const list = qc.getQueryData<Comment[]>(key);
      if (list) qc.setQueryData(key, list.map((c) => c.id === vars.commentId ? applyDelta(c, prevVote, vars.direction) : c));
      setVote(userId, "comment", vars.commentId, vars.direction);
      return { list, prevVote };
    },
    onError(_err, vars, snap) {
      if (!snap) return;
      if (snap.list !== undefined) qc.setQueryData(key, snap.list);
      if (userId) {
        if (snap.prevVote === null) {
          const raw = localStorage.getItem(`simple-forum:votes:${userId}`);
          if (raw) { try { const map = JSON.parse(raw) as Record<string, VoteValue>; delete map[`comment:${vars.commentId}`]; localStorage.setItem(`simple-forum:votes:${userId}`, JSON.stringify(map)); } catch { /* ignore */ } }
        } else { setVote(userId, "comment", vars.commentId, snap.prevVote); }
      }
    },
  });
}
