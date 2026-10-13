import { useLocation, Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export const BREADCRUMB_MAP: Record<string, string> = {
  admin: 'Admin Studio',
  content: 'Content Studio',
  users: 'User Directory',
  plans: 'Plans & Groups',
  audit: 'Audit Trail',
  dashboard: 'Overview',
  review: 'Review Queue',
  labs: 'Practice Labs',
  new: 'Create New',
  edit: 'Editor',
  series: 'Series Catalog',
  roadmaps: 'Roadmaps',
  contributor: 'Contributor Studio',
  create: 'Create Content',
};

export function AppBreadcrumb({ className }: { className?: string }) {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return null;
  }

  const breadcrumbs = [
    { label: 'Home', href: '/', isLast: false },
    ...segments.map((seg, idx) => ({
      label: BREADCRUMB_MAP[seg] || seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '),
      href: '/' + segments.slice(0, idx + 1).join('/'),
      isLast: idx === segments.length - 1,
    })),
  ];

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {breadcrumbs.map((crumb, idx) => (
          <span key={crumb.href} className="flex items-center gap-1.5">
            {idx > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {crumb.isLast ? (
                <BreadcrumbPage className="text-xs font-semibold text-foreground">
                  {crumb.label}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link
                    to={crumb.href}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {crumb.label}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </span>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
