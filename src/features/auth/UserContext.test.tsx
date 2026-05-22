import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { UserProvider } from "./UserContext";
import { useUser } from "./useUser";
import { getCurrentUserId } from "@/lib/api/userIdMiddleware";

function wrapper({ children }: { children: React.ReactNode }) {
  return <UserProvider>{children}</UserProvider>;
}

describe("UserProvider / useUser", () => {
  beforeEach(() => localStorage.clear());

  it("starts with no user", () => {
    const { result } = renderHook(() => useUser(), { wrapper });
    expect(result.current.userId).toBeNull();
    expect(getCurrentUserId()).toBeNull();
  });

  it("login stores the username and updates the middleware", () => {
    const { result } = renderHook(() => useUser(), { wrapper });
    act(() => result.current.login("alice"));
    expect(result.current.userId).toBe("alice");
    expect(localStorage.getItem("simple-forum:user-id")).toBe("alice");
    expect(getCurrentUserId()).toBe("alice");
  });

  it("logout clears the user and the middleware", () => {
    const { result } = renderHook(() => useUser(), { wrapper });
    act(() => result.current.login("alice"));
    act(() => result.current.logout());
    expect(result.current.userId).toBeNull();
    expect(localStorage.getItem("simple-forum:user-id")).toBeNull();
    expect(getCurrentUserId()).toBeNull();
  });

  it("rejects invalid usernames", () => {
    const { result } = renderHook(() => useUser(), { wrapper });
    expect(() => act(() => result.current.login(""))).toThrow();
    expect(() => act(() => result.current.login("a"))).toThrow();
    expect(() => act(() => result.current.login("a".repeat(33)))).toThrow();
    expect(() => act(() => result.current.login("bad name"))).toThrow();
    expect(() => act(() => result.current.login("bad!"))).toThrow();
  });

  it("rehydrates from localStorage on mount", () => {
    localStorage.setItem("simple-forum:user-id", "carol");
    const { result } = renderHook(() => useUser(), { wrapper });
    expect(result.current.userId).toBe("carol");
    expect(getCurrentUserId()).toBe("carol");
  });

  it("throws if useUser is called outside the provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useUser())).toThrow();
    spy.mockRestore();
  });
});
