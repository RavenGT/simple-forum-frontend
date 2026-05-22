import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export function useComments(postId: string) {
  return useQuery({
    queryKey: ["comments", { postId }],
    enabled: Boolean(postId),
    queryFn: async () => {
      const { data, error } = await api.GET("/api/comments", { params: { query: { postId } } });
      if (error) throw new Error("Failed to load comments");
      return data!;
    },
  });
}
