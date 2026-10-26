import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Compass,
  ArrowRight,
  Database,
  Terminal,
  Server,
  Cpu,
  CheckCircle2,
  Sparkles,
  Layers,
  Clock,
  BookOpen,
} from 'lucide-react';

interface RoadmapPreview {
  id: string;
  title: string;
  category: string;
  level: string;
  estimatedWeeks: number;
  description: string;
  milestones: string[];
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}

const UPCOMING_ROADMAPS: RoadmapPreview[] = [
  {
    id: 'db-mastery',
    title: 'Database Architecture & SQL Optimization',
    category: 'Databases & Systems',
    level: 'Intermediate to Advanced',
    estimatedWeeks: 8,
    description:
      'From schema design and ACID guarantees to index selection, query execution plan analysis, and connection pooling.',
    milestones: ['PostgreSQL Internals', 'Execution Plans & Indexing', 'Transaction Concurrency', 'Distributed Caching'],
    icon: Database,
    accentColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  },
  {
    id: 'fullstack-ts',
    title: 'Modern Full-Stack TypeScript Engineering',
    category: 'Full-Stack Development',
    level: 'Beginner to Intermediate',
    estimatedWeeks: 12,
    description:
      'Build scalable web applications from scratch using React, NestJS, Prisma, and comprehensive testing methodologies.',
    milestones: ['TypeScript Foundations', 'React Component Architecture', 'NestJS Modular Backend', 'Full-stack Integration'],
    icon: Terminal,
    accentColor: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
  },
  {
    id: 'devops-infra',
    title: 'DevOps & Cloud-Native Delivery',
    category: 'Infrastructure',
    level: 'Intermediate',
    estimatedWeeks: 10,
    description:
      'Containerization, CI/CD pipelines, container orchestration, and real-time observability for modern distributed apps.',
    milestones: ['Docker Containerization', 'GitHub Actions Pipelines', 'Kubernetes Fundamentals', 'Monitoring & Metrics'],
    icon: Server,
    accentColor: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  },
  {
    id: 'frontend-perf',
    title: 'Advanced Frontend Systems & Performance',
    category: 'Frontend Engineering',
    level: 'Advanced',
    estimatedWeeks: 6,
    description:
      'Deep dive into browser rendering pipelines, Web Workers, memory management, bundle optimization, and micro-frontends.',
    milestones: ['Browser Critical Rendering Path', 'Web Workers & Multithreading', 'Bundle Budgeting', 'Virtual DOM Benchmarking'],
    icon: Cpu,
    accentColor: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
  },
];

export function RoadmapsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero Section ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border bg-radial from-primary/5 via-background to-background py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 text-center max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold">
            <Sparkles className="size-3.5" />
            <span>Coming Soon • Milestone Q2 2026</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground leading-tight">
            Developer Learning Roadmaps <br className="hidden sm:inline" />
            <span className="text-primary">Are Coming Soon</span>
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            We are curating step-by-step guided learning tracks that connect theory, browser-based practice labs, and automated skill evaluations into clear career roadmaps.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link to="/series">
              <Button size="lg" className="h-10 text-xs sm:text-sm font-bold gap-2 shadow-sm">
                <BookOpen className="size-4" />
                <span>Explore Active Practice Series</span>
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Feature Highlights ─────────────────────────────────────────── */}
      <section className="container mx-auto px-4 sm:px-6 py-12 max-w-5xl">
        <div className="text-center space-y-2 mb-10">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            What to Expect in StudyIT Roadmaps
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Every roadmap combines structured milestones with real interactive code execution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-3">
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Compass className="size-5" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Step-by-Step Curriculum</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Carefully sequenced modules progressing from fundamental primitives to production-grade architecture patterns.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-3">
            <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Layers className="size-5" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Hands-on Practice Labs</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              No passive reading. Every concept is reinforced with in-browser practice labs executed safely via Web Workers.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-3">
            <div className="size-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <CheckCircle2 className="size-5" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Skill Verification</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Automated test assertions score each submission instantly and track your learning progress on your dashboard.
            </p>
          </div>
        </div>

        {/* ── Preview Tracks in Development ───────────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div>
              <h3 className="text-base font-bold text-foreground">Upcoming Tracks in Development</h3>
              <p className="text-xs text-muted-foreground">
                Roadmaps currently being authored by our engineering contributors.
              </p>
            </div>
            <Badge variant="outline" className="text-xs font-mono font-semibold">
              4 Tracks Planned
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            {UPCOMING_ROADMAPS.map((track) => {
              const Icon = track.icon;

              return (
                <div
                  key={track.id}
                  className="p-5 rounded-2xl border border-border bg-card/60 hover:bg-card hover:border-primary/40 transition-all shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`size-10 rounded-xl border flex items-center justify-center ${track.accentColor}`}>
                          <Icon className="size-5" />
                        </div>
                        <div>
                          <Badge variant="outline" className="text-[10px] font-semibold mb-1">
                            {track.category}
                          </Badge>
                          <h4 className="text-sm font-bold text-foreground tracking-tight">
                            {track.title}
                          </h4>
                        </div>
                      </div>

                      <Badge variant="secondary" className="text-[10px] uppercase font-bold shrink-0">
                        In Authoring
                      </Badge>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {track.description}
                    </p>

                    <div className="pt-2">
                      <p className="text-[11px] font-semibold text-foreground/80 mb-1.5">
                        Planned Milestones:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {track.milestones.map((m) => (
                          <span
                            key={m}
                            className="px-2 py-0.5 rounded text-[11px] bg-muted text-muted-foreground font-mono"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border/40 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="size-3.5" />
                      {track.estimatedWeeks} Weeks Est.
                    </span>
                    <span className="font-semibold text-foreground/70">
                      {track.level}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Bottom CTA ──────────────────────────────────────────────── */}
        <div className="mt-16 p-8 rounded-2xl border border-primary/20 bg-primary/5 text-center space-y-3">
          <h3 className="text-base sm:text-lg font-bold text-foreground">
            Want to start practicing immediately?
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto">
            You don't need to wait for the roadmaps to launch. Dive into our live curriculum series and test your skills directly in the interactive sandbox.
          </p>
          <div className="pt-2">
            <Link to="/series">
              <Button size="sm" className="font-bold text-xs gap-1.5 shadow-xs">
                <span>View All Practice Series</span>
                <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
