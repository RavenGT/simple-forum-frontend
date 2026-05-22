import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function CommentForm({
  initialValue = "", submitLabel = "Comment", onSubmit, onCancel, isPending = false, errorMessage = null,
}: {
  initialValue?: string; submitLabel?: string; onSubmit: (content: string) => void;
  onCancel?: () => void; isPending?: boolean; errorMessage?: string | null;
}) {
  const [value, setValue] = useState(initialValue);
  const [localError, setLocalError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLocalError(null);
    const trimmed = value.trim();
    if (trimmed.length === 0) return setLocalError("Comment cannot be empty");
    if (trimmed.length > 4000) return setLocalError("Comment must be 4000 characters or fewer");
    onSubmit(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea rows={3} value={value} onChange={(e) => setValue(e.target.value)} placeholder="Write a comment…" />
      {(localError || errorMessage) && (
        <Alert variant="destructive"><AlertDescription>{localError ?? errorMessage}</AlertDescription></Alert>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>{isPending ? "…" : submitLabel}</Button>
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
      </div>
    </form>
  );
}
