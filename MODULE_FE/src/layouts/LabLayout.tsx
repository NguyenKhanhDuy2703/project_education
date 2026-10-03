/**
 * LabLayout — Slim navbar for full-screen Lab Workspace.
 *
 * No footer. The navbar only shows brand + user badge to maximise
 * vertical space for the code editor.
 */
import { Outlet, Link } from 'react-router-dom';
import { useAppSelector } from '@/stores/store';
import { Badge } from '@/components/ui/badge';

export function LabLayout() {
  const { user } = useAppSelector((s) => s.auth);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Slim top bar */}
      <header className="h-[56px] border-b border-border bg-card flex items-center px-4 justify-between shrink-0">
        <Link to="/" className="text-sm font-bold text-foreground tracking-tight">
          study<span className="text-primary">·</span>web
        </Link>
        {user && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:block">{user.name}</span>
            <Badge variant="outline" className="text-[10px] uppercase font-bold">
              {user.role}
            </Badge>
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
