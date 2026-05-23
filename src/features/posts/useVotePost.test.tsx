import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useVotePost } from "./useVotePost";

vi.mock("@/lib/api/client", () => ({ api: { POST: vi.fn() } }));
const { api } = await import("@/lib/api/client");
const mockedPost = vi.mocked(api.POST);

const post = { id: "p1", title: "Hi", content: "x", userId: "bob",
  forumName: "general", createdAt: "x", updatedAt: "x",
  upvoteCount: 5, downvoteCount: 1, commentCount: 0, userVote: null };

function setup(userId = "alice", initialPost = post) {
  const qc = new QueryClient();
  qc.setQueryData(["posts", "p1"], initialPost);
  qc.setQueryData(["posts"], [initialPost]);
  qc.setQueryData(["forums", "general", "posts"], [initialPost]);
  const { result } = renderHook(() => useVotePost(userId), {
    wrapper: ({ children }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>,
  });
  return { qc, result };
}

beforeEach(() => { mockedPost.mockReset(); localStorage.clear(); });

describe("useVotePost", () => {
  it("optimistic upvote: bumps cached upvoteCount and sets userVote", async () => {
    mockedPost.mockResolvedValueOnce({ data: { userVote: "UPVOTE" }, error: undefined, response: new Response() } as any);
    const { qc, result } = setup();
    result.current.mutate({ postId: "p1", forumName: "general", direction: "up" });
    await waitFor(() => {
      const p = qc.getQueryData(["posts", "p1"]) as any;
      expect(p.upvoteCount).toBe(6);
      expect(p.userVote).toBe("UPVOTE");
    });
    expect(mockedPost).toHaveBeenCalledWith("/api/posts/{id}/upvote", { params: { path: { id: "p1" } } });
  });

  it("toggle off: same-direction click removes the vote", async () => {
    const upvotedPost = { ...post, upvoteCount: 6, userVote: "UPVOTE" as const };
    mockedPost.mockResolvedValueOnce({ data: { userVote: null }, error: undefined, response: new Response() } as any);
    const { qc, result } = setup("alice", upvotedPost);
    result.current.mutate({ postId: "p1", forumName: "general", direction: "up" });
    await waitFor(() => {
      const p = qc.getQueryData(["posts", "p1"]) as any;
      expect(p.upvoteCount).toBe(5);
      expect(p.userVote).toBeNull();
    });
    expect(mockedPost).toHaveBeenCalled();
  });

  it("downvote after upvote: decrements up, increments down", async () => {
    const upvotedPost = { ...post, userVote: "UPVOTE" as const };
    mockedPost.mockResolvedValueOnce({ data: { userVote: "DOWNVOTE" }, error: undefined, response: new Response() } as any);
    const { qc, result } = setup("alice", upvotedPost);
    result.current.mutate({ postId: "p1", forumName: "general", direction: "down" });
    await waitFor(() => {
      const p = qc.getQueryData(["posts", "p1"]) as any;
      expect(p.upvoteCount).toBe(4);
      expect(p.downvoteCount).toBe(2);
      expect(p.userVote).toBe("DOWNVOTE");
    });
  });

  it("rolls back optimistic update on API error", async () => {
    mockedPost.mockResolvedValueOnce({ data: undefined, error: { message: "boom" }, response: new Response() } as any);
    const { qc, result } = setup();
    result.current.mutate({ postId: "p1", forumName: "general", direction: "up" });
    await waitFor(() => {
      const p = qc.getQueryData(["posts", "p1"]) as any;
      expect(p.upvoteCount).toBe(5);
      expect(p.userVote).toBeNull();
    });
  });
});
