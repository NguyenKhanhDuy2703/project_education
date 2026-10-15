import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookMarked, BookOpen, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function UserSavedSeriesView() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="border-b border-border pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Saved Series
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Curated learning series and modules you have bookmarked for later study.
        </p>
      </div>

      <Card className="border-dashed border-2 border-border/80">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
          <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <BookMarked className="size-6" />
          </div>
          <div className="space-y-1.5 max-w-sm">
            <h3 className="text-base font-semibold text-foreground">No saved series yet</h3>
            <p className="text-xs text-muted-foreground">
              Explore our comprehensive series catalog and bookmark topics you'd like to master.
            </p>
          </div>
          <Button size="sm" asChild className="gap-2 text-xs font-semibold">
            <Link to="/series">
              <BookOpen className="size-3.5" />
              Explore Series Catalog <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
