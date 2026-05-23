import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useVoteComment } from "./useVoteComment";

vi.mock("@/lib/api/client", () => ({ api: { POST: vi.fn() } }));
const { api } = await import("@/lib/api/client");
const post = vi.mocked(api.POST);

const comment = { id: "c1", postId: "p1", parentCommentId: null, content: "hi", userId: "x",
  createdAt: "x", updatedAt: "x", upvoteCount: 3, downvoteCount: 1, userVote: null };

function setup(userId = "alice", initialComment = comment) {
  const qc = new QueryClient();
  qc.setQueryData(["comments", { postId: "p1" }], [initialComment]);
  const { result } = renderHook(() => useVoteComment(userId, "p1"), {
    wrapper: ({ children }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>,
  });
  return { qc, result };
}
beforeEach(() => { post.mockReset(); localStorage.clear(); });

describe("useVoteComment", () => {
  it("optimistically upvotes a comment and sets userVote", async () => {
    post.mockResolvedValueOnce({ data: { userVote: "UPVOTE" }, error: undefined, response: new Response() } as any);
    const { qc, result } = setup();
    result.current.mutate({ commentId: "c1", direction: "up" });
    await waitFor(() => {
      const list = qc.getQueryData(["comments", { postId: "p1" }]) as any[];
      expect(list[0].upvoteCount).toBe(4);
      expect(list[0].userVote).toBe("UPVOTE");
    });
    expect(post).toHaveBeenCalledWith("/api/comments/{id}/upvote", { params: { path: { id: "c1" } } });
  });

  it("rolls back on API error", async () => {
    post.mockResolvedValueOnce({ data: undefined, error: { message: "boom" }, response: new Response() } as any);
    const { qc, result } = setup();
    result.current.mutate({ commentId: "c1", direction: "up" });
    await waitFor(() => {
      const list = qc.getQueryData(["comments", { postId: "p1" }]) as any[];
      expect(list[0].upvoteCount).toBe(3);
      expect(list[0].userVote).toBeNull();
    });
  });

  it("toggle off: same-direction click removes the vote", async () => {
    const upvotedComment = { ...comment, upvoteCount: 4, userVote: "UPVOTE" as const };
    post.mockResolvedValueOnce({ data: { userVote: null }, error: undefined, response: new Response() } as any);
    const { qc, result } = setup("alice", upvotedComment);
    result.current.mutate({ commentId: "c1", direction: "up" });
    await waitFor(() => {
      const list = qc.getQueryData(["comments", { postId: "p1" }]) as any[];
      expect(list[0].upvoteCount).toBe(3);
      expect(list[0].userVote).toBeNull();
    });
    expect(post).toHaveBeenCalled();
  });
});
