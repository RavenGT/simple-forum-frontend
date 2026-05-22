import { useParams } from "react-router-dom";
export default function PostPage() {
  const { forumName, postId } = useParams();
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">Post {postId}</h1>
      <p className="text-sm text-slate-600">in r/{forumName}</p>
    </div>
  );
}
