import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Terminal, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function UserLabSubmissionsView() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="border-b border-border pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Lab Submissions
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          History of all your interactive browser lab test runs, evaluations, and solutions.
        </p>
      </div>

      <Card className="border-dashed border-2 border-border/80">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
          <div className="size-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-6" />
          </div>
          <div className="space-y-1.5 max-w-sm">
            <h3 className="text-base font-semibold text-foreground">Track your practical solutions</h3>
            <p className="text-xs text-muted-foreground">
              Complete interactive coding tasks to see execution logs, test outputs, and submission grades here.
            </p>
          </div>
          <Button size="sm" asChild className="gap-2 text-xs font-semibold">
            <Link to="/series">
              <Terminal className="size-3.5" />
              Practice in Labs <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
