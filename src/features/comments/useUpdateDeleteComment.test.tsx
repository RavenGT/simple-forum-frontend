import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useUpdateComment } from "./useUpdateComment";
import { useDeleteComment } from "./useDeleteComment";

vi.mock("@/lib/api/client", () => ({ api: { PUT: vi.fn(), DELETE: vi.fn() } }));
const { api } = await import("@/lib/api/client");
const put = vi.mocked(api.PUT);
const del = vi.mocked(api.DELETE);

const w = (qc: QueryClient) => ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}>{children}</QueryClientProvider>
);
beforeEach(() => { put.mockReset(); del.mockReset(); });

describe("useUpdateComment", () => {
  it("PUTs and invalidates the post's comment list", async () => {
    put.mockResolvedValueOnce({ data: { id: "c1", postId: "p1", content: "edited",
      userId: "alice", createdAt: "x", updatedAt: "y", upvoteCount: 0, downvoteCount: 0,
      parentCommentId: null }, error: undefined, response: new Response() } as any);
    const qc = new QueryClient();
    const spy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useUpdateComment("p1"), { wrapper: w(qc) });
    await result.current.mutateAsync({ commentId: "c1", content: "edited" });
    expect(put).toHaveBeenCalledWith("/api/comments/{id}", { params: { path: { id: "c1" } }, body: { postId: "p1", content: "edited" } });
    expect(spy).toHaveBeenCalledWith({ queryKey: ["comments", { postId: "p1" }] });
  });
});

describe("useDeleteComment", () => {
  it("DELETEs, invalidates, decrements commentCount", async () => {
    del.mockResolvedValueOnce({ data: undefined, error: undefined, response: new Response() } as any);
    const qc = new QueryClient();
    qc.setQueryData(["posts", "p1"], { id: "p1", title: "x", content: "y", userId: "u", forumName: "f",
      createdAt: "x", updatedAt: "x", upvoteCount: 0, downvoteCount: 0, commentCount: 5 });
    const spy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useDeleteComment("p1"), { wrapper: w(qc) });
    await result.current.mutateAsync("c1");
    expect(del).toHaveBeenCalledWith("/api/comments/{id}", { params: { path: { id: "c1" } } });
    expect(spy).toHaveBeenCalledWith({ queryKey: ["comments", { postId: "p1" }] });
    expect((qc.getQueryData(["posts", "p1"]) as any).commentCount).toBe(4);
  });
});
