import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-md py-24 text-center space-y-3">
      <h1 className="text-3xl font-semibold">404</h1>
      <p className="text-slate-600">That page doesn't exist.</p>
      <Link to="/" className="text-blue-600 hover:underline">Back to home</Link>
    </div>
  );
}
