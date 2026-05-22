import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCreateForum } from "./useCreateForum";

vi.mock("@/lib/api/client", () => ({ api: { POST: vi.fn() } }));
const { api } = await import("@/lib/api/client");
const mockedPost = vi.mocked(api.POST);
beforeEach(() => mockedPost.mockReset());

describe("useCreateForum", () => {
  it("POSTs body and invalidates forums query", async () => {
    const qc = new QueryClient();
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const created = { name: "rust", description: "Rustaceans", createdBy: "alice",
      createdAt: "x", updatedAt: "x", subscriberCount: 0 };
    mockedPost.mockResolvedValueOnce({ data: created, error: undefined, response: new Response() } as any);
    const { result } = renderHook(() => useCreateForum(), {
      wrapper: ({ children }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>,
    });
    const returned = await result.current.mutateAsync({ name: "rust", description: "Rustaceans" });
    expect(mockedPost).toHaveBeenCalledWith("/api/forums", { body: { name: "rust", description: "Rustaceans" } });
    expect(returned).toEqual(created);
    await waitFor(() => expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["forums"] }));
  });

  it("throws on API error", async () => {
    mockedPost.mockResolvedValueOnce({ data: undefined, error: { message: "Conflict" }, response: new Response() } as any);
    const { result } = renderHook(() => useCreateForum(), {
      wrapper: ({ children }) => <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>,
    });
    await expect(result.current.mutateAsync({ name: "x", description: "y" })).rejects.toThrow();
  });
});
