import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it } from "vitest";
import { VoteButtons } from "./VoteButtons";
import { UserProvider } from "@/features/auth/UserContext";
import { queryClient } from "@/lib/queryClient";

function setup(loggedIn = true) {
  if (loggedIn) localStorage.setItem("simple-forum:user-id", "alice");
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter><UserProvider><VoteButtons postId="p1" forumName="general" score={5} /></UserProvider></MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("VoteButtons", () => {
  beforeEach(() => { localStorage.clear(); queryClient.clear(); });

  it("renders both arrows and the score", () => {
    setup();
    expect(screen.getByRole("button", { name: /upvote/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /downvote/i })).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("renders disabled-looking arrows when logged out (Link to /login)", () => {
    setup(false);
    expect(screen.getAllByRole("link").some((a) => a.getAttribute("href")?.startsWith("/login"))).toBe(true);
  });
});
