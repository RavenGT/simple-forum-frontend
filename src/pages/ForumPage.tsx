import { useParams } from "react-router-dom";
export default function ForumPage() {
  const { forumName } = useParams();
  return <div className="p-6"><h1 className="text-xl font-semibold">r/{forumName}</h1></div>;
}
