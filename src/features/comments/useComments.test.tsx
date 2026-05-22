import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useComments } from "./useComments";
import { useCreateComment } from "./useCreateComment";

vi.mock("@/lib/api/client", () => ({ api: { GET: vi.fn(), POST: vi.fn() } }));
const { api } = await import("@/lib/api/client");
const get = vi.mocked(api.GET);
const post = vi.mocked(api.POST);

const w = (qc: QueryClient) => ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}>{children}</QueryClientProvider>
);
beforeEach(() => { get.mockReset(); post.mockReset(); });

describe("comment hooks", () => {
  it("useComments fetches by postId", async () => {
    get.mockResolvedValueOnce({ data: [], error: undefined, response: new Response() } as any);
    const { result } = renderHook(() => useComments("p1"), { wrapper: w(new QueryClient()) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(get).toHaveBeenCalledWith("/api/comments", { params: { query: { postId: "p1" } } });
  });

  it("useCreateComment POSTs and invalidates the comment list", async () => {
    const created = { id: "c1", postId: "p1", parentCommentId: null, content: "hi", userId: "alice",
      createdAt: "x", updatedAt: "x", upvoteCount: 0, downvoteCount: 0 };
    post.mockResolvedValueOnce({ data: created, error: undefined, response: new Response() } as any);
    const qc = new QueryClient();
    const spy = vi.spyOn(qc, "invalidateQueries");
    qc.setQueryData(["posts", "p1"], { id: "p1", title: "x", content: "y", userId: "u", forumName: "f",
      createdAt: "x", updatedAt: "x", upvoteCount: 0, downvoteCount: 0, commentCount: 0 });
    const { result } = renderHook(() => useCreateComment("p1"), { wrapper: w(qc) });
    await result.current.mutateAsync({ content: "hi" });
    expect(post).toHaveBeenCalledWith("/api/comments", { body: { postId: "p1", content: "hi" } });
    await waitFor(() => expect(spy).toHaveBeenCalledWith({ queryKey: ["comments", { postId: "p1" }] }));
    expect((qc.getQueryData(["posts", "p1"]) as any).commentCount).toBe(1);
  });
});
