import type { ReactNode } from "react";

export function RightRail({ children }: { children: ReactNode }) {
  return (
    <aside className="w-72 shrink-0 border-l bg-white p-4 hidden lg:block">
      {children}
    </aside>
  );
}
