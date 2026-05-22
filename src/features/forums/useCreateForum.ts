import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";

type Req = components["schemas"]["ForumRequest"];

export function useCreateForum() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Req) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (api.POST as any)("/api/forums", { body });
      if (error) throw new Error("Failed to create forum");
      return data!;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["forums"] }); },
  });
}
