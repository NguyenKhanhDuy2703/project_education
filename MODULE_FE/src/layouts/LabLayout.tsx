/**
 * LabLayout — Full-screen canvas layout for Lab Workspace.
 *
 * No duplicate header or footer. LabWorkspacePage renders its own
 * unified, LeetCode-style top navigation bar to maximize vertical space.
 */
import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';

export function LabLayout() {
  useEffect(() => {
    // Lock window scroll so browser focus/scroll never bounces the IDE shell
    const origBodyOverflow = document.body.style.overflow;
    const origHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    window.scrollTo(0, 0);

    return () => {
      document.body.style.overflow = origBodyOverflow;
      document.documentElement.style.overflow = origHtmlOverflow;
    };
  }, []);

  return (
    <div className="fixed inset-0 h-dvh h-screen w-full overflow-hidden flex flex-col bg-background text-foreground">
      <Outlet />
    </div>
  );
}
