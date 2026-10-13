/**
 * AdminTopicHierarchy — Parent-Child Interactive Hierarchy Management
 * Displays parent topics containing nested practice labs.
 */
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Folder, ExternalLink } from 'lucide-react';
import type { LabSeries } from '@/types/lab.types';

interface AdminTopicHierarchyProps {
  isLoading: boolean;
  topics: LabSeries[];
  onCreateTopic: () => void;
  onEditTopic: (topic: LabSeries) => void;
  onDeleteTopic: (id: string, title: string) => void;
  onDeleteLab: (id: string, title: string) => void;
}

export function AdminTopicHierarchy({
  isLoading,
  topics,
  onCreateTopic,
  onEditTopic,
  onDeleteTopic,
  onDeleteLab,
}: AdminTopicHierarchyProps) {
  const [collapsedTopics, setCollapsedTopics] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');

  const toggleCollapse = (topicId: string) => {
    setCollapsedTopics((prev) => ({
      ...prev,
      [topicId]: !prev[topicId],
    }));
  };

  const filteredTopics = topics.filter((t) => {
    const matchTopic =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchLab = (t.labs || []).some(
      (l) =>
        l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return matchTopic || matchLab;
  });

  const getFormatBadge = (formatType?: string, slug?: string) => {
    if (formatType === 'sql_worker' || slug?.includes('sql')) {
      return (
        <Badge variant="secondary" className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 font-sans font-semibold text-[10px]">
          SQL Sandbox
        </Badge>
      );
    }
    if (formatType === 'quizlet' || slug?.includes('quiz')) {
      return (
        <Badge variant="secondary" className="bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 font-sans font-semibold text-[10px]">
          Quiz Flashcard
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-sans font-semibold text-[10px]">
        Code Sandbox
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Loading topic and lab hierarchy...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border bg-card">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search topics or nested labs..."
            className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">
            Showing: <strong>{filteredTopics.length}</strong> Topics
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const allCollapsed = filteredTopics.reduce((acc, s) => ({ ...acc, [s.id]: true }), {});
              setCollapsedTopics((prev) => (Object.keys(prev).length === 0 ? allCollapsed : {}));
            }}
            className="text-xs h-7 px-2.5"
          >
            {Object.keys(collapsedTopics).length > 0 ? 'Expand All' : 'Collapse All'}
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {filteredTopics.length === 0 && (
        <div className="text-center py-16 border border-dashed rounded-2xl p-8 bg-card space-y-3">
          <p className="text-sm font-semibold text-foreground">No Matching Topics Found</p>
          <p className="text-xs text-muted-foreground">
            Try searching with different keywords or create a new course topic.
          </p>
          <Button onClick={onCreateTopic} size="sm" className="text-xs font-bold mt-2">
            + Create New Topic
          </Button>
        </div>
      )}

      {/* Hierarchy List */}
      <div className="space-y-5">
        {filteredTopics.map((topic) => {
          const isCollapsed = !!collapsedTopics[topic.id];
          const labs = topic.labs || [];
          const labsCount = topic._count?.labs ?? labs.length;

          return (
            <div
              key={topic.id}
              className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs transition-all hover:border-border/80"
            >
              {/* ── TOPIC HEADER ── */}
              <div className="p-4 sm:p-5 border-b border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center justify-center size-6 rounded bg-primary/10 text-primary shrink-0">
                      <Folder className="size-3.5" />
                    </div>
                    {getFormatBadge(topic.formatType, topic.slug)}
                    <Badge variant="outline" className="capitalize text-[10px] font-medium">
                      {topic.category || topic.topic || 'General'}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] font-medium capitalize">
                      {topic.level || 'Beginner'}
                    </Badge>
                    {topic.isProOnly && (
                      <Badge variant="secondary" className="border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 text-[10px] font-bold">
                        PRO
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-baseline gap-2">
                    <h3 className="text-base font-bold text-foreground tracking-tight">
                      {topic.title}
                    </h3>
                    <span className="text-xs font-mono text-muted-foreground/60 hidden sm:inline">
                      /{topic.slug}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed">
                    {topic.description}
                  </p>
                </div>

                {/* Topic Actions */}
                <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditTopic(topic)}
                    className="h-8 text-xs px-2.5"
                  >
                    Edit
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="h-8 text-xs px-2 text-muted-foreground hover:text-foreground hidden md:inline-flex gap-1"
                  >
                    <Link to={`/series/${topic.slug}`} target="_blank">
                      View <ExternalLink className="size-3" />
                    </Link>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteTopic(topic.id, topic.title)}
                    className="h-8 text-xs px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    Delete
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleCollapse(topic.id)}
                    className="h-8 text-xs px-2 font-mono"
                    title={isCollapsed ? 'Expand labs' : 'Collapse labs'}
                  >
                    {isCollapsed ? `[+] ${labsCount} labs` : '[-] Collapse'}
                  </Button>
                </div>
              </div>

              {/* ── NESTED LABS ── */}
              {!isCollapsed && (
                <div className="p-0">
                  {labs.length > 0 ? (
                    <Table className="text-xs">
                      <TableHeader>
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                          <TableHead className="w-12 h-9 py-2 px-4 font-bold">#</TableHead>
                          <TableHead className="h-9 py-2 px-4 font-bold">Lab Title</TableHead>
                          <TableHead className="h-9 py-2 px-4 font-bold">Sandbox</TableHead>
                          <TableHead className="h-9 py-2 px-4 font-bold">Duration</TableHead>
                          <TableHead className="h-9 py-2 px-4 font-bold">Access Plan</TableHead>
                          <TableHead className="h-9 py-2 px-4 text-right font-bold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {labs.map((lab: any, idx: number) => (
                          <TableRow key={lab.id} className="hover:bg-muted/20">
                            <TableCell className="py-2.5 px-4 font-mono font-semibold text-muted-foreground">
                              #{lab.order || idx + 1}
                            </TableCell>

                            <TableCell className="py-2.5 px-4 font-medium text-foreground">
                              <div className="flex flex-col">
                                <span className="font-semibold text-foreground">{lab.title}</span>
                                <span className="text-[11px] font-mono text-muted-foreground/60">{lab.slug}</span>
                              </div>
                            </TableCell>

                            <TableCell className="py-2.5 px-4">
                              <Badge variant="outline" className="text-[10px] font-sans font-semibold uppercase">
                                {lab.sandboxType || topic.formatType || 'js_worker'}
                              </Badge>
                            </TableCell>

                            <TableCell className="py-2.5 px-4 text-muted-foreground">
                              {lab.estimatedMinutes || 20} mins
                            </TableCell>

                            <TableCell className="py-2.5 px-4">
                              {lab.isProOnly ? (
                                <Badge variant="secondary" className="text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                  PRO
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                                  Free
                                </Badge>
                              )}
                            </TableCell>

                            <TableCell className="py-2.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  asChild
                                  className="h-7 text-xs px-2 text-primary hover:text-primary font-medium"
                                >
                                  <Link to={`/labs/${lab.slug || lab.id}`} target="_blank">
                                    Preview
                                  </Link>
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onDeleteLab(lab.id, lab.title)}
                                  className="h-7 text-xs px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="p-6 text-center bg-muted/10 border-t border-dashed border-border">
                      <p className="text-xs text-muted-foreground">
                        This topic currently has no practice labs.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
