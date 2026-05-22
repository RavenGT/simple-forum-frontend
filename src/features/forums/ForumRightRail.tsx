import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SubscribeButton } from "@/features/subscriptions/SubscribeButton";
import { relativeTime } from "@/lib/relativeTime";
import type { components } from "@/lib/api/schema";

type Forum = components["schemas"]["ForumResponse"];

export function ForumRightRail({ forum }: { forum: Forum }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold text-slate-900">r/{forum.name}</h2>
        {forum.description && <p className="text-sm text-slate-600 mt-1">{forum.description}</p>}
      </div>
      <dl className="text-xs text-slate-500 space-y-1">
        <div>{forum.subscriberCount ?? 0} subscribers</div>
        {forum.createdAt && <div>Created {relativeTime(forum.createdAt)}</div>}
      </dl>
      <div className="flex flex-col gap-2">
        <SubscribeButton forum={forum} />
        <Button variant="outline" asChild>
          <Link to={`/submit?forum=${forum.name}`}>Create post</Link>
        </Button>
      </div>
    </div>
  );
}
