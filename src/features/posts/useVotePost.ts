import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";

type Post = components["schemas"]["PostResponse"];
type VoteType = components["schemas"]["VoteType"];
type Variables = { postId: string; forumName: string; direction: "up" | "down" };
type Snapshot = { post: Post | undefined; posts: Post[] | undefined; forumPosts: Post[] | undefined };

function toLocal(v: VoteType | null | undefined): "up" | "down" | null {
  if (v === "UPVOTE") return "up";
  if (v === "DOWNVOTE") return "down";
  return null;
}

function applyDelta(post: Post, prev: "up" | "down" | null, next: "up" | "down"): Post {
  let up = post.upvoteCount ?? 0;
  let down = post.downvoteCount ?? 0;
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
  return { ...post, upvoteCount: up, downvoteCount: down, userVote };
}

export function useVotePost(userId: string | null) {
  const qc = useQueryClient();

  return useMutation<components["schemas"]["VoteResponse"], Error, Variables, Snapshot>({
    async mutationFn(vars) {
      const path = vars.direction === "up" ? "/api/posts/{id}/upvote" : "/api/posts/{id}/downvote";
      const { data, error } = await (api.POST as any)(path, { params: { path: { id: vars.postId } } });
      if (error) throw new Error("Vote failed");
      return data!;
    },
    async onMutate(vars) {
      if (!userId) throw new Error("Must be logged in to vote");
      await qc.cancelQueries({ queryKey: ["posts"] });
      await qc.cancelQueries({ queryKey: ["forums", vars.forumName, "posts"] });
      const snap: Snapshot = {
        post: qc.getQueryData<Post>(["posts", vars.postId]),
        posts: qc.getQueryData<Post[]>(["posts"]),
        forumPosts: qc.getQueryData<Post[]>(["forums", vars.forumName, "posts"]),
      };
      const prev = toLocal(snap.post?.userVote);
      const patchOne = (p: Post) => p.id === vars.postId ? applyDelta(p, prev, vars.direction) : p;
      if (snap.post) qc.setQueryData(["posts", vars.postId], applyDelta(snap.post, prev, vars.direction));
      if (snap.posts) qc.setQueryData(["posts"], snap.posts.map(patchOne));
      if (snap.forumPosts) qc.setQueryData(["forums", vars.forumName, "posts"], snap.forumPosts.map(patchOne));
      return snap;
    },
    onSuccess(data, vars) {
      const newVote = data?.userVote ?? null;
      const patch = (p: Post) => p.id === vars.postId ? { ...p, userVote: newVote } : p;
      const post = qc.getQueryData<Post>(["posts", vars.postId]);
      if (post) qc.setQueryData(["posts", vars.postId], { ...post, userVote: newVote });
      const posts = qc.getQueryData<Post[]>(["posts"]);
      if (posts) qc.setQueryData(["posts"], posts.map(patch));
      const forumPosts = qc.getQueryData<Post[]>(["forums", vars.forumName, "posts"]);
      if (forumPosts) qc.setQueryData(["forums", vars.forumName, "posts"], forumPosts.map(patch));
    },
    onError(_err, vars, snap) {
      if (!snap) return;
      if (snap.post !== undefined) qc.setQueryData(["posts", vars.postId], snap.post);
      if (snap.posts !== undefined) qc.setQueryData(["posts"], snap.posts);
      if (snap.forumPosts !== undefined) qc.setQueryData(["forums", vars.forumName, "posts"], snap.forumPosts);
    },
  });
}
