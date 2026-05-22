import { Link, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/features/auth/useUser";
import { useSubscriptions } from "./useSubscriptions";
import { useSubscribe } from "./useSubscribe";
import { useUnsubscribe } from "./useUnsubscribe";
import { Button } from "@/components/ui/button";
import type { components } from "@/lib/api/schema";

type Forum = components["schemas"]["ForumResponse"];

export function SubscribeButton({ forum }: { forum: Forum }) {
  const { userId } = useUser();
  const location = useLocation();
  const qc = useQueryClient();
  const subs = useSubscriptions(userId);
  const subscribe = useSubscribe(userId);
  const unsubscribe = useUnsubscribe(userId);

  if (!userId) {
    return (
      <Button variant="outline" asChild>
        <Link to={`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`}>
          Log in to subscribe
        </Link>
      </Button>
    );
  }

  const isSubscribed = subs.data?.some((f: Forum) => f.name === forum.name) ?? false;
  const pending = subscribe.isPending || unsubscribe.isPending;

  function toggle() {
    if (!forum.name) return;
    const key = ["subscriptions", userId];
    const prev = qc.getQueryData<Forum[]>(key);
    if (isSubscribed) {
      qc.setQueryData(key, (prev ?? []).filter((f) => f.name !== forum.name));
      unsubscribe.mutate(forum.name!, { onError() { if (prev !== undefined) qc.setQueryData(key, prev); } });
    } else {
      qc.setQueryData(key, [...(prev ?? []), forum]);
      subscribe.mutate(forum.name!, { onError() { if (prev !== undefined) qc.setQueryData(key, prev); } });
    }
  }

  return (
    <Button variant={isSubscribed ? "outline" : "default"} onClick={toggle} disabled={pending}>
      {pending ? "…" : isSubscribed ? "Subscribed" : "Subscribe"}
    </Button>
  );
}
