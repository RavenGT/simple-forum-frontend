import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSubscriptions } from "./useSubscriptions";
import { useSubscribe } from "./useSubscribe";
import { useUnsubscribe } from "./useUnsubscribe";

vi.mock("@/lib/api/client", () => ({ api: { GET: vi.fn(), POST: vi.fn(), DELETE: vi.fn() } }));
const { api } = await import("@/lib/api/client");
const get = vi.mocked(api.GET);
const post = vi.mocked(api.POST);
const del = vi.mocked(api.DELETE);

const w = (qc: QueryClient) => ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}>{children}</QueryClientProvider>
);
beforeEach(() => { get.mockReset(); post.mockReset(); del.mockReset(); });

describe("subscription hooks", () => {
  it("useSubscriptions fetches when userId is set", async () => {
    get.mockResolvedValueOnce({ data: [], error: undefined, response: new Response() } as any);
    const { result } = renderHook(() => useSubscriptions("alice"), { wrapper: w(new QueryClient()) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(get).toHaveBeenCalledWith("/api/users/me/subscriptions", {});
  });

  it("useSubscriptions stays idle when userId is null", () => {
    const { result } = renderHook(() => useSubscriptions(null), { wrapper: w(new QueryClient()) });
    expect(result.current.fetchStatus).toBe("idle");
    expect(get).not.toHaveBeenCalled();
  });

  it("useSubscribe POSTs and invalidates", async () => {
    post.mockResolvedValueOnce({ data: undefined, error: undefined, response: new Response() } as any);
    const qc = new QueryClient();
    const spy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useSubscribe("alice"), { wrapper: w(qc) });
    await result.current.mutateAsync("programming");
    expect(post).toHaveBeenCalledWith("/api/forums/{name}/subscribe", { params: { path: { name: "programming" } } });
    expect(spy).toHaveBeenCalledWith({ queryKey: ["subscriptions", "alice"] });
  });

  it("useUnsubscribe DELETEs and invalidates", async () => {
    del.mockResolvedValueOnce({ data: undefined, error: undefined, response: new Response() } as any);
    const qc = new QueryClient();
    const spy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useUnsubscribe("alice"), { wrapper: w(qc) });
    await result.current.mutateAsync("programming");
    expect(del).toHaveBeenCalledWith("/api/forums/{name}/subscribe", { params: { path: { name: "programming" } } });
    expect(spy).toHaveBeenCalledWith({ queryKey: ["subscriptions", "alice"] });
  });
});
