import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export function useUpdateComment(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
      const { data, error } = await api.PUT("/api/comments/{id}", { params: { path: { id: commentId } }, body: { postId, content } });
      if (error) throw new Error("Failed to update comment");
      return data!;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comments", { postId }] }),
  });
}
