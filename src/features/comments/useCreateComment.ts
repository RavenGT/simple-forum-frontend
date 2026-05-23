import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { getCurrentUserId } from "@/lib/api/userIdMiddleware";
import { setVote } from "@/lib/voteState";
import type { components } from "@/lib/api/schema";

type Post = components["schemas"]["PostResponse"];

export function useCreateComment(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { content: string }) => {
      const { data, error } = await (api.POST as any)("/api/comments", { body: { postId, content: body.content } });
      if (error) throw new Error("Failed to create comment");
      return data!;
    },
    onSuccess: (created) => {
      const userId = getCurrentUserId();
      if (userId && created.id) setVote(userId, "comment", created.id, "up");
      qc.invalidateQueries({ queryKey: ["comments", { postId }] });
      const post = qc.getQueryData<Post>(["posts", postId]);
      if (post) qc.setQueryData(["posts", postId], { ...post, commentCount: (post.commentCount ?? 0) + 1 });
    },
  });
}
