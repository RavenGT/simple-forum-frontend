import { useNavigate, useSearchParams } from "react-router-dom";
import { LoginForm } from "@/features/auth/LoginForm";

export default function LoginPage() {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const returnTo = search.get("returnTo") || "/";

  return (
    <div className="mx-auto max-w-md py-16">
      <h1 className="text-2xl font-semibold mb-2">Log in</h1>
      <p className="text-sm text-slate-600 mb-6">
        No password. Pick a username — it identifies you to the server.
      </p>
      <LoginForm onSuccess={() => navigate(returnTo, { replace: true })} />
    </div>
  );
}
