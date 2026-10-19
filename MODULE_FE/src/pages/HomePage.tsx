import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAppSelector } from '@/stores/store';
import { seriesApi } from '@/features/lab/api/series.api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowRight,
  CheckCircle2,
  Bug,
  Server,
  Cpu,
  Layers,
  Zap,
  Play,
  Terminal,
  Clock,
  ShieldCheck,
  Check,
  Flame,
  BookOpen,
  Lock,
} from 'lucide-react';
import { DIFFICULTY_LABELS } from '@/constants/ui.constants';
import { cn } from '@/lib/utils';
import {
  normalizeTopicKey,
  getTopicTitle,
  getTopicBadgeClass,
} from '@/services/topicTags.service';


export function HomePage() {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const isLoggedIn = isAuthenticated || Boolean(user);

  const { data: seriesList, isLoading: isLoadingSeries } = useQuery({
    queryKey: ['series'],
    queryFn: () => seriesApi.getAll(),
  });

  return (
    <div className="flex flex-col min-h-screen">
      {/* ──────────────────────────────────────────────────────────────────────────
          1. HERO SECTION
      ────────────────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 border-b border-border bg-gradient-to-b from-accent/30 via-background to-background">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
          <div className="flex flex-col items-center text-center space-y-6 max-w-3xl mx-auto">
            {/* Top Pill Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wide animate-in fade-in duration-500">
              <Zap className="size-3.5" />
              <span>
                {isLoggedIn
                  ? `Welcome back, ${user?.name || 'Learner'}!`
                  : 'Next-Generation Interactive IT Lab Platform'}
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15]">
              Master IT with <span className="text-primary">hands-on practice.</span>
              <br />
              No endless passive lectures.
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
              Every Series is a focused 15–30 minute practical lab track. Write code, debug real bugs, and run automated tests directly in your browser around <strong>a production-grade enterprise project</strong>.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link to="/series">
                <Button size="lg" className="h-11 px-8 font-semibold gap-2 shadow-sm text-sm sm:text-base">
                  <Play className="size-4 fill-current" /> Start Lab Practice
                </Button>
              </Link>
              {!isLoggedIn && (
                <Link to="/register">
                  <Button variant="outline" size="lg" className="h-11 px-6 text-sm sm:text-base gap-2">
                    Register Free <ArrowRight className="size-4" />
                  </Button>
                </Link>
              )}
            </div>

            {/* Value Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 w-full max-w-2xl text-xs text-muted-foreground">
              <div className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-card/60 border border-border">
                <CheckCircle2 className="size-4 text-primary shrink-0" />
                <span>Runs directly in your browser</span>
              </div>
              <div className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-card/60 border border-border">
                <CheckCircle2 className="size-4 text-primary shrink-0" />
                <span>Web Worker automated scoring</span>
              </div>
              <div className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-card/60 border border-border">
                <CheckCircle2 className="size-4 text-primary shrink-0" />
                <span>1 Unified enterprise sample project</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          POPULAR / FEATURED SERIES LAB SECTION
      ────────────────────────────────────────────────────────────────────────── */}
      <section className="py-12 sm:py-16 border-b border-border bg-card/25">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                <Flame className="size-3.5 text-amber-500 fill-amber-500" />
                <span>Popular Practice Series</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Featured Lab Series
              </h2>
              <p className="text-sm text-muted-foreground">
                Start practicing directly in your browser with real enterprise-grade projects.
              </p>
            </div>
            <Link to="/series">
              <Button variant="ghost" size="sm" className="gap-1.5 text-primary hover:text-primary font-semibold text-xs sm:text-sm">
                View All Series ({seriesList?.length ?? 0}) <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>

          {/* Grid of Popular Series */}
          {isLoadingSeries ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-52 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {(seriesList ?? []).slice(0, 3).map((series) => {
                const totalLabs = series._count?.labs ?? series.labs?.length ?? series.totalLabs ?? 0;
                const estMinutes =
                  series.estimatedMinutes ??
                  (series.labs && series.labs.length > 0
                    ? series.labs.reduce((acc, l) => acc + (l.durationMinutes || l.estimatedMinutes || 20), 0)
                    : totalLabs > 0
                    ? totalLabs * 20
                    : 30);
                const topicKey = normalizeTopicKey(series.category || series.topic || 'general');
                const topicTitle = getTopicTitle(topicKey, series.title);
                const topicClass = getTopicBadgeClass(topicKey);
                return (
                  <Link
                    key={series.id}
                    to={`/series/${series.slug}`}
                    className="group focus-visible:outline-none flex"
                  >
                    <Card className="flex flex-col w-full hover:border-primary/60 transition-all hover:shadow-md cursor-pointer bg-card">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <Badge
                            variant="outline"
                            className={cn('text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 border truncate', topicClass)}
                          >
                            {topicTitle}
                          </Badge>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {series.isProOnly && (
                              <Badge variant="secondary" className="text-[10px] gap-1 h-5 px-1.5 font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                <Lock className="size-2.5" /> Pro
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-medium capitalize">
                              {DIFFICULTY_LABELS[series.level as keyof typeof DIFFICULTY_LABELS] ?? series.level}
                            </Badge>
                          </div>
                        </div>
                        <CardTitle className="text-base font-bold leading-snug group-hover:text-primary transition-colors">
                          {series.title}
                        </CardTitle>
                        <CardDescription className="text-xs leading-relaxed line-clamp-2 mt-1">
                          {series.description}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="mt-auto border-t border-border pt-3 flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <BookOpen className="size-3.5" />
                          {totalLabs} {totalLabs === 1 ? 'lab' : 'labs'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="size-3.5" />
                          ~{estMinutes} mins
                        </span>
                        <span className="flex items-center gap-1 text-primary font-semibold group-hover:translate-x-0.5 transition-transform">
                          Learn <ArrowRight className="size-3" />
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          2. SECTION: WHY STUDYIT (VALUE PROPOSITION)
      ────────────────────────────────────────────────────────────────────────── */}
      <section className="py-14 sm:py-20 border-b border-border bg-card/40">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Modern Learning Methodology</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Why bite-sized Series Labs?
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Passive video courses have an 85% drop-off rate. StudyIT focuses on immediate hands-on coding and tangible feedback.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-border bg-card shadow-sm hover:border-primary/50 transition-all">
              <CardHeader className="space-y-3">
                <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Clock className="size-5" />
                </div>
                <CardTitle className="text-lg">15–30 Minute Labs</CardTitle>
                <CardDescription className="leading-relaxed">
                  Every lab tackles a complete real-world task: classify a bug, test an endpoint, code a REST API, or optimize a Dockerfile.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border bg-card shadow-sm hover:border-primary/50 transition-all">
              <CardHeader className="space-y-3">
                <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Terminal className="size-5" />
                </div>
                <CardTitle className="text-lg">Zero Complex Setup</CardTitle>
                <CardDescription className="leading-relaxed">
                  All exercises compile and execute using isolated Web Workers directly in your browser. Practice anywhere, anytime.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border bg-card shadow-sm hover:border-primary/50 transition-all">
              <CardHeader className="space-y-3">
                <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <ShieldCheck className="size-5" />
                </div>
                <CardTitle className="text-lg">Instant Automated Feedback</CardTitle>
                <CardDescription className="leading-relaxed">
                  Click 'Run Tests' to inspect detailed test case assertions, pinpoint errors in your logic, and iterate quickly.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          3. SECTION: CORE TRACKS
      ────────────────────────────────────────────────────────────────────────── */}
      <section id="tracks" className="py-14 sm:py-20 border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Learning Pathways</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Choose the specialization you want to master
              </h2>
              <p className="text-sm text-muted-foreground">
                Designed to match real-world technical hiring benchmarks at technology companies.
              </p>
            </div>
            <Link to="/series">
              <Button variant="ghost" size="sm" className="gap-1.5 text-primary hover:text-primary font-semibold text-xs sm:text-sm">
                Browse All Lab Series <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Track 1: Tester */}
            <Card className="flex flex-col justify-between border-border bg-card shadow-sm hover:border-primary/50 transition-all">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="size-10 rounded-lg bg-blue-500/10 text-primary flex items-center justify-center">
                    <Bug className="size-5" />
                  </div>
                  <Badge variant="outline" className="text-[11px] font-semibold">Track 01</Badge>
                </div>
                <CardTitle className="text-lg">Professional QA &amp; Tester</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  From manual testing foundations and standard test cases to Postman API verification and ISTQB exam preparation.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-2 text-xs text-muted-foreground border-t border-border pt-4">
                <div className="flex items-start gap-2">
                  <Check className="size-3.5 text-primary shrink-0 mt-0.5" />
                  <span>Manual testing workflows &amp; Bug Life Cycle</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="size-3.5 text-primary shrink-0 mt-0.5" />
                  <span>REST API validation with Postman &amp; Swagger</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="size-3.5 text-primary shrink-0 mt-0.5" />
                  <span>ISTQB question banks with detailed explanations</span>
                </div>
              </CardContent>

              <CardFooter className="pt-2">
                <Link to="/series?topic=testing" className="w-full">
                  <Button variant="outline" size="sm" className="w-full text-xs font-semibold gap-1.5 hover:bg-primary hover:text-primary-foreground">
                    Explore QA &amp; Testing Series <ArrowRight className="size-3.5" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            {/* Track 2: Backend */}
            <Card className="flex flex-col justify-between border-border bg-card shadow-sm hover:border-primary/50 transition-all">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="size-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Server className="size-5" />
                  </div>
                  <Badge variant="outline" className="text-[11px] font-semibold">Track 02</Badge>
                </div>
                <CardTitle className="text-lg">Backend Developer</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  Build enterprise-ready backend architectures with NestJS, Prisma ORM, PostgreSQL, and JWT silent refresh security.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-2 text-xs text-muted-foreground border-t border-border pt-4">
                <div className="flex items-start gap-2">
                  <Check className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>Production RESTful API design &amp; validation</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>PostgreSQL &amp; Prisma ORM migrations</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>Secure JWT authentication, HttpOnly cookies &amp; RBAC</span>
                </div>
              </CardContent>

              <CardFooter className="pt-2">
                <Link to="/series?topic=backend" className="w-full">
                  <Button variant="outline" size="sm" className="w-full text-xs font-semibold gap-1.5 hover:bg-emerald-600 hover:text-white">
                    Explore Backend Series <ArrowRight className="size-3.5" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            {/* Track 3: DevOps */}
            <Card className="flex flex-col justify-between border-border bg-card shadow-sm hover:border-primary/50 transition-all">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="size-10 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Cpu className="size-5" />
                  </div>
                  <Badge variant="outline" className="text-[11px] font-semibold">Track 03</Badge>
                </div>
                <CardTitle className="text-lg">DevOps &amp; CI/CD</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  Containerize applications with Docker, coordinate multi-service stacks with Compose, and automate pipelines with GitHub Actions.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-2 text-xs text-muted-foreground border-t border-border pt-4">
                <div className="flex items-start gap-2">
                  <Check className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <span>Multi-stage production Dockerfiles</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <span>Environment orchestration with Docker Compose</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <span>Automated testing with GitHub Actions CI/CD</span>
                </div>
              </CardContent>

              <CardFooter className="pt-2">
                <Link to="/series?topic=devops" className="w-full">
                  <Button variant="outline" size="sm" className="w-full text-xs font-semibold gap-1.5 hover:bg-amber-600 hover:text-white">
                    Explore DevOps Series <ArrowRight className="size-3.5" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          4. SECTION: INTERACTIVE WORKSPACE SHOWCASE
      ────────────────────────────────────────────────────────────────────────── */}
      <section className="py-14 sm:py-20 border-b border-border bg-card/30">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Intuitive Workspace Interface</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Experience coding like a real engineering team
            </h2>
            <p className="text-sm text-muted-foreground">
              Read specs, write code, and observe test runners execute automatically in your browser without switching screens.
            </p>
          </div>

          {/* Simulated Lab Workspace Browser Window */}
          <div className="rounded-xl border border-border bg-card shadow-lg overflow-hidden">
            {/* Window title bar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-muted/60 border-b border-border text-xs">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-red-400" />
                <span className="size-3 rounded-full bg-yellow-400" />
                <span className="size-3 rounded-full bg-green-400" />
                <span className="font-mono text-muted-foreground ml-2 text-[11px]">Lab Workspace · Lab #01: Classify Bug Severity</span>
              </div>
              <Badge variant="secondary" className="text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                ● Automated Scoring
              </Badge>
            </div>

            {/* Window Content: 2 Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">
              {/* Left Column: Requirements & Instructions */}
              <div className="p-5 sm:p-6 space-y-4 bg-card">
                <div className="space-y-1">
                  <Badge variant="outline" className="text-[10px] uppercase font-bold">Challenge Spec</Badge>
                  <h4 className="text-sm font-bold text-foreground">Write a function to classify bug severity</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Build a <code className="font-mono bg-muted px-1 py-0.5 rounded text-[11px]">classifyBug(desc)</code> function to classify issues into: critical, major, minor, or trivial based on keywords in the error description.
                  </p>
                </div>

                <div className="rounded-lg bg-muted/40 p-3 space-y-2 text-xs">
                  <p className="font-semibold text-foreground text-[11px]">Classification Rules:</p>
                  <ul className="space-y-1 text-muted-foreground text-[11px]">
                    <li>• Contains "crash" or "data loss" → <code className="text-red-500 font-semibold">'critical'</code></li>
                    <li>• Contains "broken" or "error" → <code className="text-amber-500 font-semibold">'major'</code></li>
                    <li>• Contains "slow" or "delay" → <code className="text-blue-500 font-semibold">'minor'</code></li>
                    <li>• Other cases → <code className="text-muted-foreground font-semibold">'trivial'</code></li>
                  </ul>
                </div>
              </div>

              {/* Right Column: Code & Test Output */}
              <div className="flex flex-col bg-muted/20">
                {/* Code editor snippet */}
                <div className="p-4 font-mono text-xs border-b border-border bg-card/80 text-foreground overflow-x-auto">
                  <p className="text-muted-foreground text-[11px] mb-2">// 1. Write code to solve challenge requirements</p>
                  <p className="text-blue-600 dark:text-blue-400">function <span className="text-amber-600 dark:text-amber-300">classifyBug</span>(desc) &#123;</p>
                  <p className="pl-4 text-muted-foreground">const text = desc.toLowerCase();</p>
                  <p className="pl-4 text-purple-600 dark:text-purple-400">if <span className="text-foreground">(text.includes('crash') || text.includes('data loss'))</span> &#123;</p>
                  <p className="pl-8 text-emerald-600 dark:text-emerald-400">return 'critical';</p>
                  <p className="pl-4 text-purple-600 dark:text-purple-400">&#125;</p>
                  <p className="pl-4 text-muted-foreground">... // Other cases</p>
                  <p className="text-blue-600 dark:text-blue-400">&#125;</p>
                </div>

                {/* Test results banner */}
                <div className="p-4 space-y-2 bg-emerald-500/5">
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="size-4" /> Test Suite: 5/5 PASSED (100%)</span>
                    <span className="font-mono text-[10px]">12ms</span>
                  </div>
                  <div className="space-y-1 font-mono text-[11px] text-muted-foreground">
                    <p className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">✓ Assert('Crash = Critical') — PASSED</p>
                    <p className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">✓ Assert('Data loss = Critical') — PASSED</p>
                    <p className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">✓ Assert('Broken = Major') — PASSED</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          5. SECTION: 1 UNIFIED SAMPLE PROJECT
      ────────────────────────────────────────────────────────────────────────── */}
      <section className="py-14 sm:py-20 border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl space-y-12">
          <div className="rounded-2xl border border-border bg-gradient-to-br from-card via-card to-accent/20 p-6 sm:p-10 shadow-sm space-y-8">
            <div className="max-w-2xl space-y-3">
              <Badge className="bg-primary text-primary-foreground text-xs font-semibold">Core Differentiator</Badge>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                One Unified Project — Connecting Every Specialization
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Instead of disconnected, throwaway exercises, every lab across all subjects contributes to a single complete web application. Understand the full picture of team collaboration.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-border bg-background/80 space-y-2">
                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                  <Bug className="size-4" />
                </div>
                <h4 className="font-bold text-sm text-foreground">Tester</h4>
                <p className="text-xs text-muted-foreground">Inspect specs, discover intentional bugs, and write standard test cases on the project.</p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-background/80 space-y-2">
                <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                  <Server className="size-4" />
                </div>
                <h4 className="font-bold text-sm text-foreground">Backend</h4>
                <p className="text-xs text-muted-foreground">Code RESTful APIs, connect PostgreSQL, and fulfill business logic according to test specs.</p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-background/80 space-y-2">
                <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
                  <Cpu className="size-4" />
                </div>
                <h4 className="font-bold text-sm text-foreground">DevOps</h4>
                <p className="text-xs text-muted-foreground">Author Dockerfiles and configure CI/CD pipelines to run test suites automatically on commit.</p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-background/80 space-y-2">
                <div className="size-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs">
                  <Layers className="size-4" />
                </div>
                <h4 className="font-bold text-sm text-foreground">Frontend</h4>
                <p className="text-xs text-muted-foreground">Intuitive user interface that empowers learners to verify full end-to-end data flows.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          6. SECTION: HOW IT WORKS (4 STEPS)
      ────────────────────────────────────────────────────────────────────────── */}
      <section className="py-14 sm:py-20 border-b border-border bg-card/30">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Simple Workflow</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Start learning in 4 simple steps
            </h2>
            <p className="text-sm text-muted-foreground">
              Zero environment setup required. No complex local tooling needed.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-xl border border-border bg-card space-y-3 relative">
              <span className="text-3xl font-black text-primary/20">01</span>
              <h4 className="font-bold text-sm text-foreground">Choose a Lab Series</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Select QA Testing, Backend, or DevOps suited to your current learning objectives.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-border bg-card space-y-3 relative">
              <span className="text-3xl font-black text-primary/20">02</span>
              <h4 className="font-bold text-sm text-foreground">Review Specs &amp; Starter Code</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Examine requirement documentation, acceptance criteria, and provided starter templates.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-border bg-card space-y-3 relative">
              <span className="text-3xl font-black text-primary/20">03</span>
              <h4 className="font-bold text-sm text-foreground">Code &amp; Test Interactively</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Write code directly and click 'Run Tests' to receive immediate Web Worker test feedback.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-border bg-card space-y-3 relative">
              <span className="text-3xl font-black text-primary/20">04</span>
              <h4 className="font-bold text-sm text-foreground">Track Your Progress</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Complete labs, unlock the next challenge, and maintain your learning streak on the Dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          7. SECTION: CALL TO ACTION (CTA)
      ────────────────────────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
          <div className="rounded-3xl border border-border bg-gradient-to-r from-primary/10 via-accent/40 to-primary/10 p-8 sm:p-14 text-center space-y-6">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground max-w-xl mx-auto leading-tight">
              {isLoggedIn
                ? 'Continue leveling up your real-world IT engineering skills'
                : 'Ready to master hands-on IT engineering skills?'}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto">
              {isLoggedIn
                ? 'Track your progress, finish interactive lab series, and review your solutions today.'
                : 'Join thousands of learners practicing daily on StudyIT. Start with your first lab completely free.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link to="/series">
                <Button size="lg" className="h-11 px-8 font-semibold shadow-md gap-2">
                  <Play className="size-4 fill-current" /> Explore All Lab Series
                </Button>
              </Link>
              {!isLoggedIn && (
                <Link to="/register">
                  <Button variant="outline" size="lg" className="h-11 px-6">
                    Create Free Account <ArrowRight className="size-4" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
