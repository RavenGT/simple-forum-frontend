import { Link } from "react-router-dom";
export default function NotFoundPage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">Page not found</h1>
      <Link className="text-blue-600 hover:underline" to="/">Back to home</Link>
    </div>
  );
}
