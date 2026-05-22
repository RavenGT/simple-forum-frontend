import { Link } from "react-router-dom";
import { useUser } from "@/features/auth/useUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export function TopNav() {
  const { userId, logout } = useUser();
  return (
    <header className="h-12 border-b bg-white flex items-center px-4 gap-4">
      <Link to="/" className="font-semibold tracking-tight">simple-forum</Link>
      <div className="flex-1 max-w-md">
        <Input
          placeholder="Search (coming soon)"
          disabled
          aria-label="Search"
          className="h-8"
        />
      </div>
      <div>
        {userId ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">u/{userId}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={logout}>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link to="/login" className="text-sm text-blue-600 hover:underline">
            Log in
          </Link>
        )}
      </div>
    </header>
  );
}
