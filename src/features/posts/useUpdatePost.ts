import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";

type Req = components["schemas"]["PostRequest"];

export function useUpdatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, body }: { postId: string; body: Req }) => {
      const { data, error } = await (api.PUT as any)("/api/posts/{id}", {
        params: { path: { id: postId } },
        body,
      });
      if (error) throw new Error("Failed to update post");
      return data!;
    },
    onSuccess: (updated) => {
      qc.setQueryData(["posts", updated.id], updated);
      qc.invalidateQueries({ queryKey: ["posts"] });
      qc.invalidateQueries({ queryKey: ["forums", updated.forumName, "posts"] });
    },
  });
}
