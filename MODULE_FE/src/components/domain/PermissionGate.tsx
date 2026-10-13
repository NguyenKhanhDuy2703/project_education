import React from 'react';
import type { PermissionCode } from '@/types/user.types';
import { usePermission } from '@/features/auth/permissions';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface PermissionGateProps {
  permission: PermissionCode;
  context?: { authorId?: string };
  children: React.ReactNode;
  fallback?: React.ReactNode;
  disableInsteadOfHide?: boolean;
  disabledTooltip?: string;
}

/**
 * PermissionGate conditionally renders UI elements based on effective permissions.
 * Supports hiding completely or rendering as disabled with a descriptive tooltip.
 */
export function PermissionGate({
  permission,
  context,
  children,
  fallback = null,
  disableInsteadOfHide = false,
  disabledTooltip = 'You do not have permission to perform this action',
}: PermissionGateProps) {
  const isAllowed = usePermission(permission, context);

  if (isAllowed) {
    return <>{children}</>;
  }

  if (disableInsteadOfHide) {
    return (
      <Tooltip delayDuration={150}>
        <TooltipTrigger asChild>
          <span className="inline-flex cursor-not-allowed opacity-50 pointer-events-auto">
            {React.isValidElement(children)
              ? React.cloneElement(children as React.ReactElement<{ disabled?: boolean; tabIndex?: number }>, {
                  disabled: true,
                  tabIndex: -1,
                })
              : children}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs">{disabledTooltip}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return <>{fallback}</>;
}
