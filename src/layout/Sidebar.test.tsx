import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Sidebar } from "./Sidebar";
import { UserProvider } from "@/features/auth/UserContext";
import { queryClient } from "@/lib/queryClient";

vi.mock("@/lib/api/client", () => ({ api: { GET: vi.fn() } }));
const { api } = await import("@/lib/api/client");
const get = vi.mocked(api.GET);

function setup() {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter><UserProvider><Sidebar /></UserProvider></MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Sidebar", () => {
  beforeEach(() => { localStorage.clear(); queryClient.clear(); get.mockReset(); });

  it("always shows the Browse all and Create forum links", () => {
    setup();
    expect(screen.getByRole("link", { name: /browse all forums/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /create forum/i })).toBeInTheDocument();
  });

  it("prompts to log in when logged out", () => {
    setup();
    expect(screen.getByText(/log in to subscribe/i)).toBeInTheDocument();
  });

  it("shows 'No subscriptions yet' when logged in with none", async () => {
    get.mockResolvedValueOnce({ data: [], error: undefined, response: new Response() } as any);
    localStorage.setItem("simple-forum:user-id", "alice");
    setup();
    await waitFor(() => expect(screen.getByText(/no subscriptions yet/i)).toBeInTheDocument());
  });

  it("shows subscribed forum links when data is available", async () => {
    localStorage.setItem("simple-forum:user-id", "alice");
    const qc = new QueryClient();
    qc.setQueryData(["subscriptions", "alice"], [
      { name: "programming", description: "", createdBy: "x", createdAt: "x", updatedAt: "x", subscriberCount: 1 },
      { name: "rust", description: "", createdBy: "x", createdAt: "x", updatedAt: "x", subscriberCount: 1 },
    ]);
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter><UserProvider><Sidebar /></UserProvider></MemoryRouter>
      </QueryClientProvider>,
    );
    expect(screen.getByRole("link", { name: /r\/programming/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /r\/rust/i })).toBeInTheDocument();
  });
});
