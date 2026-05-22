import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export function usePost(id: string) {
  return useQuery({
    queryKey: ["posts", id],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/posts/{id}", { params: { path: { id } } });
      if (error) throw new Error("Failed to load post");
      return data!;
    },
    enabled: Boolean(id),
  });
}
