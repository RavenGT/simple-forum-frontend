import { Link } from "react-router-dom";
import { useForums } from "@/features/forums/useForums";
import { ForumListItem } from "@/features/forums/ForumListItem";
import { Button } from "@/components/ui/button";

export default function ForumsPage() {
  const { data, isLoading, isError, refetch } = useForums();
  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Forums</h1>
        <Button asChild><Link to="/forums/new">+ Create forum</Link></Button>
      </div>
      {isLoading && <p className="text-slate-500">Loading forums…</p>}
      {isError && (
        <div className="text-slate-600 space-y-2">
          <p>Couldn't load forums.</p>
          <Button variant="outline" onClick={() => refetch()}>Retry</Button>
        </div>
      )}
      {data && data.length === 0 && <p className="text-slate-500">No forums yet — be the first to create one.</p>}
      {data && data.length > 0 && (
        <div>{data.map((forum) => <ForumListItem key={forum.name} forum={forum} />)}</div>
      )}
    </div>
  );
}
