export function VoteScore({ score }: { score: number }) {
  return (
    <div className="w-10 flex flex-col items-center text-xs text-slate-500">
      <span aria-hidden>▲</span>
      <span className="font-bold text-sm text-slate-800 my-0.5">{score}</span>
      <span aria-hidden>▼</span>
    </div>
  );
}
