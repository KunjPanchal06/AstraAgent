// ════════════════════════════════════════════════════════════════
// FILE: components/agent/user-menu.jsx
// PURPOSE: User profile dropdown menu (Sign out, Settings, etc).
// EXPORTS: UserMenu
// DEPENDS ON: react-router-dom, lucide-react, ui/dropdown-menu
// ════════════════════════════════════════════════════════════════
import { useNavigate } from 'react-router-dom';
import { LogOut, User as UserIcon, ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function UserMenu() {
  const navigate = useNavigate();
  
  // Mocked session until SQLite auth is integrated
  const session = {
    user: {
      name: "Astra Agent",
      email: "agent@astra.io"
    }
  };

  const initials = (session.user.name || session.user.email || '?').split(/[@\s]/)[0].slice(0, 2).toUpperCase();
  
  return <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 px-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="bg-emerald-500/10 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-[80px] truncate text-xs sm:inline">
            {session.user.name || session.user.email?.split('@')[0]}
          </span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">{session.user.name || 'User'}</span>
          <span className="truncate text-xs text-muted-foreground">
            {session.user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => {
          localStorage.removeItem('token');
          navigate('/');
        }} className="gap-2 text-rose-600 focus:text-rose-600 dark:text-rose-400">
          <LogOut className="h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>;
}