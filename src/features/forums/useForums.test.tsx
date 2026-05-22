import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useForums } from "./useForums";
import { useForum } from "./useForum";

vi.mock("@/lib/api/client", () => ({ api: { GET: vi.fn() } }));
const { api } = await import("@/lib/api/client");
const mockedGet = vi.mocked(api.GET);

function wrapperFor(client: QueryClient) {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}
beforeEach(() => mockedGet.mockReset());

describe("useForums", () => {
  it("fetches and returns the forum list", async () => {
    mockedGet.mockResolvedValueOnce({
      data: [{ name: "programming", description: "code", createdBy: "alice",
              createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z",
              subscriberCount: 3 }],
      error: undefined, response: new Response(),
    } as any);
    const { result } = renderHook(() => useForums(), { wrapper: wrapperFor(new QueryClient()) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(mockedGet).toHaveBeenCalledWith("/api/forums", {});
  });
});

describe("useForum", () => {
  it("fetches a single forum by name", async () => {
    mockedGet.mockResolvedValueOnce({
      data: { name: "programming", description: "code", createdBy: "alice",
              createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z",
              subscriberCount: 0 },
      error: undefined, response: new Response(),
    } as any);
    const { result } = renderHook(() => useForum("programming"), { wrapper: wrapperFor(new QueryClient()) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.name).toBe("programming");
    expect(mockedGet).toHaveBeenCalledWith("/api/forums/{name}", { params: { path: { name: "programming" } } });
  });
});
