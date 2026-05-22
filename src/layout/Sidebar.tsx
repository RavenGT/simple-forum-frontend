import { Link } from "react-router-dom";
import { useUser } from "@/features/auth/useUser";
import { useSubscriptions } from "@/features/subscriptions/useSubscriptions";

export function Sidebar() {
  const { userId } = useUser();
  const subs = useSubscriptions(userId);

  return (
    <aside className="w-56 border-r bg-white p-4 text-sm flex flex-col gap-4">
      <section>
        <h2 className="text-xs uppercase tracking-wide text-slate-500 mb-2">My Subscriptions</h2>
        {!userId && <p className="text-slate-500">Log in to subscribe to forums</p>}
        {userId && subs.isLoading && <p className="text-slate-500">Loading…</p>}
        {userId && subs.data && subs.data.length === 0 && <p className="text-slate-500">No subscriptions yet</p>}
        {userId && subs.data && subs.data.length > 0 && (
          <ul className="space-y-1">
            {subs.data.map((f) => (
              <li key={f.name}>
                <Link to={`/r/${f.name}`} className="text-slate-700 hover:underline">r/{f.name}</Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="border-t pt-4 space-y-1">
        <Link to="/forums" className="block text-slate-700 hover:underline">Browse all forums</Link>
        <Link to="/forums/new" className="block text-slate-700 hover:underline">+ Create forum</Link>
      </section>
    </aside>
  );
}
