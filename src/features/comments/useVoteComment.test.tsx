import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useVoteComment } from "./useVoteComment";
import { getVote, setVote } from "@/lib/voteState";

vi.mock("@/lib/api/client", () => ({ api: { POST: vi.fn() } }));
const { api } = await import("@/lib/api/client");
const post = vi.mocked(api.POST);

const comment = { id: "c1", postId: "p1", parentCommentId: null, content: "hi", userId: "x",
  createdAt: "x", updatedAt: "x", upvoteCount: 3, downvoteCount: 1 };

function setup(userId = "alice") {
  const qc = new QueryClient();
  qc.setQueryData(["comments", { postId: "p1" }], [comment]);
  const { result } = renderHook(() => useVoteComment(userId, "p1"), {
    wrapper: ({ children }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>,
  });
  return { qc, result };
}
beforeEach(() => { post.mockReset(); localStorage.clear(); });

describe("useVoteComment", () => {
  it("optimistically upvotes a comment and records local vote", async () => {
    post.mockResolvedValueOnce({ data: undefined, error: undefined, response: new Response() } as any);
    const { qc, result } = setup();
    result.current.mutate({ commentId: "c1", direction: "up" });
    await waitFor(() => { const list = qc.getQueryData(["comments", { postId: "p1" }]) as any[]; expect(list[0].upvoteCount).toBe(4); });
    expect(getVote("alice", "comment", "c1")).toBe("up");
    expect(post).toHaveBeenCalledWith("/api/comments/{id}/upvote", { params: { path: { id: "c1" } } });
  });

  it("rolls back on API error", async () => {
    post.mockResolvedValueOnce({ data: undefined, error: { message: "boom" }, response: new Response() } as any);
    const { qc, result } = setup();
    result.current.mutate({ commentId: "c1", direction: "up" });
    await waitFor(() => { const list = qc.getQueryData(["comments", { postId: "p1" }]) as any[]; expect(list[0].upvoteCount).toBe(3); });
    expect(getVote("alice", "comment", "c1")).toBeNull();
  });

  it("no-ops on same-direction click", async () => {
    setVote("alice", "comment", "c1", "up");
    const { result } = setup();
    result.current.mutate({ commentId: "c1", direction: "up" });
    await new Promise((r) => setTimeout(r, 0));
    expect(post).not.toHaveBeenCalled();
  });
});
