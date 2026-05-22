import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";

type Req = components["schemas"]["ForumRequest"];

export function useCreateForum() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Req) => {
      const { data, error } = await api.POST("/api/forums", { body });
      if (error) throw new Error("Failed to create forum");
      return data!;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["forums"] }); },
  });
}
