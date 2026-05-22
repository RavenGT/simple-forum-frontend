import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export function useForumPosts(name: string) {
  return useQuery({
    queryKey: ["forums", name, "posts"],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/forums/{name}/posts", { params: { path: { name } } });
      if (error) throw new Error("Failed to load forum posts");
      return data!;
    },
    enabled: Boolean(name),
  });
}
