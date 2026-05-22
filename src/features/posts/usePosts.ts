import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export function usePosts() {
  return useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/posts", {});
      if (error) throw new Error("Failed to load posts");
      return data!;
    },
  });
}
