import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { PostListItem } from "./PostListItem";

const post = {
  id: "p1", title: "Just shipped my first OSS lib", content: "After six months…",
  userId: "alice", forumName: "programming",
  createdAt: new Date(Date.now() - 4 * 3600_000).toISOString(),
  updatedAt: new Date(Date.now() - 4 * 3600_000).toISOString(),
  upvoteCount: 142, downvoteCount: 3, commentCount: 12,
};

describe("PostListItem", () => {
  it("renders the score (up - down), byline, title, snippet, and comment count", () => {
    render(<MemoryRouter><PostListItem post={post} /></MemoryRouter>);
    expect(screen.getByText("139")).toBeInTheDocument();
    expect(screen.getByText(/r\/programming/i)).toBeInTheDocument();
    expect(screen.getByText(/u\/alice/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /just shipped my first oss lib/i }))
      .toHaveAttribute("href", "/r/programming/p/p1");
    expect(screen.getByText(/12 comments/i)).toBeInTheDocument();
  });
});
