import { useAuth } from "@/hooks/useAuth";
import { useApp } from "@/lib/store";
import { Menu, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const appUser = useApp(s => s.user);

  const handleLogout = async () => {
    try {
      await logout();
      // Redirect to login page after logout
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
      // Still redirect even if logout fails
      window.location.href = "/login";
    }
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex flex-1 items-center justify-start space-x-4">
          <a href="/" className="text-xl font-bold">Field Force Tracker</a>
        </div>
        
        <div className="flex items-center space-x-4">
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="User menu">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={4}>
                <DropdownMenuItem onClick={handleLogout}>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => window.location.href = "/login"}>
              Sign in
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
