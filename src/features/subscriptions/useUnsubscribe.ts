import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export function useUnsubscribe(userId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (forumName: string) => {
      const { error } = await (api.DELETE as any)("/api/forums/{name}/subscribe", { params: { path: { name: forumName } } });
      if (error) throw new Error("Failed to unsubscribe");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscriptions", userId] }),
  });
}
