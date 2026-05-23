import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await (api.DELETE as any)("/api/posts/{id}", { params: { path: { id: postId } } });
      if (error) throw new Error("Failed to delete post");
    },
    onSuccess: (_data, postId) => {
      qc.removeQueries({ queryKey: ["posts", postId] });
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}
