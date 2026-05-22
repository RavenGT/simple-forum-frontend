import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it } from "vitest";
import { Sidebar } from "./Sidebar";
import { UserProvider } from "@/features/auth/UserContext";
import { queryClient } from "@/lib/queryClient";

function setup() {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter><UserProvider><Sidebar /></UserProvider></MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Sidebar", () => {
  beforeEach(() => { localStorage.clear(); queryClient.clear(); });

  it("always shows the Browse all and Create forum links", () => {
    setup();
    expect(screen.getByRole("link", { name: /browse all forums/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /create forum/i })).toBeInTheDocument();
  });

  it("prompts to log in when logged out", () => {
    setup();
    expect(screen.getByText(/log in to subscribe/i)).toBeInTheDocument();
  });

  it("shows 'No subscriptions yet' when logged in with none", () => {
    localStorage.setItem("simple-forum:user-id", "alice");
    setup();
    expect(screen.getByText(/no subscriptions yet/i)).toBeInTheDocument();
  });
});
