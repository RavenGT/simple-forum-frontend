import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePosts } from "./usePosts";
import { usePost } from "./usePost";
import { useForumPosts } from "./useForumPosts";

vi.mock("@/lib/api/client", () => ({ api: { GET: vi.fn() } }));
const { api } = await import("@/lib/api/client");
const mockedGet = vi.mocked(api.GET);

const w = (qc: QueryClient) => ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}>{children}</QueryClientProvider>
);
beforeEach(() => mockedGet.mockReset());

const samplePost = {
  id: "p1", title: "Hi", content: "Body", userId: "alice",
  forumName: "general", createdAt: "2026-05-22T11:00:00Z", updatedAt: "2026-05-22T11:00:00Z",
  upvoteCount: 1, downvoteCount: 0, commentCount: 0,
};

describe("post query hooks", () => {
  it("usePosts calls /api/posts", async () => {
    mockedGet.mockResolvedValueOnce({ data: [samplePost], error: undefined, response: new Response() } as any);
    const { result } = renderHook(() => usePosts(), { wrapper: w(new QueryClient()) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedGet).toHaveBeenCalledWith("/api/posts", {});
  });

  it("usePost calls /api/posts/{id}", async () => {
    mockedGet.mockResolvedValueOnce({ data: samplePost, error: undefined, response: new Response() } as any);
    const { result } = renderHook(() => usePost("p1"), { wrapper: w(new QueryClient()) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedGet).toHaveBeenCalledWith("/api/posts/{id}", { params: { path: { id: "p1" } } });
  });

  it("useForumPosts calls /api/forums/{name}/posts", async () => {
    mockedGet.mockResolvedValueOnce({ data: [samplePost], error: undefined, response: new Response() } as any);
    const { result } = renderHook(() => useForumPosts("general"), { wrapper: w(new QueryClient()) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedGet).toHaveBeenCalledWith("/api/forums/{name}/posts", { params: { path: { name: "general" } } });
  });
});
