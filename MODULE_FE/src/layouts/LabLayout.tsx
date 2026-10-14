/**
 * LabLayout — Full-screen canvas layout for Lab Workspace.
 *
 * No duplicate header or footer. LabWorkspacePage renders its own
 * unified, LeetCode-style top navigation bar to maximize vertical space.
 */
import { Outlet } from 'react-router-dom';

export function LabLayout() {
  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-background text-foreground">
      <Outlet />
    </div>
  );
}
