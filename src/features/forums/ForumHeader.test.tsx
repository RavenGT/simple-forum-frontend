import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ForumHeader } from "./ForumHeader";

const forum = { name: "programming", description: "Code-land.", createdBy: "alice",
  createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", subscriberCount: 100 };

describe("ForumHeader", () => {
  it("renders forum metadata", () => {
    render(<ForumHeader forum={forum} />);
    expect(screen.getByRole("heading", { name: /r\/programming/i })).toBeInTheDocument();
    expect(screen.getByText(/code-land/i)).toBeInTheDocument();
    expect(screen.getByText(/created by u\/alice/i)).toBeInTheDocument();
    expect(screen.getByText(/100 subscribers/i)).toBeInTheDocument();
  });
});
