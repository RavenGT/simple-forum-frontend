import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { getVote, setVote } from "@/lib/voteState";
import type { components } from "@/lib/api/schema";
import type { VoteValue } from "@/lib/voteState";

type Post = components["schemas"]["PostResponse"];
type Variables = { postId: string; forumName: string; direction: VoteValue };
type Snapshot = { post: Post | undefined; posts: Post[] | undefined; forumPosts: Post[] | undefined; prevVote: VoteValue | null };

function applyDelta(post: Post, _prev: VoteValue | null, next: VoteValue): Post {
  let up = post.upvoteCount ?? 0;
  let down = post.downvoteCount ?? 0;
  if (next === "up") up += 1;
  if (next === "down") down += 1;
  return { ...post, upvoteCount: up, downvoteCount: down };
}

export function useVotePost(userId: string | null) {
  const qc = useQueryClient();

  return useMutation<void, Error, Variables, Snapshot>({
    async mutationFn(vars) {
      const path = vars.direction === "up" ? "/api/posts/{id}/upvote" : "/api/posts/{id}/downvote";
      const { error } = await (api.POST as any)(path, { params: { path: { id: vars.postId } } });
      if (error) throw new Error("Vote failed");
    },
    async onMutate(vars) {
      if (!userId) throw new Error("Must be logged in to vote");
      const prevVote = getVote(userId, "post", vars.postId);
      if (prevVote === vars.direction) throw new Error("__noop__");
      await qc.cancelQueries({ queryKey: ["posts"] });
      await qc.cancelQueries({ queryKey: ["forums", vars.forumName, "posts"] });
      const snap: Snapshot = {
        post: qc.getQueryData<Post>(["posts", vars.postId]),
        posts: qc.getQueryData<Post[]>(["posts"]),
        forumPosts: qc.getQueryData<Post[]>(["forums", vars.forumName, "posts"]),
        prevVote,
      };
      const patchOne = (p: Post) => p.id === vars.postId ? applyDelta(p, prevVote, vars.direction) : p;
      if (snap.post) qc.setQueryData(["posts", vars.postId], applyDelta(snap.post, prevVote, vars.direction));
      if (snap.posts) qc.setQueryData(["posts"], snap.posts.map(patchOne));
      if (snap.forumPosts) qc.setQueryData(["forums", vars.forumName, "posts"], snap.forumPosts.map(patchOne));
      setVote(userId, "post", vars.postId, vars.direction);
      return snap;
    },
    onError(_err, vars, snap) {
      if (!snap) return;
      if (snap.post !== undefined) qc.setQueryData(["posts", vars.postId], snap.post);
      if (snap.posts !== undefined) qc.setQueryData(["posts"], snap.posts);
      if (snap.forumPosts !== undefined) qc.setQueryData(["forums", vars.forumName, "posts"], snap.forumPosts);
      if (userId) {
        if (snap.prevVote === null) {
          const raw = localStorage.getItem(`simple-forum:votes:${userId}`);
          if (raw) { try { const map = JSON.parse(raw) as Record<string, VoteValue>; delete map[`post:${vars.postId}`]; localStorage.setItem(`simple-forum:votes:${userId}`, JSON.stringify(map)); } catch { /* ignore */ } }
        } else { setVote(userId, "post", vars.postId, snap.prevVote); }
      }
    },
  });
}
