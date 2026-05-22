import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export function useForum(name: string) {
  return useQuery({
    queryKey: ["forums", name],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/forums/{name}", { params: { path: { name } } });
      if (error) throw new Error("Failed to load forum");
      return data!;
    },
    enabled: Boolean(name),
  });
}
