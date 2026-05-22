import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export function useForums() {
  return useQuery({
    queryKey: ["forums"],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/forums", {});
      if (error) throw new Error("Failed to load forums");
      return data!;
    },
  });
}
