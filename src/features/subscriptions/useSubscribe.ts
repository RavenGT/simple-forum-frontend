import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export function useSubscribe(userId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (forumName: string) => {
      const { error } = await (api.POST as any)("/api/forums/{name}/subscribe", { params: { path: { name: forumName } } });
      if (error) throw new Error("Failed to subscribe");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscriptions", userId] }),
  });
}
