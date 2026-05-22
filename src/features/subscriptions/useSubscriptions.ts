import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export function useSubscriptions(userId: string | null) {
  return useQuery({
    queryKey: ["subscriptions", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await (api.GET as any)("/api/users/me/subscriptions", {});
      if (error) throw new Error("Failed to load subscriptions");
      return data!;
    },
  });
}
