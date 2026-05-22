import { useParams } from "react-router-dom";
import { useForum } from "@/features/forums/useForum";
import { ForumHeader } from "@/features/forums/ForumHeader";
import NotFoundPage from "./NotFoundPage";

export default function ForumPage() {
  const { forumName } = useParams<{ forumName: string }>();
  const { data: forum, isLoading, isError, error } = useForum(forumName ?? "");

  if (!forumName) return <NotFoundPage />;
  if (isLoading) return <p className="p-6 text-slate-500">Loading forum…</p>;
  if (isError && /not found/i.test(String(error))) return <NotFoundPage />;
  if (isError || !forum) return <p className="p-6 text-slate-600">Couldn't load r/{forumName}.</p>;

  return (
    <div>
      <ForumHeader forum={forum} />
      <div className="max-w-3xl mx-auto p-6">
        <p className="text-slate-500">Posts list — coming in Task 31.</p>
      </div>
    </div>
  );
}
