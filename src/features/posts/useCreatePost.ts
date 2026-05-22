import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";

type Req = components["schemas"]["PostRequest"];

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Req) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (api.POST as any)("/api/posts", { body });
      if (error) throw new Error("Failed to create post");
      return data!;
    },
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ["posts"] });
      qc.invalidateQueries({ queryKey: ["forums", created.forumName, "posts"] });
    },
  });
}
