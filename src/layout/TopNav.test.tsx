import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { TopNav } from "./TopNav";
import { UserProvider } from "@/features/auth/UserContext";

function setup() {
  return render(
    <MemoryRouter>
      <UserProvider><TopNav /></UserProvider>
    </MemoryRouter>,
  );
}

describe("TopNav", () => {
  beforeEach(() => localStorage.clear());

  it("shows a Log in link when logged out", () => {
    setup();
    expect(screen.getByRole("link", { name: /log in/i })).toBeInTheDocument();
  });

  it("shows the username trigger when logged in", () => {
    localStorage.setItem("simple-forum:user-id", "alice");
    setup();
    expect(screen.getByRole("button", { name: /alice/i })).toBeInTheDocument();
  });
});
