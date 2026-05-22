import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { AppShell } from "./AppShell";
import { UserProvider } from "@/features/auth/UserContext";
import { queryClient } from "@/lib/queryClient";

describe("AppShell", () => {
  it("renders top nav, sidebar, and the routed child via <Outlet/>", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <UserProvider>
          <MemoryRouter initialEntries={["/"]}>
            <Routes>
              <Route element={<AppShell />}>
                <Route path="/" element={<div>routed child</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </UserProvider>
      </QueryClientProvider>,
    );
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("complementary")).toBeInTheDocument();
    expect(screen.getByText("routed child")).toBeInTheDocument();
  });
});
