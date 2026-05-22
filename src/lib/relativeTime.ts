export function relativeTime(input: Date | string, now: number = Date.now()): string {
  const then = typeof input === "string" ? new Date(input).getTime() : input.getTime();
  const diffMs = now - then;
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  const wk = Math.floor(day / 7);
  if (day < 365) return `${wk}w ago`;
  return new Date(then).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}
