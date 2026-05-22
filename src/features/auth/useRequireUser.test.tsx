import { renderHook } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { UserProvider } from "./UserContext";
import { useRequireUser } from "./useRequireUser";

describe("useRequireUser", () => {
  beforeEach(() => localStorage.clear());

  it("returns userId when logged in", () => {
    localStorage.setItem("simple-forum:user-id", "alice");
    const { result } = renderHook(() => useRequireUser(), {
      wrapper: ({ children }) => (
        <MemoryRouter initialEntries={["/submit"]}>
          <UserProvider>
            <Routes>
              <Route path="*" element={<>{children}</>} />
            </Routes>
          </UserProvider>
        </MemoryRouter>
      ),
    });
    expect(result.current).toBe("alice");
  });

  it("navigates to /login with returnTo when logged out", () => {
    let observed = "";
    function Probe() {
      observed = useLocation().pathname + useLocation().search;
      return null;
    }
    function Caller() {
      useRequireUser();
      return null;
    }
    renderHook(() => null, {
      wrapper: () => (
        <MemoryRouter initialEntries={["/submit"]}>
          <UserProvider>
            <Routes>
              <Route path="/submit" element={<Caller />} />
              <Route path="/login" element={<Probe />} />
            </Routes>
          </UserProvider>
        </MemoryRouter>
      ),
    });
    expect(observed).toBe("/login?returnTo=%2Fsubmit");
  });
});
