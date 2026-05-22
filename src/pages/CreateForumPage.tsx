import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useRequireUser } from "@/features/auth/useRequireUser";
import { useCreateForum } from "@/features/forums/useCreateForum";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

const NAME_RE = /^[a-zA-Z0-9_-]{3,30}$/;

export default function CreateForumPage() {
  const userId = useRequireUser();
  const navigate = useNavigate();
  const create = useCreateForum();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!userId) return null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setValidationError(null);
    if (!NAME_RE.test(name)) { setValidationError("Name: 3-30 chars, letters/digits/_/-"); return; }
    if (!description.trim()) { setValidationError("Description is required"); return; }
    if (description.length > 200) { setValidationError("Description must be 200 characters or fewer"); return; }
    create.mutate({ name, description: description.trim() }, { onSuccess: (forum) => navigate(`/r/${forum.name}`) });
  }

  return (
    <div className="mx-auto max-w-xl p-6">
      <h1 className="text-xl font-semibold mb-4">Create a new forum</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="forum-name">Name</Label>
          <Input id="forum-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="programming" autoFocus />
        </div>
        <div className="space-y-1">
          <Label htmlFor="forum-desc">Description</Label>
          <Textarea id="forum-desc" value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this forum about?" rows={3} />
          <p className="text-xs text-slate-500">{description.length}/200</p>
        </div>
        {(validationError || create.isError) && (
          <Alert variant="destructive">
            <AlertDescription>{validationError ?? "Couldn't create the forum (name may be taken)."}</AlertDescription>
          </Alert>
        )}
        <Button type="submit" disabled={create.isPending}>{create.isPending ? "Creating…" : "Create forum"}</Button>
      </form>
    </div>
  );
}
