import { ExternalLink, BookOpen, GitFork } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function isValidHttpUrl(urlString?: string | null): boolean {
  if (!urlString || typeof urlString !== 'string') return false;
  const trimmed = urlString.trim();
  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export interface SampleProjectLinksProps {
  repoUrl?: string | null;
  swaggerUrl?: string | null;
  className?: string;
  size?: 'sm' | 'default';
  showEmptyState?: boolean;
}

export function SampleProjectLinks({
  repoUrl,
  swaggerUrl,
  className,
  size = 'sm',
  showEmptyState = false,
}: SampleProjectLinksProps) {
  const validRepo = isValidHttpUrl(repoUrl) ? repoUrl!.trim() : null;
  const validSwagger = isValidHttpUrl(swaggerUrl) ? swaggerUrl!.trim() : null;

  if (!validRepo && !validSwagger) {
    if (!showEmptyState) return null;
    return (
      <div className={cn('text-xs text-muted-foreground italic', className)} data-testid="sample-links-empty">
        No sample repository or documentation configured for this unit.
      </div>
    );
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)} data-testid="sample-project-links">
      {validRepo && (
        <Button
          variant="outline"
          size={size}
          asChild
          className="h-7 text-xs font-medium gap-1.5 border-border hover:bg-muted/60"
        >
          <a
            href={validRepo}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open Sample GitHub Repository"
            title="Open sample repository in new tab"
          >
            <GitFork className="size-3.5 text-muted-foreground" />
            <span>Sample Repo</span>
            <ExternalLink className="size-3 opacity-60 ml-0.5" />
          </a>
        </Button>
      )}

      {validSwagger && (
        <Button
          variant="outline"
          size={size}
          asChild
          className="h-7 text-xs font-medium gap-1.5 border-border hover:bg-muted/60"
        >
          <a
            href={validSwagger}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open Swagger API Documentation"
            title="Open Swagger API documentation in new tab"
          >
            <BookOpen className="size-3.5 text-sky-500" />
            <span>Swagger API</span>
            <ExternalLink className="size-3 opacity-60 ml-0.5" />
          </a>
        </Button>
      )}
    </div>
  );
}
