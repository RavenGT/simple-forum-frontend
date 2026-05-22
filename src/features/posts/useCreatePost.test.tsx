import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCreatePost } from "./useCreatePost";

vi.mock("@/lib/api/client", () => ({ api: { POST: vi.fn() } }));
const { api } = await import("@/lib/api/client");
const mockedPost = vi.mocked(api.POST);
beforeEach(() => mockedPost.mockReset());

describe("useCreatePost", () => {
  it("POSTs body and invalidates posts + that forum's posts", async () => {
    const qc = new QueryClient();
    const spy = vi.spyOn(qc, "invalidateQueries");
    const created = { id: "p1", title: "Hi", content: "Body", userId: "alice",
      forumName: "programming", createdAt: "x", updatedAt: "x",
      upvoteCount: 0, downvoteCount: 0, commentCount: 0 };
    mockedPost.mockResolvedValueOnce({ data: created, error: undefined, response: new Response() } as any);
    const { result } = renderHook(() => useCreatePost(), {
      wrapper: ({ children }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>,
    });
    const returned = await result.current.mutateAsync({ title: "Hi", content: "Body", forumName: "programming" });
    expect(mockedPost).toHaveBeenCalledWith("/api/posts", { body: { title: "Hi", content: "Body", forumName: "programming" } });
    expect(returned.id).toBe("p1");
    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith({ queryKey: ["posts"] });
      expect(spy).toHaveBeenCalledWith({ queryKey: ["forums", "programming", "posts"] });
    });
  });
});
