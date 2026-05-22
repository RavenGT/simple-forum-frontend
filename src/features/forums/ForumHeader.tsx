import type { components } from "@/lib/api/schema";

type Forum = components["schemas"]["ForumResponse"];

export function ForumHeader({ forum }: { forum: Forum }) {
  return (
    <header className="bg-white border-b border-slate-200 p-6">
      <h1 className="text-2xl font-semibold">r/{forum.name}</h1>
      {forum.description && <p className="text-slate-700 mt-2">{forum.description}</p>}
      <p className="text-xs text-slate-500 mt-3">
        Created by u/{forum.createdBy} · {forum.subscriberCount ?? 0} subscribers
      </p>
    </header>
  );
}
