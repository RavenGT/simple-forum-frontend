import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useRequireUser } from "@/features/auth/useRequireUser";
import { useForums } from "@/features/forums/useForums";
import { useCreatePost } from "@/features/posts/useCreatePost";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CreatePostPage() {
  const userId = useRequireUser();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const forums = useForums();
  const create = useCreatePost();

  const initialForum = search.get("forum") ?? "";
  const [forumName, setForumName] = useState(initialForum);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => { if (!forumName && initialForum) setForumName(initialForum); }, [forumName, initialForum]);

  if (!userId) return null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setValidationError(null);
    if (!forumName) return setValidationError("Pick a forum");
    if (title.trim().length < 3 || title.length > 300) return setValidationError("Title must be 3-300 characters");
    if (!content.trim()) return setValidationError("Content is required");
    create.mutate({ title: title.trim(), content: content.trim(), forumName },
      { onSuccess: (p) => navigate(`/r/${p.forumName}/p/${p.id}`) });
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-semibold mb-4">Create a new post</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="forum">Forum</Label>
          <select id="forum" value={forumName} onChange={(e) => setForumName(e.target.value)}
            className="border rounded h-9 w-full px-2 bg-white">
            <option value="">— pick a forum —</option>
            {forums.data?.map((f) => <option key={f.name} value={f.name}>r/{f.name}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="content">Content</Label>
          <Textarea id="content" rows={8} value={content} onChange={(e) => setContent(e.target.value)} />
        </div>
        {(validationError || create.isError) && (
          <Alert variant="destructive">
            <AlertDescription>{validationError ?? "Couldn't create the post."}</AlertDescription>
          </Alert>
        )}
        <Button type="submit" disabled={create.isPending}>{create.isPending ? "Posting…" : "Post"}</Button>
      </form>
    </div>
  );
}
