import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it } from "vitest";
import { PostListItem } from "./PostListItem";
import { UserProvider } from "@/features/auth/UserContext";
import { queryClient } from "@/lib/queryClient";

const post = {
  id: "p1", title: "Just shipped my first OSS lib", content: "After six months…",
  userId: "alice", forumName: "programming",
  createdAt: new Date(Date.now() - 4 * 3600_000).toISOString(),
  updatedAt: new Date(Date.now() - 4 * 3600_000).toISOString(),
  upvoteCount: 142, downvoteCount: 3, commentCount: 12,
};

describe("PostListItem", () => {
  beforeEach(() => { localStorage.clear(); queryClient.clear(); });

  it("renders the score (up - down), byline, title, snippet, and comment count", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter><UserProvider><PostListItem post={post} /></UserProvider></MemoryRouter>
      </QueryClientProvider>,
    );
    expect(screen.getByText("139")).toBeInTheDocument();
    expect(screen.getByText(/r\/programming/i)).toBeInTheDocument();
    expect(screen.getByText(/u\/alice/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /just shipped my first oss lib/i }))
      .toHaveAttribute("href", "/r/programming/p/p1");
    expect(screen.getByText(/12 comments/i)).toBeInTheDocument();
  });
});
