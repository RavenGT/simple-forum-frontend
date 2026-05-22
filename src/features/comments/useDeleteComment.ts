import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";

type Post = components["schemas"]["PostResponse"];

export function useDeleteComment(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await (api.DELETE as any)("/api/comments/{id}", { params: { path: { id: commentId } } });
      if (error) throw new Error("Failed to delete comment");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", { postId }] });
      const post = qc.getQueryData<Post>(["posts", postId]);
      if (post && (post.commentCount ?? 0) > 0)
        qc.setQueryData(["posts", postId], { ...post, commentCount: (post.commentCount ?? 0) - 1 });
    },
  });
}
