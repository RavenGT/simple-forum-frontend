import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ForumListItem } from "./ForumListItem";

const forum = { name: "programming", description: "Code, code, and more code.",
  createdBy: "alice", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z",
  subscriberCount: 42 };

describe("ForumListItem", () => {
  it("renders the forum name, description, and subscriber count", () => {
    render(<MemoryRouter><ForumListItem forum={forum} /></MemoryRouter>);
    expect(screen.getByRole("link", { name: /programming/i })).toHaveAttribute("href", "/r/programming");
    expect(screen.getByText(/code, code, and more code/i)).toBeInTheDocument();
    expect(screen.getByText(/42 subscribers/i)).toBeInTheDocument();
  });
});
