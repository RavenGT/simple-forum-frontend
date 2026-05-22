import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useVotePost } from "./useVotePost";
import { setVote, getVote } from "@/lib/voteState";

vi.mock("@/lib/api/client", () => ({ api: { POST: vi.fn() } }));
const { api } = await import("@/lib/api/client");
const mockedPost = vi.mocked(api.POST);

const post = { id: "p1", title: "Hi", content: "x", userId: "bob",
  forumName: "general", createdAt: "x", updatedAt: "x",
  upvoteCount: 5, downvoteCount: 1, commentCount: 0 };

function setup(userId = "alice") {
  const qc = new QueryClient();
  qc.setQueryData(["posts", "p1"], post);
  qc.setQueryData(["posts"], [post]);
  qc.setQueryData(["forums", "general", "posts"], [post]);
  const { result } = renderHook(() => useVotePost(userId), {
    wrapper: ({ children }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>,
  });
  return { qc, result };
}

beforeEach(() => { mockedPost.mockReset(); localStorage.clear(); });

describe("useVotePost", () => {
  it("optimistic upvote: bumps cached count and saves local vote", async () => {
    mockedPost.mockResolvedValueOnce({ data: undefined, error: undefined, response: new Response() } as any);
    const { qc, result } = setup();
    result.current.mutate({ postId: "p1", forumName: "general", direction: "up" });
    await waitFor(() => { expect((qc.getQueryData(["posts", "p1"]) as any).upvoteCount).toBe(6); });
    expect(getVote("alice", "post", "p1")).toBe("up");
    expect(mockedPost).toHaveBeenCalledWith("/api/posts/{id}/upvote", { params: { path: { id: "p1" } } });
  });

  it("no-op when clicking same direction twice", async () => {
    setVote("alice", "post", "p1", "up");
    const { result } = setup();
    result.current.mutate({ postId: "p1", forumName: "general", direction: "up" });
    await new Promise((r) => setTimeout(r, 0));
    expect(mockedPost).not.toHaveBeenCalled();
  });

  it("downvote after upvote: decrements up, increments down", async () => {
    setVote("alice", "post", "p1", "up");
    mockedPost.mockResolvedValueOnce({ data: undefined, error: undefined, response: new Response() } as any);
    const { qc, result } = setup();
    result.current.mutate({ postId: "p1", forumName: "general", direction: "down" });
    await waitFor(() => {
      const p = qc.getQueryData(["posts", "p1"]) as any;
      expect(p.upvoteCount).toBe(4);
      expect(p.downvoteCount).toBe(2);
    });
    expect(getVote("alice", "post", "p1")).toBe("down");
  });

  it("rolls back optimistic update on API error", async () => {
    mockedPost.mockResolvedValueOnce({ data: undefined, error: { message: "boom" }, response: new Response() } as any);
    const { qc, result } = setup();
    result.current.mutate({ postId: "p1", forumName: "general", direction: "up" });
    await waitFor(() => { const p = qc.getQueryData(["posts", "p1"]) as any; expect(p.upvoteCount).toBe(5); });
    expect(getVote("alice", "post", "p1")).toBeNull();
  });
});
