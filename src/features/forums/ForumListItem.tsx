import { Link } from "react-router-dom";
import type { components } from "@/lib/api/schema";

type Forum = components["schemas"]["ForumResponse"];

export function ForumListItem({ forum }: { forum: Forum }) {
  return (
    <article className="border-b border-slate-200 py-3 px-2 hover:bg-slate-50">
      <Link to={`/r/${forum.name}`} className="font-semibold text-slate-900 hover:underline">
        r/{forum.name}
      </Link>
      {forum.description && <p className="text-sm text-slate-600 mt-1">{forum.description}</p>}
      <p className="text-xs text-slate-500 mt-1">{forum.subscriberCount ?? 0} subscribers</p>
    </article>
  );
}
