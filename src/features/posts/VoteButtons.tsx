import { Link, useLocation } from "react-router-dom";
import { useUser } from "@/features/auth/useUser";
import { useVotePost } from "./useVotePost";
import type { components } from "@/lib/api/schema";

type VoteType = components["schemas"]["VoteType"];

function toLocal(v: VoteType | null | undefined): "up" | "down" | null {
  if (v === "UPVOTE") return "up";
  if (v === "DOWNVOTE") return "down";
  return null;
}

export function VoteButtons({ postId, forumName, score, userVote }: {
  postId: string;
  forumName: string;
  score: number;
  userVote: VoteType | null | undefined;
}) {
  const { userId } = useUser();
  const location = useLocation();
  const mutation = useVotePost(userId);
  const myVote = toLocal(userVote);

  if (!userId) {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return (
      <div className="w-10 flex flex-col items-center text-xs text-slate-400">
        <Link to={`/login?returnTo=${returnTo}`} aria-label="Log in to upvote">▲</Link>
        <span className="font-bold text-sm text-slate-700 my-0.5">{score}</span>
        <Link to={`/login?returnTo=${returnTo}`} aria-label="Log in to downvote">▼</Link>
      </div>
    );
  }

  function vote(direction: "up" | "down") {
    mutation.mutate({ postId, forumName, direction });
  }

  return (
    <div className="w-10 flex flex-col items-center text-xs">
      <button type="button" aria-label="Upvote" onClick={() => vote("up")}
        className={myVote === "up" ? "text-orange-500" : "text-slate-500 hover:text-orange-500"}>▲</button>
      <span className="font-bold text-sm text-slate-800 my-0.5">{score}</span>
      <button type="button" aria-label="Downvote" onClick={() => vote("down")}
        className={myVote === "down" ? "text-blue-500" : "text-slate-500 hover:text-blue-500"}>▼</button>
    </div>
  );
}
