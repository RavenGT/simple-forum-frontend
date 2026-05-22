import { beforeEach, describe, expect, it } from "vitest";
import { getVote, setVote, getAllVotes, clearVotesForUser } from "./voteState";

describe("voteState", () => {
  beforeEach(() => localStorage.clear());

  it("returns null for unknown post", () => {
    expect(getVote("alice", "post", "p1")).toBeNull();
  });

  it("round-trips a post upvote", () => {
    setVote("alice", "post", "p1", "up");
    expect(getVote("alice", "post", "p1")).toBe("up");
  });

  it("round-trips a comment downvote", () => {
    setVote("alice", "comment", "c1", "down");
    expect(getVote("alice", "comment", "c1")).toBe("down");
  });

  it("isolates votes per user", () => {
    setVote("alice", "post", "p1", "up");
    expect(getVote("bob", "post", "p1")).toBeNull();
  });

  it("isolates posts and comments with the same id", () => {
    setVote("alice", "post", "x", "up");
    setVote("alice", "comment", "x", "down");
    expect(getVote("alice", "post", "x")).toBe("up");
    expect(getVote("alice", "comment", "x")).toBe("down");
  });

  it("returns all votes for a user", () => {
    setVote("alice", "post", "p1", "up");
    setVote("alice", "comment", "c1", "down");
    expect(getAllVotes("alice")).toEqual({ "post:p1": "up", "comment:c1": "down" });
  });

  it("returns empty object for user with no votes", () => {
    expect(getAllVotes("ghost")).toEqual({});
  });

  it("clears votes for a user", () => {
    setVote("alice", "post", "p1", "up");
    setVote("bob", "post", "p2", "up");
    clearVotesForUser("alice");
    expect(getVote("alice", "post", "p1")).toBeNull();
    expect(getVote("bob", "post", "p2")).toBe("up");
  });

  it("gracefully handles corrupt JSON", () => {
    localStorage.setItem("simple-forum:votes:alice", "{not json");
    expect(getVote("alice", "post", "p1")).toBeNull();
    expect(getAllVotes("alice")).toEqual({});
  });
});
